// status / plan / apply / uninstall.
//
// Error aggregation lives here: each agent is planned and applied inside its
// own try, failures accumulate, and the process fails only after every agent
// has been attempted. One unwritable agent must not abort the others.

import { homedir } from 'node:os';
import { resolve } from 'node:path';
import * as out from './out.mjs';
import {
  CONTENT_VERSION, LOCK_DIR as LOCK_DIR_LEGACY, PKG_NAME, PKG_VERSION, agents,
  lockDir, lockFile, lockNeedsGitignore, skills,
} from './content.mjs';
import { exists, isWritable, abs } from './fsx.mjs';
import { AGENTS, buildPlan, detectAll, installedCounts, skillsDir } from './hosts.mjs';
import * as lockfile from './lock.mjs';
import { dedupe, execute, isWritableState, preview, pruneDirs, revert } from './actions.mjs';
import { removeDirIfEmpty, removeFile } from './fsx.mjs';
import { askAgents } from './prompt.mjs';
import { RESTART } from './render.mjs';

const RUN = 'sw-ecosystem-agentic-harness';

class UsageError extends Error {
  constructor(message, help) { super(message); this.help = help; }
}

/** Parse the flags every command shares. */
export function buildContext(argv, command) {
  const agents = [];
  let scope = 'project';
  let root = process.cwd();
  let yes = false;
  let projectWiki;
  let asJson = false;
  let verbose = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--yes' || arg === '-y') { yes = true; continue; }
    if (arg === '--json') { asJson = true; continue; }
    if (arg === '--verbose') { verbose = true; continue; }
    if (arg === '--agent') {
      const value = argv[++i];
      if (!AGENTS.includes(value)) {
        throw new UsageError(`unknown --agent ${value ?? '(missing)'}`,
          AGENTS.map((a) => `${RUN} ${command} --agent ${a}`));
      }
      agents.push(value);
      continue;
    }
    if (arg === '--scope') {
      const value = argv[++i];
      if (value !== 'project' && value !== 'user') {
        throw new UsageError(`unknown --scope ${value ?? '(missing)'}`,
          [`${RUN} ${command} --scope project`, `${RUN} ${command} --scope user`]);
      }
      scope = value;
      continue;
    }
    if (arg === '--root') { root = argv[++i] ?? root; continue; }
    if (arg === '--project-wiki') { projectWiki = argv[++i]; continue; }
    throw new UsageError(`unknown option ${arg}`, [`${RUN} guide`, `${RUN} ${command}`]);
  }

  out.setFormat(asJson ? 'json' : 'human');
  out.setVerbose(verbose);

  // User scope writes under $HOME; project scope stays in the repository.
  if (scope === 'user') root = homedir();
  root = resolve(root);
  if (!exists(root)) throw new UsageError(`--root does not exist: ${root}`, [`${RUN} ${command} --root .`]);

  return {
    root, scope, yes, projectWiki, json: asJson, verbose,
    // Empty means "nothing chosen yet" — resolveAgents() applies the
    // per-command fallback once the lock (and, for apply/install, a TTY)
    // is available to consult.
    agents: [...new Set(agents)],
    platform: process.platform,
    version: PKG_VERSION,
    lock: null,
  };
}

/**
 * The agent-resolution chain every write command shares:
 *   1. `--agent` given → use exactly those. No question.
 *   2. else a lock already records agents → reuse them. This is an update;
 *      the choice was already made. No question. A lock written before the
 *      rename records them under `hosts`; lib/lock.mjs reads either.
 *   3. else a TTY is attached (apply/install only) → ask, via lib/prompt.mjs.
 *   4. else → UsageError, exit 2, `help` lists the four runnable commands.
 *
 * `status` and `uninstall` keep their old, ungated default of every agent —
 * reporting and removal are not consent points. `plan` writes nothing, so it
 * never reaches step 3: steps 1-2, then it previews all four and says so.
 *
 * Call after `loadLock(ctx)` so `ctx.lock` is populated for step 2.
 */
