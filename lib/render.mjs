// The human view of a result body.
//
// Every command still builds exactly the same JSON object it always did — that
// object is the model. This module is the view: pure `body -> string`
// functions, no I/O, no process state, so the whole renderer is testable
// without a terminal and without running an install.
//
// Design rules, in the order they matter:
//
//   1. Nothing changed is ONE line. A file count is not news to a human, and
//      "274 unchanged" reads like a failure to someone who typed `install`.
//   2. Something changed is reported per agent, in the user's vocabulary —
//      skills and sub-agents by name, config files by path.
//   3. Conflicts, drift, manual steps and failures are never collapsed into a
//      count: those are the only cases the user has to act on, so each one
//      names its file and its remedy.
//   4. Never name an agent this project has not installed. A Claude Code user
//      is not told about Codex, Cursor or Copilot.
//
// Zero dependencies: bare ANSI, and only when the caller says the stream is a
// terminal.

/** Human labels for the four supported coding agents. */
export const LABELS = {
  'claude-code': 'Claude Code',
  codex: 'Codex',
  copilot: 'GitHub Copilot',
  cursor: 'Cursor',
};

/** What each agent needs before it reads the configuration we just wrote. */
export const RESTART = {
  'claude-code': 'Restart Claude Code, or run `/mcp` in the running session',
  codex: 'Restart `codex` — .codex/config.toml is read once at startup',
  copilot: 'Reload the VS Code window (Developer: Reload Window) for .vscode/mcp.json',
  cursor: 'Restart Cursor so it re-reads .cursor/mcp.json',
};

function label(id) {
  return LABELS[id] ?? id;
}

// ------------------------------------------------------------------ styling

const CODES = { bold: '1', dim: '2', red: '31', green: '32', yellow: '33' };

/** A theme whose functions are the identity when colour is off. */
function theme(color) {
  const wrap = (code) => (color ? (s) => `\x1b[${code}m${s}\x1b[0m` : (s) => s);
  const t = {};
  for (const [name, code] of Object.entries(CODES)) t[name] = wrap(code);
  return t;
}

// --------------------------------------------------------------- primitives

const MAX_NAMES = 6;

/** "a, b, c and 4 more" — a list a person reads, not a dump. */
function names(list) {
  const max = MAX_NAMES;
  const all = [...list];
  if (all.length <= max) return all.join(', ');
  return `${all.slice(0, max).join(', ')} and ${all.length - max} more`;
}

function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * What a target is, in the words a user thinks in. A skill is one thing to
 * them even though it is a directory of files; a config file is its path.
 */
export function classify(target) {
  const skill = /(?:^|\/)skills\/([^/]+)\//.exec(target);
  if (skill) return { kind: 'skill', name: skill[1] };
  const agent = /(?:^|\/)agents\/([^/]+)$/.exec(target);
  if (agent) return { kind: 'agent', name: agent[1].replace(/(\.agent)?\.(md|toml)$/, '') };
  return { kind: 'file', name: target };
}

const VERBS = {
  create: 'added', created: 'added',
  update: 'updated', updated: 'updated',
  removed: 'removed', reverted: 'reverted',
};

const SHARED = '__shared__';

/**
 * Group the actions in `states` by agent, then by verb, then by what kind of
 * thing they are. Returns `[{ id, buckets: Map<verb, {skills, agents, files}> }]`
 * in the order the agents first appear.
 */
export function groupChanges(actions = [], states) {
  const wanted = new Set(states);
  const order = [];
  const groups = new Map();
  for (const action of actions) {
    if (!wanted.has(action.state)) continue;
    const id = !action.host || action.host === 'shared' ? SHARED : action.host;
    if (!groups.has(id)) { groups.set(id, new Map()); order.push(id); }
    const buckets = groups.get(id);
    const verb = VERBS[action.state] ?? action.state;
    if (!buckets.has(verb)) buckets.set(verb, { skill: new Set(), agent: new Set(), file: new Set() });
    const bucket = buckets.get(verb);
    const { kind, name } = classify(action.target);
    // Several actions can target one config file (one per JSON pointer);
    // the user changed one file, so it is named once.
    bucket[kind].add(name);
    (bucket.targets ??= []).push(action.target);
  }
  return order.map((id) => ({ id, buckets: groups.get(id) }));
}

function bucketLines(verb, bucket, { verbose }, t) {
  const lines = [];
  if (verbose) {
    for (const target of bucket.targets ?? []) lines.push(`    ${t.dim(verb)} ${target}`);
    return lines;
  }
  if (bucket.skill.size) lines.push(`    ${verb} ${plural(bucket.skill.size, 'skill')}: ${names(bucket.skill)}`);
  if (bucket.agent.size) lines.push(`    ${verb} ${plural(bucket.agent.size, 'sub-agent')}: ${names(bucket.agent)}`);
  if (bucket.file.size) lines.push(`    ${verb} ${names(bucket.file)}`);
  return lines;
}

