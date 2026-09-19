// The host registry. Everything host-specific is declarative and lives here,
// so adding a host or following a schema change is one table to edit.
//
// Detection is marker-directory existence only — no network, no process scan,
// no `which`. It feeds `status` reporting only; it never selects which hosts
// a write command touches. Which hosts get written to is decided by
// commands.mjs's `resolveAgents()` chain (`--agent`, then a recorded lock,
// then a TTY prompt, then a usage error) — detection has no vote there.

import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  agents, agentsMd, claudeSettings, mcpServers, LOCK_DIR, PKG_ROOT, skills,
} from './content.mjs';
import { abs, isDir, isWritable, walk } from './fsx.mjs';
import { renderTomlTable, tomlTableExists, findFence } from './merge.mjs';
import { readTextMaybe } from './fsx.mjs';
import { EXTRA_COMPONENTS } from './extra-components.mjs';

export const AGENTS = ['claude-code', 'codex', 'copilot', 'cursor'];

/** Where each host reads its skills from — the base every skill-copy and
 * extra-component skill-copy action is rooted at. */
export const SKILL_DIR = {
  'claude-code': '.claude/skills',
  codex: '.agents/skills',
  copilot: '.github/skills',
  cursor: '.cursor/skills',
};

const MARKERS = {
  'claude-code': { project: ['.claude'], user: ['.claude'] },
  codex: { project: ['.codex', '.agents'], user: ['.codex'] },
  copilot: { project: ['.github', '.vscode'], user: ['.copilot'] },
  cursor: { project: ['.cursor'], user: ['.cursor'] },
};

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
  const markers = MARKERS[id][ctx.scope] ?? MARKERS[id].project;
  const present = markers.filter((m) => isDir(abs(ctx.root, m)));
  const writable = present.every((m) => isWritable(abs(ctx.root, m)));
  const notes = [];
  if (id === 'codex' && present.length && !writable) {
    notes.push(
      '`.codex/` and `.agents/` are read-only under Codex\'s default workspace-write ' +
        'sandbox. Run this CLI from a plain shell rather than from inside a Codex session.',
    );
  }
  if (id === 'cursor' && isDir(abs(ctx.root, '.claude/skills')) && isDir(abs(ctx.root, '.claude/agents'))) {
    notes.push('Skills and agents are read from `.claude/` directly — nothing to install under `.cursor/`.');
  }
  return { id, detected: present.length > 0, markers, marker: present[0] ?? markers[0], writable, notes };
}

// --------------------------------------------------------------- plans

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

/**
 * One `skill-copy` action per optional extra component. The `skill:`
 * segment (not `file:`) keeps these ids from colliding, or deduping,
 * against a shipped `file-copy` action at the same path.
 */
function extraComponentActions(host, targetBase) {
  return EXTRA_COMPONENTS.map((c) => {
    const target = `${targetBase}/${c.id}/SKILL.md`;
    return {
      id: `${host}:skill:${target}`, host, kind: 'skill-copy',
      component: c.id, package: `${c.pkg}@${c.version}`, target,
    };
  });
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

/** AGENTS.md — read by Codex, Copilot and Cursor; Claude Code reads CLAUDE.md. */
function agentsMdAction(host) {
  return {
    id: 'shared:text:AGENTS.md#harness', host, kind: 'text-fence',
    target: 'AGENTS.md', block: 'harness', syntax: 'markdown', body: agentsMd().trimEnd(),
  };
}

/** The lock file describes one machine's install, so it is gitignored. */
function gitignoreAction(host) {
  return {
    id: 'shared:text:.gitignore#lock', host, kind: 'text-fence',
    target: '.gitignore', block: 'lock', syntax: 'gitignore', body: `${LOCK_DIR}/`,
  };
}

function planClaude(ctx) {
  const host = 'claude-code';
  const out = [
    ...skillActions(host, SKILL_DIR[host]),
    ...(ctx.extraComponents === false ? [] : extraComponentActions(host, SKILL_DIR[host])),
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
  out.push(gitignoreAction(host));
  return out;
}

function planCodex(ctx) {
  const host = 'codex';
  const out = [
    // Codex discovers skills from `.agents/skills`, never `.claude/skills`.
    ...skillActions(host, SKILL_DIR[host]),
    ...(ctx.extraComponents === false ? [] : extraComponentActions(host, SKILL_DIR[host])),
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

  out.push(agentsMdAction(host), gitignoreAction(host));
  return out;
}

function planCopilot(ctx) {
  const host = 'copilot';
  const out = [
    ...skillActions(host, SKILL_DIR[host]),
    ...(ctx.extraComponents === false ? [] : extraComponentActions(host, SKILL_DIR[host])),
    ...agentActions(host, '.github/agents', 'copilot', '.agent.md'),
    // Copilot CLI reads `.mcp.json`; VS Code reads `.vscode/mcp.json` under the
    // incompatible `servers` key. Both, or the two surfaces disagree.
    ...mcpJsonActions(host, '.mcp.json', 'mcpServers', ctx),
    ...mcpJsonActions(host, '.vscode/mcp.json', 'servers', ctx).map((a) => ({
      ...a, id: a.id.replace('shared:', 'copilot:'),
    })),
    agentsMdAction(host),
    gitignoreAction(host),
  ];
  return out;
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
    if (ctx.extraComponents !== false) out.push(...extraComponentActions(host, SKILL_DIR[host]));
    out.push(...agentActions(host, '.cursor/agents', 'claude', '.md'));
  }
  out.push(...mcpJsonActions(host, '.cursor/mcp.json', 'mcpServers', ctx));
  out.push(agentsMdAction(host), gitignoreAction(host));
  return out;
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