async function resolveAgents(ctx, command) {
  if (ctx.agents.length) return { agents: [...new Set(ctx.agents)], chosen: true };
  if (command === 'status' || command === 'uninstall') return { agents: [...AGENTS], chosen: true };

  const recorded = ctx.lock?.agents ? Object.keys(ctx.lock.agents) : [];
  if (recorded.length) return { agents: recorded, chosen: true };

  if (command === 'plan') return { agents: [...AGENTS], chosen: false };

  if (process.stdin.isTTY) {
    const chosen = await askAgents(AGENTS);
    if (chosen) return { agents: chosen, chosen: true };
  }
  throw new UsageError(
    'no --agent given, this repository has no recorded install, and there is no terminal to ask which coding agent(s) to use',
    AGENTS.map((a) => `${RUN} ${command} --agent ${a}`),
  );
}

function head(ctx, extra = {}) {
  return {
    version: PKG_VERSION, content_version: CONTENT_VERSION,
    scope: ctx.scope, root: ctx.root, ...extra,
  };
}

function loadLock(ctx) {
  ctx.lock = lockfile.read(ctx.root, ctx.scope);
  return ctx.lock;
}

/** Preview every action for the selected agents, aggregating per-agent failures. */
function previewAll(ctx) {
  const errors = [];
  const actions = [];
  for (const host of ctx.agents) {
    try {
      const forHost = dedupe(buildPlan({ ...ctx, agents: [host], selectedAgents: ctx.agents }));
      for (const action of forHost) {
        try {
          actions.push(preview(action, ctx));
        } catch (e) {
          errors.push({ host, target: action.target, error: e.message });
        }
      }
    } catch (e) {
      errors.push({ host, error: e.message });
    }
  }
  return { actions: dedupe(actions), errors };
}

function summarise(actions) {
  const s = { create: 0, update: 0, unchanged: 0, drift: 0, conflict: 0, manual: 0 };
  for (const a of actions) if (a.state in s) s[a.state] += 1;
  return s;
}

/** Strip the fields that are machinery, not result. */
function publicAction(a) {
  const { doc, fmt, body, value, conflict, newly_declined: nd, absolute, ...rest } = a;
  return rest;
}

// ------------------------------------------------------------------ status

export async function status(argv) {
  const ctx = buildContext(argv, 'status');
  let lock = null;
  try { lock = loadLock(ctx); } catch (e) {
    if (e instanceof lockfile.LockVersionError) {
      return out.failure('status', e.message, {
        next_step: `Upgrade the package: npm i -D ${PKG_NAME}@latest`,
        help: [`npm i -D ${PKG_NAME}@latest`, `${RUN} status`],
      });
    }
    throw e;
  }
  ({ agents: ctx.agents } = await resolveAgents(ctx, 'status'));

  const detections = await detectAll(ctx);
  const { actions, errors } = previewAll(ctx);
  const byHost = new Map(detections.map((d) => [d.id, d]));

  const agentStates = detections.map((d) => {
    const mine = actions.filter((a) => a.host === d.id || a.host === 'shared');
    let state = 'absent';
    if (d.detected) {
      const pending = mine.filter((a) => isWritableState(a.state));
      const bad = mine.filter((a) => a.state === 'conflict' || a.state === 'drift');
      if (bad.length) state = bad.some((a) => a.state === 'conflict') ? 'conflict' : 'drift';
      else if (pending.length === 0) state = 'ok';
      else state = lock?.agents?.[d.id] ? 'drift' : 'not-installed';
    }
    return {
      id: d.id, detected: d.detected, marker: d.marker, writable: d.writable,
      skills_dir: skillsDir(d.id, ctx),
      installed: installedCounts(d.id, ctx), state, notes: d.notes,
    };
  });

  // `drift[]` carries conflicts too; `state` says which, so a file someone
  // else wrote is not reported back to the user as their own edit.
  const drift = actions.filter((a) => a.state === 'drift' || a.state === 'conflict').map((a) => ({
    target: a.target, state: a.state, expected: a.hash ?? null, actual: a.prior ?? null,
    reason: a.reason, remedy: a.remedy,
  }));

  const pending = actions.filter((a) => isWritableState(a.state)).length;
  const worst = ['conflict', 'drift', 'not-installed', 'ok', 'absent']
    .find((s) => agentStates.some((a) => a.state === s)) ?? 'absent';

  let next = pending
    ? `Run \`${RUN} plan\` to see the ${pending} change(s) needed, then \`${RUN} apply --yes\`.`
    : `Nothing to do — the harness is installed and up to date. Run \`${RUN} plan\` any time to re-check.`;

  return out.ok('status', head(ctx, {
    installed_version: lock?.version ?? null,
    state: worst,
    next_step: next,
    help: [`${RUN} plan`, `${RUN} apply --yes`, `${RUN} guide`],
    inventory: { skills: skills().length, agents: agents().length },
    agents: agentStates, drift,
    declined: lock?.declined ?? [],
    manual: lock?.manual ?? [],
    errors,
  }));
}

