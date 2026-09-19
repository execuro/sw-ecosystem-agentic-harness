// Apply, and the property that matters most: running it twice must change
// nothing. Asserted on mtimes, not content — content stability alone cannot
// tell "skipped" from "rewrote it identically".

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { writeFileSync, readFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  ALL_AGENT_FLAGS, ALL_MARKERS, cleanup, exists, hostRepo, mtimes, parse, readJson, readLock, readText, run, snapshot,
} from './helpers.mjs';

function install(extra = {}) {
  const root = hostRepo({ dirs: ALL_MARKERS, ...extra });
  const body = parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root]));
  return { root, body };
}

test('a first apply installs every skill and agent into every host', () => {
  const { root, body } = install();
  try {
    assert.equal(body.ok, true);
    assert.equal(body.summary.failed, 0);
    assert.ok(body.summary.created > 0);
    for (const path of ['.claude/skills/sw-setup/SKILL.md', '.claude/agents/sw-qa-engineer.md',
      '.agents/skills/sw-setup/SKILL.md', '.codex/agents/sw-qa-engineer.toml',
      '.github/skills/sw-setup/SKILL.md', '.github/agents/sw-qa-engineer.agent.md',
      '.mcp.json', '.vscode/mcp.json', '.cursor/mcp.json', '.codex/config.toml',
      '.claude/settings.json', 'AGENTS.md', '.gitignore']) {
      assert.ok(exists(root, path), `missing after apply: ${path}`);
    }
  } finally { cleanup(root); }
});

test('both MCP servers land in every host config', () => {
  const { root } = install();
  try {
    for (const [file, key] of [['.mcp.json', 'mcpServers'], ['.vscode/mcp.json', 'servers'], ['.cursor/mcp.json', 'mcpServers']]) {
      const names = Object.keys(readJson(root, file)[key]);
      assert.deepEqual(names.sort(), ['ShopwareDevKnowledgeBase', 'playwright']);
    }
    const toml = readText(root, '.codex/config.toml');
    assert.match(toml, /\[mcp_servers\.playwright\]/);
    assert.match(toml, /\[mcp_servers\.ShopwareDevKnowledgeBase\]/);
  } finally { cleanup(root); }
});

test('a second apply rewrites nothing — mtimes are unchanged', () => {
  const { root } = install();
  try {
    const before = mtimes(root);
    const body = parse(run(['apply', '--yes', '--root', root]));
    assert.equal(body.summary.created, 0);
    assert.equal(body.summary.updated, 0);
    assert.equal(body.summary.drift, 0);
    assert.ok(body.summary.unchanged > 0);
    assert.deepEqual(mtimes(root), before);
  } finally { cleanup(root); }
});

test('a hand-edited file is reported as drift and left alone', () => {
  const { root } = install();
  try {
    const target = join(root, '.claude', 'agents', 'sw-qa-engineer.md');
    writeFileSync(target, 'my own version\n');
    const body = parse(run(['apply', '--yes', '--root', root]));
    const action = body.actions.find((a) => a.target === '.claude/agents/sw-qa-engineer.md');
    assert.equal(action.state, 'drift');
    assert.equal(readFileSync(target, 'utf8'), 'my own version\n');
    assert.ok(action.remedy);
  } finally { cleanup(root); }
});

test('a deleted file is reinstalled and nothing else is touched', () => {
  const { root } = install();
  try {
    unlinkSync(join(root, '.claude', 'agents', 'sw-qa-engineer.md'));
    const body = parse(run(['apply', '--yes', '--root', root]));
    assert.equal(body.summary.created, 1);
    assert.equal(body.summary.updated, 0);
    assert.ok(exists(root, '.claude/agents/sw-qa-engineer.md'));
  } finally { cleanup(root); }
});

test('a foreign file at one of our paths is a conflict, never overwritten', () => {
  const root = hostRepo({
    dirs: ALL_MARKERS,
    files: { '.claude/agents/sw-qa-engineer.md': 'someone else wrote this\n' },
  });
  try {
    const body = parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root]));
    const action = body.actions.find((a) => a.target === '.claude/agents/sw-qa-engineer.md');
    assert.equal(action.state, 'conflict');
    assert.equal(readText(root, '.claude/agents/sw-qa-engineer.md'), 'someone else wrote this\n');
    assert.ok(action.remedy);
    assert.equal(body.summary.failed, 0, 'a conflict must not fail the run');
  } finally { cleanup(root); }
});

test('an identical pre-existing file is adopted rather than flagged', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const shipped = readFileSync(join(process.cwd(), 'agents', 'sw-qa-engineer.md'));
    mkdirSync(join(root, '.claude', 'agents'), { recursive: true });
    writeFileSync(join(root, '.claude', 'agents', 'sw-qa-engineer.md'), shipped);
    const body = parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root]));
    const action = body.actions.find((a) => a.target === '.claude/agents/sw-qa-engineer.md');
    assert.equal(action.state, 'unchanged');
    assert.match(action.detail, /adopted/);
  } finally { cleanup(root); }
});

test('existing permission rules are kept and ours are appended', () => {
  const root = hostRepo({
    dirs: ALL_MARKERS,
    files: {
      '.claude/settings.json': JSON.stringify({
        permissions: { deny: ['Edit(secrets/**)', 'Edit(vendor/**)'], allow: ['Bash(ls *)'] },
      }, null, 2),
    },
  });
  try {
    run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root]);
    const perms = readJson(root, '.claude/settings.json').permissions;
    assert.equal(perms.deny[0], 'Edit(secrets/**)', 'user rules must stay first and in order');
    assert.equal(perms.deny.filter((r) => r === 'Edit(vendor/**)').length, 1, 'no duplicate');
    assert.ok(perms.deny.includes('Bash(shopware-cli project ci*)'));
    assert.deepEqual(perms.allow, ['Bash(ls *)', 'Bash(grep *)']);
  } finally { cleanup(root); }
});