function groupLines(groups, opts, t) {
  const lines = [];
  for (const { id, buckets } of groups) {
    lines.push(`  ${t.bold(id === SHARED ? 'Project files' : label(id))}`);
    for (const [verb, bucket] of buckets) lines.push(...bucketLines(verb, bucket, opts, t));
  }
  return lines;
}

// ------------------------------------------------------------------- issues

/** Everything the user has to act on, flattened into one shape. */
function issues(body) {
  const found = [];
  for (const a of body.actions ?? []) {
    if (a.state === 'conflict' || a.state === 'drift' || a.state === 'failed') {
      found.push({ kind: a.state, target: a.target, reason: a.reason, remedy: a.remedy });
    }
  }
  for (const d of body.drift ?? []) {
    found.push({ kind: d.state ?? 'drift', target: d.target, reason: d.reason, remedy: d.remedy });
  }
  for (const m of body.manual ?? []) {
    found.push({ kind: 'manual', target: m.target ?? m.file, reason: m.reason, remedy: m.remedy });
  }
  for (const e of body.errors ?? []) {
    found.push({ kind: 'failed', target: e.target ?? label(e.host), reason: e.error });
  }
  // The same file can reach us from both `actions` and `drift`; say it once.
  const seen = new Set();
  return found.filter((i) => {
    const key = `${i.kind}:${i.target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const ISSUE_TITLE = {
  conflict: 'conflict', drift: 'edited since install',
  manual: 'manual step', failed: 'failed',
};

function issueLines(list, t) {
  if (!list.length) return [];
  const paint = (kind) => (kind === 'drift' || kind === 'manual' ? t.yellow : t.red);
  const lines = [`  ${t.bold('Needs your attention')}`];
  for (const i of list) {
    lines.push(`    ${paint(i.kind)(ISSUE_TITLE[i.kind] ?? i.kind)}  ${i.target}`);
    if (i.reason) lines.push(`      ${i.reason}`);
    if (i.remedy) lines.push(`      ${t.dim('fix:')} ${i.remedy}`);
  }
  return lines;
}

// ------------------------------------------------------------------ restart

function restartLines(body, changedIds, t) {
  const ids = changedIds.length
    ? changedIds
    : (body.agents ?? []).map((a) => a.id).filter((id) => RESTART[id]);
  const uniq = [...new Set(ids)].filter((id) => RESTART[id]);
  return uniq.map((id) => `  ${t.dim('→')} ${RESTART[id]}`);
}

// ------------------------------------------------------------ apply/install

function renderApply(body, opts, t) {
  const s = body.summary ?? {};
  const changed = (s.created ?? 0) + (s.updated ?? 0);
  const problems = issues(body);

  if (changed === 0 && problems.length === 0) {
    // ONE line. Nothing changed means nothing to restart and nothing to read.
    return `${t.green('✓')} Shopware agentic harness: already up to date — nothing to change.\n`;
  }

  const groups = groupChanges(body.actions, ['created', 'updated']);
  const changedIds = groups.map((g) => g.id).filter((id) => id !== SHARED);
  const verb = (s.updated ?? 0) === 0 ? 'Installed' : 'Updated';
  const lines = [];
  lines.push(changed
    ? `${t.green('✓')} ${verb} the Shopware agentic harness.`
    : `${t.yellow('!')} Nothing was written — see below.`);
  if (groups.length) {
    lines.push('');
    lines.push(...groupLines(groups, opts, t));
  }
  if (problems.length) {
    lines.push('');
    lines.push(...issueLines(problems, t));
  }
  if (changed) {
    lines.push('');
    lines.push(...restartLines(body, changedIds, t));
  }
  return `${lines.join('\n')}\n`;
}

// -------------------------------------------------------------------- plan

function renderPlan(body, opts, t) {
  const s = body.summary ?? {};
  const changes = (s.create ?? 0) + (s.update ?? 0);
  const problems = issues(body);
  if (changes === 0 && problems.length === 0) {
    return `${t.green('✓')} Nothing to do — every target is already up to date.\n`;
  }
  const lines = [];
  // `plan` with nothing selected previews every supported agent. Say so, or
  // the list silently names agents this project never installed.
  if (/previews all four/i.test(body.next_step ?? '')) {
    lines.push(t.dim('No agent selected and no recorded install — previewing every supported agent.'));
  }
  lines.push(`${plural(changes, 'change')} would be made. Nothing was written.`);
  const groups = groupChanges(body.actions, ['create', 'update']);
  if (groups.length) {
    lines.push('');
    lines.push(...groupLines(groups, opts, t));
  }
  if (problems.length) {
    lines.push('');
    lines.push(...issueLines(problems, t));
  }
  if (changes) {
    lines.push('');
    lines.push(`  ${t.dim('→')} Run \`sw-ecosystem-agentic-harness apply --yes\` to perform them.`);
  }
  return `${lines.join('\n')}\n`;
}