// -------------------------------------------------------------------- plan

export async function plan(argv) {
  const ctx = buildContext(argv, 'plan');
  try { loadLock(ctx); } catch (e) {
    if (e instanceof lockfile.LockVersionError) {
      return out.failure('plan', e.message, {
        next_step: `Upgrade the package: npm i -D ${PKG_NAME}@latest`,
        help: [`npm i -D ${PKG_NAME}@latest`],
      });
    }
    throw e;
  }
  const { agents: chosenAgents, chosen } = await resolveAgents(ctx, 'plan');
  ctx.agents = chosenAgents;
  const { actions, errors } = previewAll(ctx);
  const summary = summarise(actions);
  const changes = summary.create + summary.update;

  let next = chosen ? '' : 'No --agent given and no existing install found, so this previews all four agents. ';
  next += changes
    ? `Nothing was written. Run \`${RUN} apply --yes\` to perform the ${changes} change(s).`
      + (summary.conflict || summary.manual
        ? ` The ${summary.conflict} conflict(s) and ${summary.manual} manual step(s) will be reported again and left to you.`
        : '')
    : `Nothing to do — every target is already up to date.`;

  return out.ok('plan', head(ctx, {
    summary, next_step: next,
    help: [`${RUN} apply --yes`, ...ctx.agents.map((a) => `${RUN} apply --yes --agent ${a}`)],
    actions: actions.map(publicAction),
    errors,
  }));
}

// ------------------------------------------------------------------- apply

