// The renderer, on its own. The JSON body is the model and lib/render.mjs is
// only a view, so every rule about what a human sees is testable here without
// a terminal, without a scratch repository and without an install.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classify, groupChanges, render } from '../lib/render.mjs';

const lines = (text) => text.replace(/\n$/, '').split('\n');

function applyBody(over = {}) {
  return {
    ok: true,
    command: 'install',
    version: '0.1.6',
    scope: 'project',
    root: '/repo',
    summary: {
      created: 0, updated: 0, unchanged: 274,
      conflict: 0, drift: 0, manual: 0, skipped: 2, failed: 0,
    },
    lock_file: '.sw-ai-sdk/harness.lock.json',
    next_step: 'Restart the coding agents listed in `help`.',
    help: ['Restart Claude Code, or run `/mcp` in the running session'],
    agents: [{ id: 'claude-code', created: 0, updated: 0, unchanged: 274, failed: 0 }],
    actions: [],
    manual: [],
    errors: [],
    ...over,
  };
}

// --------------------------------------------------------------- primitives

test('classify names a skill, a sub-agent and a config file the way a user does', () => {
  assert.deepEqual(classify('.claude/skills/sw-setup/reference/rows.md'),
    { kind: 'skill', name: 'sw-setup' });
  assert.deepEqual(classify('.claude/agents/sw-qa-engineer.md'),
    { kind: 'agent', name: 'sw-qa-engineer' });
  assert.deepEqual(classify('.github/agents/sw-qa-engineer.agent.md'),
    { kind: 'agent', name: 'sw-qa-engineer' });
  assert.deepEqual(classify('.codex/agents/sw-qa-engineer.toml'),
    { kind: 'agent', name: 'sw-qa-engineer' });
  assert.deepEqual(classify('.mcp.json'), { kind: 'file', name: '.mcp.json' });
});

test('groupChanges collapses a skill\'s files to one name and a config file to one entry', () => {
  const groups = groupChanges([
    { host: 'claude-code', state: 'created', target: '.claude/skills/sw-setup/SKILL.md' },
    { host: 'claude-code', state: 'created', target: '.claude/skills/sw-setup/reference/rows.md' },
    { host: 'claude-code', state: 'created', target: '.mcp.json' },
    { host: 'claude-code', state: 'created', target: '.mcp.json' },
    { host: 'claude-code', state: 'unchanged', target: '.gitignore' },
  ], ['created']);
  assert.equal(groups.length, 1);
  const bucket = groups[0].buckets.get('added');
  assert.deepEqual([...bucket.skill], ['sw-setup']);
  assert.deepEqual([...bucket.file], ['.mcp.json']);
});

// ------------------------------------------------------ 1. nothing changed

test('an install with nothing to do renders exactly one line, with no counts and no agent names', () => {
  const text = render(applyBody());
  assert.equal(lines(text).length, 1, text);
  assert.doesNotMatch(text, /274|\bfiles?\b/i, 'a file count is not news to a human');
  for (const name of ['Claude Code', 'Codex', 'Cursor', 'GitHub Copilot']) {
    assert.doesNotMatch(text, new RegExp(name), `nothing changed, so ${name} must not be listed`);
  }
  assert.match(text, /up to date/i);
});

test('nothing changed means no restart line — there is nothing to restart for', () => {
  assert.doesNotMatch(render(applyBody()), /[Rr]estart/);
});

// ----------------------------------------------------- 2. something changed

test('changes are grouped by agent and end with that agent\'s restart line', () => {
  const text = render(applyBody({
    summary: { created: 3, updated: 1, unchanged: 0, conflict: 0, drift: 0, manual: 0, skipped: 0, failed: 0 },
    agents: [{ id: 'claude-code', created: 3, updated: 1, unchanged: 0, failed: 0 }],
    actions: [
      { host: 'claude-code', state: 'created', target: '.claude/skills/sw-setup/SKILL.md' },
      { host: 'claude-code', state: 'created', target: '.claude/agents/sw-qa-engineer.md' },
      { host: 'claude-code', state: 'created', target: '.mcp.json' },
      { host: 'claude-code', state: 'updated', target: '.gitignore' },
    ],
  }));
  assert.match(text, /Claude Code/);
  assert.match(text, /added 1 skill: sw-setup/);
  assert.match(text, /added 1 sub-agent: sw-qa-engineer/);
  assert.match(text, /added \.mcp\.json/);
  assert.match(text, /updated \.gitignore/);
  assert.match(text, /Restart Claude Code/);
});