// ------------------------------------------------------------------ status

/** An agent is only ours to talk about once it has actually been installed. */
function installedAgents(body) {
  return (body.agents ?? []).filter((a) => ['ok', 'drift', 'conflict'].includes(a.state));
}

function renderStatus(body, opts, t) {
  const mine = installedAgents(body);
  const problems = issues(body);

  if (!mine.length) {
    return `${t.yellow('!')} No coding agent is set up in this project yet.\n`
      + `  ${t.dim('→')} ${body.help?.[0] ?? 'sw-ecosystem-agentic-harness install'}\n`;
  }

  const worst = ['conflict', 'drift'].find((state) => mine.some((a) => a.state === state));
  const lines = [];
  lines.push(worst
    ? `${t.yellow('!')} Shopware agentic harness ${body.installed_version ?? body.version} — ${plural(problems.length, 'item')} ${problems.length === 1 ? 'needs' : 'need'} attention.`
    : `${t.green('✓')} Shopware agentic harness ${body.installed_version ?? body.version} — installed and up to date.`);

  for (const a of mine) {
    const counts = [];
    if (a.installed?.skills) counts.push(plural(a.installed.skills, 'skill'));
    if (a.installed?.agents) counts.push(plural(a.installed.agents, 'sub-agent'));
    lines.push(`  ${t.bold(label(a.id))}${counts.length ? `: ${counts.join(', ')}` : ''}`);
    for (const note of a.notes ?? []) lines.push(`    ${t.dim(note)}`);
  }

  if (problems.length) {
    lines.push('');
    lines.push(...issueLines(problems, t));
  }

  const missing = (body.extra_components ?? []).filter((c) => !c.available && c.install);
  if (missing.length) {
    lines.push('');
    lines.push(`  ${t.dim('Optional add-ons not installed:')} ${missing.map((c) => c.install).join(', ')}`);
  }
  return `${lines.join('\n')}\n`;
}

// --------------------------------------------------------------- uninstall

function renderUninstall(body, opts, t) {
  const s = body.summary ?? {};
  const gone = (s.removed ?? 0) + (s.reverted ?? 0);
  if (gone === 0 && !(body.kept ?? []).length) {
    return `${t.green('✓')} Nothing to remove — this project has no recorded install.\n`;
  }
  const lines = [`${t.green('✓')} Removed the Shopware agentic harness — `
    + `${plural(s.removed ?? 0, 'file')} removed, ${plural(s.reverted ?? 0, 'config block')} reverted.`];
  if ((body.kept ?? []).length) {
    lines.push('');
    lines.push(`  ${t.bold('Kept, because you edited them')}`);
    for (const k of body.kept) lines.push(`    ${k.target}`);
  }
  lines.push('');
  lines.push(`  ${t.dim('→')} Restart your coding agent(s) so they drop the removed configuration.`);
  return `${lines.join('\n')}\n`;
}

// ------------------------------------------------------------------ errors

function renderProblem(body, opts, t) {
  const lines = [`${t.red('✗')} ${body.error}`];
  for (const e of body.errors ?? []) {
    lines.push(`    ${e.target ?? label(e.host)} — ${e.error}`);
  }
  const problems = issues({ ...body, errors: [] });
  if (problems.length) {
    lines.push('');
    lines.push(...issueLines(problems, t));
  }
  if (body.help?.length) {
    lines.push('');
    lines.push(`  ${t.bold('Try')}`);
    for (const h of body.help) lines.push(`    ${h}`);
  }
  return `${lines.join('\n')}\n`;
}

// ---------------------------------------------------------------- dispatch

const RENDERERS = {
  install: renderApply,
  apply: renderApply,
  plan: renderPlan,
  status: renderStatus,
  uninstall: renderUninstall,
};

/**
 * `body` is the exact object `--json` prints. `opts.verbose` prints the
 * per-file detail the JSON carries; `opts.color` enables ANSI.
 */
export function render(body, opts = {}) {
  if (!body || typeof body !== 'object') return '';
  const t = theme(opts.color === true);
  if (body.ok === false) return renderProblem(body, opts, t);
  const renderer = RENDERERS[body.command];
  if (!renderer) return `${body.next_step ?? ''}\n`;
  return renderer(body, opts, t);
}