export async function apply(argv, label = 'apply') {
  const ctx = buildContext(argv, label);
  if (!ctx.yes) {
    return out.usage(label, 'apply refuses to write without --yes',
      [`${RUN} plan`, `${RUN} apply --yes`]);
  }

  let lock;
  try { lock = loadLock(ctx) ?? lockfile.empty(ctx.scope); } catch (e) {
    if (e instanceof lockfile.LockVersionError) {
      return out.failure(label, e.message, {
        next_step: `Upgrade the package: npm i -D ${PKG_NAME}@latest`,
        help: [`npm i -D ${PKG_NAME}@latest`],
      });
    }
    throw e;
  }
  ({ agents: ctx.agents } = await resolveAgents(ctx, label));

  // An apply we cannot record is an apply we cannot undo. Refuse up front
  // rather than leave the user with files and no way back.
  if (!isWritable(abs(ctx.root, lockFile(ctx.root)))) {
    return out.failure(label, `cannot write the lock file at ${lockFile(ctx.root)}`, {
      next_step: `Make ${ctx.root} writable, then re-run \`${RUN} apply --yes\`.`,
      help: [`${RUN} status`],
    });
  }

  // Migration: a lock that used to live in the repository root carried a
  // managed `.gitignore` line. Under `var/` the recipe ignores it already, so
  // that line is ours to take back rather than leave behind as litter.
  const staleIgnore = !lockNeedsGitignore(ctx.root)
    && (lock.fences ?? []).find((f) => f.file === '.gitignore' && f.block === 'lock');
  const migrated = [];
  if (staleIgnore) {
    try {
      const result = revert({ kind: 'text-fence', target: '.gitignore', ...staleIgnore }, ctx);
      if (result.state !== 'kept') {
        lock = { ...lock, fences: lock.fences.filter((f) => f !== staleIgnore) };
        migrated.push({
          target: '.gitignore',
          detail: `removed the managed \`${LOCK_DIR_LEGACY}/\` line — the lock now lives in ${lockDir(ctx.root)}/, which this project already ignores`,
        });
      }
    } catch {
      // Cosmetic. An apply that installed everything must not fail over a
      // line we were trying to tidy away.
    }
  }

  const { actions, errors } = previewAll(ctx);
  const results = [];
  const perAgent = new Map(ctx.agents.map((a) => [a, { id: a, created: 0, updated: 0, unchanged: 0, failed: 0 }]));
  const manual = [];

  for (const action of actions) {
    const bucket = perAgent.get(action.host) ?? perAgent.get(ctx.agents[0]);
    if (action.state === 'manual') {
      manual.push({ target: action.target, reason: action.reason, remedy: action.remedy });
      results.push({ ...publicAction(action), state: 'manual' });
      continue;
    }
    if (!isWritableState(action.state)) {
      if (action.state === 'unchanged' && bucket) bucket.unchanged += 1;
      results.push(publicAction(action));
      continue;
    }
    try {
      const entry = execute(action, ctx);
      lock = lockfile.record(lock, [entry], { agent: action.host === 'shared' ? undefined : action.host });
      if (bucket) bucket[action.state === 'create' ? 'created' : 'updated'] += 1;
      results.push({ ...publicAction(action), state: action.state === 'create' ? 'created' : 'updated' });
    } catch (e) {
      if (bucket) bucket.failed += 1;
      errors.push({ host: action.host, target: action.target, error: e.message });
      results.push({ ...publicAction(action), state: 'failed', reason: e.message });
    }
  }

  // Rules the user deleted after we installed them are declines, not gaps.
  for (const action of actions) {
    for (const value of action.newly_declined ?? []) {
      lock = lockfile.decline(lock, {
        file: action.target, pointer: action.pointer, value,
        reason: 'removed by the user after install',
      });
    }
  }
  for (const entry of manual) {
    lock = lockfile.record(lock, [{ kind: 'manual', target: entry.target, remedy: entry.remedy }]);
  }
  for (const agent of ctx.agents) {
    lock = { ...lock, agents: { ...lock.agents, [agent]: { installed_at: new Date().toISOString(), version: PKG_VERSION } } };
  }
  lockfile.write(ctx.root, lock);

  const summary = {
    created: results.filter((r) => r.state === 'created').length,
    updated: results.filter((r) => r.state === 'updated').length,
    unchanged: results.filter((r) => r.state === 'unchanged').length,
    conflict: results.filter((r) => r.state === 'conflict').length,
    drift: results.filter((r) => r.state === 'drift').length,
    manual: manual.length,
    failed: results.filter((r) => r.state === 'failed').length,
  };

  const help = ctx.agents.map((a) => RESTART[a]).filter(Boolean);
  help.push(`${RUN} status`);

  let next = summary.failed
    ? `${summary.failed} change(s) failed — see \`errors\`. Fix those, then re-run \`${RUN} apply --yes\`.`
    : `Restart the coding agents listed in \`help\` so they pick up the new skills, sub-agents and MCP servers.`
      + (manual.length ? ` Then finish the ${manual.length} manual step(s) in \`manual\`.` : '');

  const body = head(ctx, {
    summary, lock_file: lockFile(ctx.root), next_step: next, help,
    agents: [...perAgent.values()], actions: results, manual, errors,
    ...(migrated.length ? { migrated } : {}),
  });
  return summary.failed ? out.failure(label, `${summary.failed} change(s) failed`, body) : out.ok(label, body);
}

/** `install` is `apply --yes`: typing the verb is the consent. */
export const install = (argv) => apply(['--yes', ...argv], 'install');

// --------------------------------------------------------------- uninstall

