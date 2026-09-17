// The bug this suite exists for: with no `--host`, `install`/`apply` used to
// silently expand to every host in the HOSTS constant, writing `.cursor/`,
// `.codex/`, `.github/` and `.vscode/` into a repository whose only coding
// agent was Claude Code. Host resolution now follows one explicit chain —
// `--host`, then a recorded lock, then a TTY prompt, then a usage error —
// and this file is the coverage that chain closed.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseSelection } from '../lib/prompt.mjs';
import { HOSTS } from '../lib/hosts.mjs';
import {
  cleanup, exists, hostRepo, parse, readLock, run, snapshot,
} from './helpers.mjs';

// -------------------------------------------------------- 1. exact scoping

test('install --host claude-code in a Claude-only repo writes no other host tree', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    const body = parse(run(['install', '--host', 'claude-code', '--root', root]));
    assert.equal(body.ok, true);
    assert.ok(exists(root, '.claude/skills/sw-setup/SKILL.md'));
    for (const dir of ['.codex', '.agents', '.github', '.vscode', '.cursor']) {
      assert.equal(exists(root, dir), false, `${dir} must not have been created`);
    }
  } finally { cleanup(root); }
});

// -------------------------------------------------- 2. no TTY, no --host

test('no TTY, no --host and no lock exits 2, names four runnable commands, and writes nothing', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    const before = snapshot(root);
    const r = run(['install', '--root', root]);
    assert.equal(r.code, 2);
    const body = parse(r);
    assert.equal(body.ok, false);
    assert.ok(body.help.length >= HOSTS.length);
    for (const h of HOSTS) {
      assert.ok(body.help.some((line) => line.includes(`--host ${h}`)), `help is missing --host ${h}`);
      assert.match(body.help.find((line) => line.includes(`--host ${h}`)), /^sw-ecosystem-agentic-harness /);
    }
    assert.deepEqual(snapshot(root), before, 'nothing may be written when the host choice fails');
  } finally { cleanup(root); }
});

// ------------------------------------------------------------- 3. lock reuse

test('a bare re-run reuses the hosts recorded by the first install, no prompt needed', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    run(['install', '--host', 'claude-code', '--root', root]);
    const r = run(['install', '--root', root]);
    assert.equal(r.code, 0);
    const body = parse(r);
    assert.deepEqual(body.hosts.map((h) => h.id).sort(), ['claude-code']);
    for (const dir of ['.codex', '.agents', '.github', '.vscode', '.cursor']) {
      assert.equal(exists(root, dir), false);
    }
  } finally { cleanup(root); }
});

// --------------------------------------------------- 4. --host overrides lock

test('--host overrides a lock recording a different set of hosts', () => {
  const root = hostRepo({ dirs: ['.claude', '.codex', '.agents'] });
  try {
    run(['install', '--host', 'claude-code', '--root', root]);
    const lockBefore = readLock(root);
    assert.deepEqual(Object.keys(lockBefore.hosts), ['claude-code']);

    const body = parse(run(['install', '--host', 'codex', '--root', root]));
    assert.equal(body.ok, true);
    assert.deepEqual(body.hosts.map((h) => h.id), ['codex']);
    assert.ok(exists(root, '.agents/skills/sw-setup/SKILL.md'));

    const lockAfter = readLock(root);
    assert.deepEqual(Object.keys(lockAfter.hosts).sort(), ['claude-code', 'codex']);
  } finally { cleanup(root); }
});

// ------------------------------------------------- 5. --host wins, no TTY

test('--host still wins with no TTY and no prior lock', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    const r = run(['install', '--host', 'claude-code', '--root', root]);
    assert.equal(r.code, 0);
    assert.ok(exists(root, '.claude/skills/sw-setup/SKILL.md'));
  } finally { cleanup(root); }
});

// ---------------------------------------------------- plan's all-four preview

test('plan with no --host and no lock previews all four and says none was selected', () => {
  const root = hostRepo({ dirs: ['.claude', '.codex', '.agents', '.github', '.vscode', '.cursor'] });
  try {
    const body = parse(run(['plan', '--root', root]));
    assert.equal(body.ok, true);
    assert.match(body.next_step, /previews all four hosts/);
  } finally { cleanup(root); }
});

// -------------------------------------------------------------- parseSelection

test('parseSelection: valid input', () => {
  const hosts = ['claude-code', 'codex', 'copilot', 'cursor'];
  assert.deepEqual(parseSelection('1', hosts), ['claude-code']);
  assert.deepEqual(parseSelection('1,3', hosts), ['claude-code', 'copilot']);
  assert.deepEqual(parseSelection(' 2 , 4 ', hosts), ['codex', 'cursor']);
  assert.deepEqual(parseSelection('all', hosts), hosts);
  assert.deepEqual(parseSelection('ALL', hosts), hosts);
  assert.deepEqual(parseSelection('', hosts), hosts);
  assert.deepEqual(parseSelection('   ', hosts), hosts);
  assert.deepEqual(parseSelection('2,2,2', hosts), ['codex'], 'duplicates collapse');
});

test('parseSelection: out-of-range input is rejected', () => {
  const hosts = ['claude-code', 'codex', 'copilot', 'cursor'];
  assert.throws(() => parseSelection('0', hosts), /out of range/);
  assert.throws(() => parseSelection('5', hosts), /out of range/);
  assert.throws(() => parseSelection('1,9', hosts), /out of range/);
});

test('parseSelection: garbage input is rejected', () => {
  const hosts = ['claude-code', 'codex', 'copilot', 'cursor'];
  assert.throws(() => parseSelection('claude-code', hosts), /not a number/);
  assert.throws(() => parseSelection('1;3', hosts), /not a number/);
  assert.throws(() => parseSelection(',', hosts), /no selection given/);
  assert.throws(() => parseSelection('-1', hosts), /not a number/);
});
