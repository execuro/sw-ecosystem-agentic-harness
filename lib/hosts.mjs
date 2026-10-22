// The host registry. Everything host-specific is declarative and lives here,
// so adding a host or following a schema change is one table to edit.
//
// Detection is file and directory existence only — no network, no process scan,
// no `which`. It reports evidence and preselects the picker; it never selects
// which hosts a write command touches. Which hosts get written to is decided by
// commands.mjs's `resolveAgents()` chain (`--agent`, then a recorded lock,
// then a TTY prompt, then a usage error) — detection has no vote there.

import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  agents, claudeSettings, hooks, lockDir, lockNeedsGitignore, mcpServers, PKG_ROOT, router, skills,
} from './content.mjs';
import { abs, exists, isDir, isWritable, walk } from './fsx.mjs';
import { resolveEntryFiles } from './entry-files.mjs';
import { renderTomlTable, tomlTableExists, findFence } from './merge.mjs';
import { readTextMaybe } from './fsx.mjs';

export const AGENTS = ['claude-code', 'codex', 'copilot', 'cursor'];

/** Where each host reads its skills from — the base every skill copy is
 * rooted at, and the directory `sw-setup` hands to an editor package's own
 * `install-skill --target`. */
export const SKILL_DIR = {
  'claude-code': '.claude/skills',
  codex: '.agents/skills',
  copilot: '.github/skills',
  cursor: '.cursor/skills',
};

// What counts as evidence a host is in use; a trailing `/` means a directory.
// A bare AGENTS.md is evidence for no single host, and a stray `.github/` or
// `.vscode/` is not evidence for Copilot.
const SIGNALS = {
  'claude-code': { project: ['.claude/', 'CLAUDE.md', '.claude/CLAUDE.md'], user: ['.claude/'] },
  codex: { project: ['.codex/', '.agents/'], user: ['.codex/'] },
  copilot: {
    project: ['.github/copilot-instructions.md', '.github/instructions/', '.github/agents/', '.vscode/mcp.json'],
    user: ['.copilot/'],
  },
  cursor: { project: ['.cursor/'], user: ['.cursor/'] },
};

const CURSOR_RULE_SOURCE = 'project/entry/cursor/sw-shopware-knowledge.mdc';

// The SubagentStart hook each host gets, read from project/hooks/*.json.
const HOOKS = hooks();
const HOOK_SCRIPT_SOURCE = (hook) => `project/hooks/${hook.script.split('/').pop()}`;

function hookValue(hook) {
  const handler = { type: 'command', command: hook.command };
  if (hook.commandWindows) handler.commandWindows = hook.commandWindows;
  return { ...(hook.matcher ? { matcher: hook.matcher } : {}), hooks: [handler] };
}

/** The hook rows `status` and `plan` report, for every host that has one. */
export function hookDescriptions(ids) {
  return ids.filter((id) => HOOKS[id]).map((id) => {
    const h = HOOKS[id];
    return {
      host: id, file: h.file, script: h.script, event: h.event,
      matcher: h.matcher, command: h.command, trust_note: h.trust_note,
    };
  });
}

/** Where a host's trees live, given the scope. User scope is rooted at $HOME. */
export function hostRoot(scope) {
  return scope === 'user' ? homedir() : null;
}

/**
 * Detect every host in parallel. Cheap enough that parallelism is cosmetic,
 * but it matches the documented pattern and keeps a slow stat from serialising.
 */
export async function detectAll(ctx) {
  return Promise.all(AGENTS.map((id) => Promise.resolve(detect(id, ctx))));
}