test('a rule the user deletes is declined and never re-offered', () => {
  const { root } = install();
  try {
    const file = join(root, '.claude', 'settings.json');
    const doc = JSON.parse(readFileSync(file, 'utf8'));
    doc.permissions.deny = doc.permissions.deny.filter((r) => r !== 'Bash(shopware-cli project ci*)');
    writeFileSync(file, JSON.stringify(doc, null, 2));

    run(['apply', '--yes', '--root', root]);
    const after = JSON.parse(readFileSync(file, 'utf8'));
    assert.equal(after.permissions.deny.includes('Bash(shopware-cli project ci*)'), false,
      'a declined rule must not be reinstated');
    assert.ok(readLock(root).declined.some((d) => d.value === 'Bash(shopware-cli project ci*)'));

    // And still not on a third run.
    run(['apply', '--yes', '--root', root]);
    const third = JSON.parse(readFileSync(file, 'utf8'));
    assert.equal(third.permissions.deny.includes('Bash(shopware-cli project ci*)'), false);
  } finally { cleanup(root); }
});

test('an existing unfenced [agents] table becomes a manual step, not an edit', () => {
  const root = hostRepo({
    dirs: ALL_MARKERS,
    files: { '.codex/config.toml': '[agents]\nmax_concurrent_threads_per_session = 2\n' },
  });
  try {
    const body = parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root]));
    assert.equal(body.summary.manual, 1);
    assert.match(body.manual[0].remedy, /max_concurrent_threads_per_session = 4/);
    assert.match(readText(root, '.codex/config.toml'), /max_concurrent_threads_per_session = 2/);
    assert.match(body.next_step, /manual/);
  } finally { cleanup(root); }
});

test('a JSONC config is never rewritten — it becomes a manual step', () => {
  const root = hostRepo({
    dirs: ALL_MARKERS,
    files: { '.vscode/mcp.json': '{\n  // my servers\n  "servers": {}\n}\n' },
  });
  try {
    const before = readText(root, '.vscode/mcp.json');
    const body = parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root]));
    assert.equal(readText(root, '.vscode/mcp.json'), before, 'comments must survive');
    assert.ok(body.manual.some((m) => m.target === '.vscode/mcp.json'));
  } finally { cleanup(root); }
});

test('malformed JSON is a conflict, never repaired', () => {
  const root = hostRepo({ dirs: ALL_MARKERS, files: { '.mcp.json': '{ this is not json' } });
  try {
    const body = parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root]));
    assert.equal(readText(root, '.mcp.json'), '{ this is not json');
    assert.ok(body.actions.some((a) => a.target === '.mcp.json' && a.state === 'conflict'));
  } finally { cleanup(root); }
});

test('--agent installs one host only', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    run(['apply', '--yes', '--agent', 'claude-code', '--root', root]);
    assert.ok(exists(root, '.claude/skills/sw-setup/SKILL.md'));
    assert.equal(exists(root, '.agents/skills/sw-setup/SKILL.md'), false);
    assert.equal(exists(root, '.github/agents/sw-qa-engineer.agent.md'), false);
  } finally { cleanup(root); }
});

test('Cursor is skipped when the Claude trees are installed', () => {
  const { root } = install();
  try {
    assert.equal(exists(root, '.cursor/skills/sw-setup/SKILL.md'), false);
    assert.ok(exists(root, '.cursor/mcp.json'), 'but Cursor still needs its MCP config');
  } finally { cleanup(root); }
});

test('Cursor gets its own trees when Claude Code is not installed', () => {
  const root = hostRepo({ dirs: ['.cursor'] });
  try {
    run(['apply', '--yes', '--agent', 'cursor', '--root', root]);
    assert.ok(exists(root, '.cursor/skills/sw-setup/SKILL.md'));
    assert.ok(exists(root, '.cursor/agents/sw-qa-engineer.md'));
  } finally { cleanup(root); }
});

test('the lock file is gitignored and records what was installed', () => {
  const { root } = install();
  try {
    assert.match(readText(root, '.gitignore'), /\.sw-ai-sdk\//);
    const lock = readLock(root);
    assert.equal(lock.content_version, 1);
    assert.ok(Object.keys(lock.files).length > 0);
    assert.ok(lock.rules.length > 0);
    assert.ok(lock.fences.length > 0);
  } finally { cleanup(root); }
});

test('the gitignore entry is added once, not once per run', () => {
  const { root } = install();
  try {
    run(['apply', '--yes', '--root', root]);
    const hits = readText(root, '.gitignore').split('\n').filter((l) => l.trim() === '.sw-ai-sdk/');
    assert.equal(hits.length, 1);
  } finally { cleanup(root); }
});

test('AGENTS.md keeps the user prose and appends a managed block', () => {
  const root = hostRepo({ dirs: ALL_MARKERS, files: { 'AGENTS.md': '# mine\n\nUse pnpm.\n' } });
  try {
    run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root]);
    const text = readText(root, 'AGENTS.md');
    assert.ok(text.startsWith('# mine\n\nUse pnpm.\n'));
    assert.match(text, /Shopware agentic harness/);
  } finally { cleanup(root); }
});

test('plan and apply agree on the actions, modulo tense', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const planned = parse(run(['plan', '--root', root])).actions.map((a) => a.id).sort();
    const applied = parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root])).actions.map((a) => a.id).sort();
    assert.deepEqual(applied, planned);
  } finally { cleanup(root); }
});