export async function uninstall(argv) {
  const ctx = buildContext(argv, 'uninstall');
  if (!ctx.yes) {
    return out.usage('uninstall', 'uninstall refuses to write without --yes',
      [`${RUN} status`, `${RUN} uninstall --yes`]);
  }

  let lock;
  try { lock = loadLock(ctx); } catch (e) {
    if (e instanceof lockfile.LockVersionError) {
      return out.failure('uninstall', e.message, {
        next_step: `Upgrade the package: npm i -D ${PKG_NAME}@latest`,
        help: [`npm i -D ${PKG_NAME}@latest`],
      });
    }
    throw e;
  }
  ({ agents: ctx.agents } = await resolveAgents(ctx, 'uninstall'));

  if (!lock) {
    // No record means no evidence of what we own. Guessing here would delete
    // someone else's files, so it does nothing and says so.
    return out.ok('uninstall', head(ctx, {
      summary: { removed: 0, reverted: 0, kept: 0, missing: 0, failed: 0 },
      next_step: `Nothing to remove — no ${lockFile(ctx.root)} was found, so this repository has no recorded install.`,
      help: [`${RUN} status`],
      kept: [], missing: [], errors: [],
    }));
  }

  const selected = new Set(ctx.agents);
  const all = lockfile.entries(lock);
  const mine = all.filter((e) => !e.host || selected.has(e.host) || e.host === 'shared');

  const kept = [];
  const missing = [];
  const errors = [];
  let removed = 0;
  let reverted = 0;
  const survivors = [];

  for (const entry of mine) {
    try {
      const result = revert(entry, ctx);
      if (result.state === 'removed') removed += 1;
      else if (result.state === 'reverted') reverted += 1;
      else if (result.state === 'kept') { kept.push(result); survivors.push(entry); }
      else missing.push(result);
    } catch (e) {
      errors.push({ target: entry.target, error: e.message });
      survivors.push(entry);
    }
  }

  const prunedDirs = pruneDirs(lock.dirs ?? [], ctx);
  const failed = errors.length;

  if (failed === 0 && survivors.length === 0 && selected.size === AGENTS.length) {
    // Everything we recorded is gone; the lock has nothing left to describe.
    removeFile(lockfile.lockPath(ctx.root));
    removeFile(lockfile.legacyLockPath(ctx.root));
    // `pruneDirs` deliberately never touches a top-level directory — that
    // rule protects a host's own `.claude`/`.codex`, but `.sw-ai-sdk` and
    // `var/sw-ai-sdk` are ours, and an empty one left behind is the clutter
    // this move set out to remove.
    pruneDirs([lockDir(ctx.root)], ctx);
    removeDirIfEmpty(abs(ctx.root, LOCK_DIR_LEGACY));
    removeDirIfEmpty(abs(ctx.root, lockDir(ctx.root)));
  } else {
    // Keep a lock describing exactly what survived, so a re-run resumes.
    lockfile.write(ctx.root, rebuild(lock, survivors, selected));
  }

  const body = head(ctx, {
    summary: { removed, reverted, kept: kept.length, missing: missing.length, failed },
    next_step: failed
      ? `${failed} item(s) could not be removed — see \`errors\`.`
      : `Restart your coding agent(s).` + (kept.length ? ` ${kept.length} file(s) were left in place because you edited them — they are listed under \`kept\`.` : ''),
    help: [...ctx.agents.map((a) => RESTART[a]).filter(Boolean), `${RUN} status`],
    kept, missing, pruned_dirs: prunedDirs, errors,
  });
  return failed ? out.failure('uninstall', `${failed} item(s) could not be removed`, body) : out.ok('uninstall', body);
}

function rebuild(lock, survivors, selected) {
  const files = {};
  const json_pointers = [];
  const rules = [];
  const fences = [];
  for (const entry of survivors) {
    if (entry.kind === 'file-copy') files[entry.target] = { host: entry.host, source: entry.source, hash: entry.hash, bytes: entry.bytes, created_file: entry.created_file };
    else if (entry.kind === 'json-merge' && entry.op === 'array-union') rules.push(entry);
    else if (entry.kind === 'json-merge') json_pointers.push(entry);
    else fences.push(entry);
  }
  const agents = { ...lock.agents };
  for (const agent of selected) delete agents[agent];
  return { ...lock, files, json_pointers, rules, fences, agents };
}

export { UsageError };