export function detect(id, ctx) {
  const signals = SIGNALS[id][ctx.scope] ?? SIGNALS[id].project;
  const found = signals.filter((s) => (s.endsWith('/')
    ? isDir(abs(ctx.root, s.slice(0, -1)))
    : exists(abs(ctx.root, s)) && !isDir(abs(ctx.root, s))));
  const writable = found.filter((s) => s.endsWith('/')).every((s) => isWritable(abs(ctx.root, s.slice(0, -1))));
  const notes = [];
  if (id === 'codex' && found.length && !writable) {
    notes.push(
      '`.codex/` and `.agents/` are read-only under Codex\'s default workspace-write ' +
        'sandbox. Run this CLI from a plain shell rather than from inside a Codex session.',
    );
  }
  if (id === 'cursor' && isDir(abs(ctx.root, '.claude/skills')) && isDir(abs(ctx.root, '.claude/agents'))) {
    notes.push('Skills and agents are read from `.claude/` directly — nothing to install under `.cursor/`.');
  }
  const evidence = found.map((s) => s.replace(/\/$/, ''));
  const marker = evidence[0] ?? signals[0].replace(/\/$/, '');
  return { id, detected: found.length > 0, evidence, marker, writable, notes };
}

// --------------------------------------------------------------- plans

/**
 * The router block (or Cursor's rule) for every agent in `agents`, from the
 * entry-file resolver. Planned once for the whole run, not per host, because
 * several agents can share a file.
 */