test('--verbose prints the per-file detail the JSON carries', () => {
  const body = applyBody({
    summary: { created: 2, updated: 0, unchanged: 0, conflict: 0, drift: 0, manual: 0, skipped: 0, failed: 0 },
    actions: [
      { host: 'claude-code', state: 'created', target: '.claude/skills/sw-setup/SKILL.md' },
      { host: 'claude-code', state: 'created', target: '.claude/skills/sw-setup/reference/rows.md' },
    ],
  });
  assert.doesNotMatch(render(body), /reference\/rows\.md/);
  assert.match(render(body, { verbose: true }), /\.claude\/skills\/sw-setup\/reference\/rows\.md/);
});

// -------------------------------------------- 3. conflicts and drift, always

test('a conflict and a drift are both shown with their file and their remedy', () => {
  const text = render(applyBody({
    summary: { created: 1, updated: 0, unchanged: 0, conflict: 1, drift: 1, manual: 0, skipped: 0, failed: 0 },
    actions: [
      { host: 'claude-code', state: 'created', target: '.mcp.json' },
      {
        host: 'claude-code', state: 'conflict', target: '.claude/skills/sw-setup/SKILL.md',
        reason: 'a different file is already there', remedy: 'move it aside, then re-run apply',
      },
      {
        host: 'claude-code', state: 'drift', target: '.claude/agents/sw-qa-engineer.md',
        reason: 'you edited it after install', remedy: 'delete it to take ours again',
      },
    ],
  }));
  assert.match(text, /\.claude\/skills\/sw-setup\/SKILL\.md/);
  assert.match(text, /move it aside, then re-run apply/);
  assert.match(text, /\.claude\/agents\/sw-qa-engineer\.md/);
  assert.match(text, /delete it to take ours again/);
});

test('a status with drift never collapses it into a count', () => {
  const text = render({
    ok: true, command: 'status', version: '0.1.6', installed_version: '0.1.6',
    state: 'drift', next_step: 'Run plan.', help: ['sw-ecosystem-agentic-harness plan'],
    agents: [{ id: 'claude-code', detected: true, state: 'drift', installed: { skills: 10, agents: 7 }, notes: [] }],
    extra_components: [], declined: [], manual: [], errors: [],
    drift: [{ target: '.mcp.json', reason: 'edited since install', remedy: 're-run apply --yes' }],
  });
  assert.match(text, /\.mcp\.json/);
  assert.match(text, /re-run apply --yes/);
});

// `status` puts drift AND conflicts into one `drift[]` array. A conflict is a
// file somebody else wrote, which the CLI refuses to touch — telling the user
// they "edited it since install" blames them for it and suggests the wrong fix.
test('a status conflict is labelled a conflict, not an edit the user made', () => {
  const text = render({
    ok: true, command: 'status', version: '0.1.6', installed_version: '0.1.6',
    state: 'conflict', next_step: 'Run plan.', help: ['sw-ecosystem-agentic-harness plan'],
    agents: [{ id: 'claude-code', detected: true, state: 'conflict', installed: { skills: 10, agents: 7 }, notes: [] }],
    extra_components: [], declined: [], manual: [], errors: [],
    drift: [
      { target: '.claude/agents/foreign.md', state: 'conflict', reason: 'written by someone else', remedy: 'move it aside, then re-run apply' },
      { target: '.mcp.json', state: 'drift', reason: 'edited since install', remedy: 're-run apply --yes' },
    ],
  });
  const conflict = lines(text).find((l) => l.includes('.claude/agents/foreign.md'));
  assert.ok(conflict, 'the conflicting file must be named');
  assert.match(conflict, /conflict/);
  assert.doesNotMatch(conflict, /edited since install/);
  // ...and a real drift is still a drift.
  const drift = lines(text).find((l) => l.includes('.mcp.json'));
  assert.match(drift, /edited since install/);
});

