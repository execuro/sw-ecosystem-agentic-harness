// Uninstall works from the lock alone, and must leave the repository as it
// found it. JSON files are compared by value: rewriting one re-serialises it,
// which is documented in `guide`, so byte equality is asserted only for the
// formats we can restore exactly.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ALL_MARKERS, cleanup, exists, hostRepo, parse, readJson, readLock, readText, run, snapshot,
} from './helpers.mjs';

const USER_FILES = {
  '.mcp.json': JSON.stringify({ mcpServers: { mine: { command: 'node', args: ['s.js'] } } }, null, 2) + '\n',
  '.claude/settings.json': JSON.stringify({
    permissions: { deny: ['Edit(secrets/**)'], allow: ['Bash(ls *)'] },
  }, null, 2) + '\n',
  'AGENTS.md': '# my notes\n\nProject uses pnpm.\n',
  '.gitignore': 'node_modules/\n',
  '.codex/config.toml': '# mine\nmodel = "gpt-5"\n',
};

test('a full round trip restores the repository', () => {
  const root = hostRepo({ dirs: ALL_MARKERS, files: USER_FILES });
  try {
    const before = snapshot(root);
    run(['apply', '--yes', '--root', root]);
    const body = parse(run(['uninstall', '--yes', '--root', root]));
    assert.equal(body.summary.failed, 0);
    assert.deepEqual(body.kept, []);

    const after = snapshot(root);
    // Non-JSON formats come back byte for byte.
    for (const path of ['AGENTS.md', '.gitignore', '.codex/config.toml']) {
      assert.equal(after[path], before[path], `${path} was not restored byte for byte`);
    }
    // JSON comes back by value; see the re-serialisation note in `guide`.
    assert.deepEqual(readJson(root, '.mcp.json'), JSON.parse(USER_FILES['.mcp.json']));
    assert.deepEqual(readJson(root, '.claude/settings.json'), JSON.parse(USER_FILES['.claude/settings.json']));
    // Nothing of ours is left behind.
    assert.equal(exists(root, '.claude/skills/sw-setup/SKILL.md'), false);
    assert.equal(exists(root, '.codex/agents/sw-qa-engineer.toml'), false);
    assert.equal(readLock(root), null, 'the lock file should be gone');
  } finally { cleanup(root); }
});

test('a repository that had nothing is emptied of everything we added', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    run(['apply', '--yes', '--root', root]);
    run(['uninstall', '--yes', '--root', root]);
    for (const path of ['.mcp.json', '.vscode/mcp.json', '.cursor/mcp.json',
      '.claude/settings.json', '.codex/config.toml', 'AGENTS.md', '.gitignore']) {
      assert.equal(exists(root, path), false, `${path} should have been removed`);
    }
  } finally { cleanup(root); }
});

test('only our rules are removed; the user keeps theirs', () => {
  const root = hostRepo({ dirs: ALL_MARKERS, files: USER_FILES });
  try {
    run(['apply', '--yes', '--root', root]);
    run(['uninstall', '--yes', '--root', root]);
    const perms = readJson(root, '.claude/settings.json').permissions;
    assert.deepEqual(perms.deny, ['Edit(secrets/**)']);
    assert.deepEqual(perms.allow, ['Bash(ls *)']);
  } finally { cleanup(root); }
});

test('a container we did not create is kept', () => {
  const root = hostRepo({ dirs: ALL_MARKERS, files: USER_FILES });
  try {
    run(['apply', '--yes', '--root', root]);
    run(['uninstall', '--yes', '--root', root]);
    assert.deepEqual(Object.keys(readJson(root, '.mcp.json').mcpServers), ['mine']);
  } finally { cleanup(root); }
});

test('a hand-edited file is kept and reported, never deleted', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    run(['apply', '--yes', '--root', root]);
    const target = join(root, '.claude', 'agents', 'sw-qa-engineer.md');
    writeFileSync(target, 'mine now\n');
    const body = parse(run(['uninstall', '--yes', '--root', root]));
    assert.ok(body.kept.some((k) => k.target === '.claude/agents/sw-qa-engineer.md'));
    assert.equal(readFileSync(target, 'utf8'), 'mine now\n');
    assert.match(body.next_step, /kept/);
  } finally { cleanup(root); }
});

test('a hand-edited managed fence is kept', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    run(['apply', '--yes', '--root', root]);
    const file = join(root, 'AGENTS.md');
    writeFileSync(file, readFileSync(file, 'utf8').replace('## Shopware agentic harness', '## My heading'));
    const body = parse(run(['uninstall', '--yes', '--root', root]));
    assert.ok(body.kept.some((k) => k.target === 'AGENTS.md'));
    assert.match(readText(root, 'AGENTS.md'), /## My heading/);
  } finally { cleanup(root); }
});

test('uninstall with no lock does nothing and says so', () => {
  const root = hostRepo({ dirs: ALL_MARKERS, files: USER_FILES });
  try {
    const before = snapshot(root);
    const body = parse(run(['uninstall', '--yes', '--root', root]));
    assert.equal(body.ok, true);
    assert.equal(body.summary.removed, 0);
    assert.match(body.next_step, /no .* was found|Nothing to remove/);
    assert.deepEqual(snapshot(root), before, 'a missing lock must never trigger a guess');
  } finally { cleanup(root); }
});

test('a lock from an unknown content version is refused with an upgrade hint', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    run(['apply', '--yes', '--root', root]);
    const file = join(root, '.sw-ai-sdk', 'harness.lock.json');
    const lock = JSON.parse(readFileSync(file, 'utf8'));
    lock.content_version = 99;
    writeFileSync(file, JSON.stringify(lock, null, 2));
    for (const cmd of ['status', 'plan', 'uninstall']) {
      const args = cmd === 'uninstall' ? [cmd, '--yes', '--root', root] : [cmd, '--root', root];
      const r = run(args);
      assert.equal(r.code, 1, cmd);
      assert.match(parse(r).next_step, /Upgrade/i, cmd);
    }
  } finally { cleanup(root); }
});

test('uninstall --host removes one host and leaves the others installed', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    run(['apply', '--yes', '--root', root]);
    run(['uninstall', '--yes', '--host', 'codex', '--root', root]);
    assert.equal(exists(root, '.codex/agents/sw-qa-engineer.toml'), false);
    assert.ok(exists(root, '.claude/agents/sw-qa-engineer.md'));
    assert.ok(readLock(root), 'the lock must survive a partial uninstall');
  } finally { cleanup(root); }
});

test('apply after uninstall reinstalls cleanly', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    run(['apply', '--yes', '--root', root]);
    const first = snapshot(root);
    run(['uninstall', '--yes', '--root', root]);
    run(['apply', '--yes', '--root', root]);
    const second = snapshot(root);
    delete first['.sw-ai-sdk/harness.lock.json'];
    delete second['.sw-ai-sdk/harness.lock.json'];
    assert.deepEqual(second, first);
  } finally { cleanup(root); }
});