export function buildEntryPlan(ctx, agents) {
  if (ctx.scope === 'user') {
    return { actions: [], files: [], warnings: ['User scope writes no entry files or hooks; run the install at project scope.'] };
  }
  const { files, warnings } = resolveEntryFiles(ctx.root, agents);
  const body = router();
  const actions = files.map((f) => {
    const entry = { reaches: f.reaches, reason: f.reason };
    if (f.kind === 'file') {
      return {
        id: `cursor:file:${f.target}`, host: 'cursor', kind: 'file-copy',
        source: CURSOR_RULE_SOURCE, target: f.target, entry,
      };
    }
    return {
      id: `shared:text:${f.target}#harness`, host: 'shared', kind: 'text-fence',
      target: f.target, block: 'harness', syntax: 'markdown', body, entry,
    };
  });
  if (agents.includes('codex')) {
    const config = readTextMaybe(abs(ctx.root, '.codex/config.toml'));
    if (config && /^\s*\[\[?hooks[.\]]/m.test(config.text)) {
      warnings.push('.codex/config.toml has inline [hooks] tables; Codex merges them with .codex/hooks.json and warns at startup. Move them into one file.');
    }
  }
  return { actions, files, warnings };
}

/** Build the full action list for the selected agents. */
export function buildPlan(ctx) {
  const actions = [];
  for (const id of ctx.agents) actions.push(...planFor(id, ctx));
  // Shared targets are emitted per host; the id dedupe collapses them.
  return actions;
}

export function planFor(id, ctx) {
  switch (id) {
    case 'claude-code': return planClaude(ctx);
    case 'codex': return planCodex(ctx);
    case 'copilot': return planCopilot(ctx);
    case 'cursor': return planCursor(ctx);
    default: throw new Error(`unknown host: ${id}`);
  }
}

function copyTree(host, sourceRoot, targetRoot) {
  const out = [];
  for (const file of walk(join(PKG_ROOT, sourceRoot))) {
    const target = `${targetRoot}/${file}`;
    out.push({
      id: `${host}:file:${target}`, host, kind: 'file-copy',
      source: `${sourceRoot}/${file}`, target,
    });
  }
  return out;
}

function skillActions(host, targetBase) {
  const out = [];
  for (const skill of skills()) out.push(...copyTree(host, skill.root, `${targetBase}/${skill.name}`));
  return out;
}

function agentActions(host, targetBase, pick, ext) {
  return agents().map((agent) => {
    const target = `${targetBase}/${agent.name}${ext}`;
    return {
      id: `${host}:file:${target}`, host, kind: 'file-copy',
      source: agent[pick], target,
    };
  });
}

function mcpJsonActions(host, file, rootKey, ctx) {
  return mcpServers({ platform: ctx.platform, root: ctx.root, projectWiki: ctx.projectWiki }).map((server) => {
    const { name, ...value } = server;
    const pointer = `/${rootKey}/${name}`;
    return {
      id: `shared:json:${file}#${pointer}`, host, kind: 'json-merge',
      target: file, pointer, op: 'set', value,
    };
  });
}

/** The hook script copy, plus the registration of it in the host's hook file. */
function hookActions(host, ctx) {
  if (ctx.scope === 'user') return [];
  const hook = HOOKS[host];
  return [
    {
      id: `${host}:file:${hook.script}`, host, kind: 'file-copy',
      source: HOOK_SCRIPT_SOURCE(hook), target: hook.script,
    },
    {
      id: `${host}:json:${hook.file}#/hooks/${hook.event}`, host, kind: 'json-merge',
      target: hook.file, pointer: `/hooks/${hook.event}`, op: 'array-union', values: [hookValue(hook)],
    },
  ];
}

/**
 * The lock describes one machine's install, so it must not be tracked. Under
 * `var/` the `shopware/core` Flex recipe already ignores it (`/var/*`), so
 * there is nothing to write and we do not touch the user's `.gitignore` at
 * all. Only the fallback location needs the managed line.
 */
function gitignoreAction(host, ctx) {
  if (!lockNeedsGitignore(ctx.root)) return null;
  return {
    id: 'shared:text:.gitignore#lock', host, kind: 'text-fence',
    target: '.gitignore', block: 'lock', syntax: 'gitignore', body: `${lockDir(ctx.root)}/`,
  };
}

function planClaude(ctx) {
  const host = 'claude-code';
  const out = [
    ...skillActions(host, SKILL_DIR[host]),
    ...agentActions(host, '.claude/agents', 'claude', '.md'),
    ...mcpJsonActions(host, '.mcp.json', 'mcpServers', ctx),
  ];
  const settings = claudeSettings();
  for (const rule of settings.rules) {
    out.push({
      id: `${host}:json:.claude/settings.json#${rule.pointer}`, host, kind: 'json-merge',
      target: '.claude/settings.json', pointer: rule.pointer, op: 'array-union', values: rule.values,
    });
  }
  for (const setting of settings.settings) {
    out.push({
      id: `${host}:json:.claude/settings.json#${setting.pointer}`, host, kind: 'json-merge',
      target: '.claude/settings.json', pointer: setting.pointer, op: 'set', value: setting.value,
    });
  }
  out.push(...hookActions(host, ctx), gitignoreAction(host, ctx));
  return out.filter(Boolean);
}

function planCodex(ctx) {
  const host = 'codex';
  const out = [
    // Codex discovers skills from `.agents/skills`, never `.claude/skills`.
    ...skillActions(host, SKILL_DIR[host]),
    ...agentActions(host, '.codex/agents', 'codex', '.toml'),
  ];

  const file = '.codex/config.toml';
  const found = readTextMaybe(abs(ctx.root, file));
  const text = found?.text ?? '';

  // Codex is TOML-only and never reads `.mcp.json`, and performs no `${VAR}`
  // expansion — so paths are resolved here, at install time.
  const servers = mcpServers({ platform: ctx.platform, root: ctx.root, projectWiki: ctx.projectWiki });
  const clash = servers.find((s) => tomlTableExists(text, `[mcp_servers.${s.name}]`, ['mcp_servers', 'agents']));
  out.push({
    id: `${host}:toml:${file}#mcp_servers`, host, kind: 'toml-fence',
    target: file, block: 'mcp_servers', syntax: 'toml',
    body: servers.map((s) => renderTomlTable(`[mcp_servers.${s.name}]`, {
      command: s.command, args: s.args, type: undefined,
    })).join('\n\n'),
    conflict: clash && {
      reason: `a \`[mcp_servers.${clash.name}]\` table already exists outside our managed block, and TOML forbids a duplicate table header`,
      remedy: `remove or rename the existing [mcp_servers.${clash.name}] table in ${file}, then re-run apply`,
    },
  });

  // `[agents]` may already be the user's own table. Merging would mean editing
  // their lines, which this installer does not do — so it becomes a manual step.
  const agentsClash = tomlTableExists(text, '[agents]', ['mcp_servers', 'agents']);
  out.push({
    id: `${host}:toml:${file}#agents`, host, kind: 'toml-fence',
    target: file, block: 'agents', syntax: 'toml',
    body: renderTomlTable('[agents]', { max_concurrent_threads_per_session: 4 }),
    conflict: agentsClash && {
      reason: `an unfenced [agents] table already exists in ${file}; TOML forbids a duplicate table header and the installer never edits your lines`,
      remedy: `add \`max_concurrent_threads_per_session = 4\` to the existing [agents] table in ${file}`,
    },
  });

  out.push(...hookActions(host, ctx), gitignoreAction(host, ctx));
  return out.filter(Boolean);
}

function planCopilot(ctx) {
  const host = 'copilot';
  const out = [
    ...skillActions(host, SKILL_DIR[host]),
    ...agentActions(host, '.github/agents', 'copilot', '.agent.md'),
    // Copilot CLI reads `.mcp.json`; VS Code reads `.vscode/mcp.json` under the
    // incompatible `servers` key. Both, or the two surfaces disagree.
    ...mcpJsonActions(host, '.mcp.json', 'mcpServers', ctx),
    ...mcpJsonActions(host, '.vscode/mcp.json', 'servers', ctx).map((a) => ({
      ...a, id: a.id.replace('shared:', 'copilot:'),
    })),
    gitignoreAction(host, ctx),
  ];
  return out.filter(Boolean);
}

function planCursor(ctx) {
  const host = 'cursor';
  const out = [];
  // Cursor reads `.claude/skills/` and `.claude/agents/` directly. If Claude
  // Code is also being installed, or already is, there is nothing to duplicate.
  // `ctx.agents` is narrowed to one agent while previewing, so the question
  // "is Claude Code also being installed?" must be asked of the user's actual
  // selection, which `selectedAgents` carries unchanged.
  const selected = ctx.selectedAgents ?? ctx.agents;
  const claudeTrees = selected.includes('claude-code')
    || (isDir(abs(ctx.root, '.claude/skills')) && isDir(abs(ctx.root, '.claude/agents')));
  if (!claudeTrees) {
    out.push(...skillActions(host, SKILL_DIR[host]));
    out.push(...agentActions(host, '.cursor/agents', 'claude', '.md'));
  }
  out.push(...mcpJsonActions(host, '.cursor/mcp.json', 'mcpServers', ctx));
  out.push(gitignoreAction(host, ctx));
  return out.filter(Boolean);
}

/**
 * The skills directory a host actually reads, for `status` to report — the
 * one `sw-setup` passes to an editor package's `install-skill --target`.
 * Cursor is the exception: when the Claude trees are present it reads those,
 * so naming `.cursor/skills` would put an editor skill where Cursor never
 * looks.
 */
export function skillsDir(id, ctx) {
  if (id === 'cursor'
    && isDir(abs(ctx.root, '.claude/skills')) && isDir(abs(ctx.root, '.claude/agents'))) {
    return SKILL_DIR['claude-code'];
  }
  return SKILL_DIR[id];
}

/** What is already installed for a host, for `status`. */
export function installedCounts(id, ctx) {
  const lock = ctx.lock;
  if (!lock) return {};
  const mine = Object.entries(lock.files).filter(([, v]) => v.host === id);
  const skillNames = new Set();
  let agentCount = 0;
  for (const [target] of mine) {
    if (/\/skills\//.test(target)) skillNames.add(target.split('/skills/')[1].split('/')[0]);
    else if (/\/agents\//.test(target)) agentCount += 1;
  }
  const mcp = lock.json_pointers.filter((p) => p.pointer.includes('erver') || p.pointer.startsWith('/mcpServers')).length;
  const rules = lock.rules.reduce((n, r) => n + (r.values?.length ?? 0), 0);
  return { skills: skillNames.size, agents: agentCount, mcp, rules };
}

export { findFence };