// --------------------------------------- 4. never name an uninstalled agent

test('status names only the agents this project actually installed', () => {
  const text = render({
    ok: true, command: 'status', version: '0.1.6', installed_version: '0.1.6',
    state: 'ok', next_step: 'Nothing to do.', help: ['sw-ecosystem-agentic-harness plan'],
    agents: [
      { id: 'claude-code', detected: true, state: 'ok', installed: { skills: 10, agents: 7 }, notes: [] },
      // Present on disk (every repo has a .github/), but never installed into.
      { id: 'copilot', detected: true, state: 'not-installed', installed: {}, notes: [] },
      { id: 'codex', detected: false, state: 'absent', installed: {}, notes: [] },
      { id: 'cursor', detected: false, state: 'absent', installed: {}, notes: [] },
    ],
    extra_components: [], drift: [], declined: [], manual: [], errors: [],
  });
  assert.match(text, /Claude Code/);
  for (const name of ['Codex', 'Cursor', 'GitHub Copilot', 'copilot']) {
    assert.doesNotMatch(text, new RegExp(name), `${name} is not installed here and must not be named`);
  }
});

// ------------------------------------------------------------ other verbs

test('plan with nothing to do is one line; plan with changes names them', () => {
  const idle = render({
    ok: true, command: 'plan', next_step: 'Nothing to do.',
    summary: { create: 0, update: 0, unchanged: 274, drift: 0, conflict: 0, manual: 0, skipped: 0 },
    actions: [], errors: [],
  });
  assert.equal(lines(idle).length, 1, idle);

  const busy = render({
    ok: true, command: 'plan', next_step: 'Run apply.',
    summary: { create: 1, update: 0, unchanged: 0, drift: 0, conflict: 0, manual: 0, skipped: 0 },
    actions: [{ host: 'claude-code', state: 'create', target: '.claude/skills/sw-setup/SKILL.md' }],
    errors: [],
  });
  assert.match(busy, /1 change would be made/);
  assert.match(busy, /Claude Code/);
  assert.match(busy, /sw-setup/);
  assert.match(busy, /apply --yes/);
});

test('uninstall with no recorded install is one line', () => {
  const text = render({
    ok: true, command: 'uninstall', next_step: 'Nothing to remove.',
    summary: { removed: 0, reverted: 0, kept: 0, missing: 0, failed: 0 },
    kept: [], missing: [], errors: [],
  });
  assert.equal(lines(text).length, 1, text);
  assert.match(text, /Nothing to remove/);
});

test('uninstall reports what it kept because the user edited it', () => {
  const text = render({
    ok: true, command: 'uninstall', next_step: 'Restart.',
    summary: { removed: 270, reverted: 4, kept: 1, missing: 0, failed: 0 },
    kept: [{ target: '.claude/agents/sw-qa-engineer.md', state: 'kept' }], missing: [], errors: [],
  });
  assert.match(text, /270 files removed/);
  assert.match(text, /\.claude\/agents\/sw-qa-engineer\.md/);
});

test('a usage error renders the message and every runnable help line', () => {
  const text = render({
    ok: false, command: 'install', error: 'unknown option --host',
    next_step: 'sw-ecosystem-agentic-harness guide',
    help: ['sw-ecosystem-agentic-harness guide', 'sw-ecosystem-agentic-harness install'],
  });
  assert.match(text, /unknown option --host/);
  assert.match(text, /sw-ecosystem-agentic-harness guide/);
  assert.match(text, /sw-ecosystem-agentic-harness install/);
});

test('ANSI is emitted only when the caller says the stream is a terminal', () => {
  const body = applyBody();
  assert.doesNotMatch(render(body), /\[/);
  assert.match(render(body, { color: true }), /\[/);
});
