// Where the lock file lands, and how an existing install moves.
//
// A Shopware project ignores the whole of `var/` through the `shopware/core`
// Flex recipe, and already keeps machine-local state there (`var/cache`,
// `var/log`). The lock goes with it, which keeps the repository root clean and
// means the installer writes no `.gitignore` line at all. A root with no
// `var/` — `--scope user` under $HOME, or a checkout that is not a Shopware
// project — keeps the original dot-directory and its managed line.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ALL_AGENT_FLAGS, cleanup, hostRepo, parse, readLock, readText, run, shopwareRepo,
} from './helpers.mjs';


test('a project with var/ gets the lock under var/ and no .gitignore line', () => {
  const root = shopwareRepo({ dirs: ['.claude'] });
  try {
    const body = parse(run(['apply', '--yes', '--agent', 'claude-code', '--root', root]));
    assert.equal(body.ok, true);
    assert.equal(body.lock_file, 'var/sw-ai-sdk/harness.lock.json');
    assert.ok(existsSync(join(root, 'var', 'sw-ai-sdk', 'harness.lock.json')));
    assert.equal(existsSync(join(root, '.sw-ai-sdk')), false);
    assert.equal(existsSync(join(root, '.gitignore')), false);
    assert.ok(readLock(root).files['.claude/agents/sw-qa-engineer.md']);
  } finally { cleanup(root); }
});

test('a root without var/ keeps the dot-directory and its managed line', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    const body = parse(run(['apply', '--yes', '--agent', 'claude-code', '--root', root]));
    assert.equal(body.lock_file, '.sw-ai-sdk/harness.lock.json');
    assert.ok(existsSync(join(root, '.sw-ai-sdk', 'harness.lock.json')));
    assert.match(readText(root, '.gitignore'), /^\.sw-ai-sdk\/$/m);
  } finally { cleanup(root); }
});

test('an install recorded at the old path moves, and takes its .gitignore line with it', () => {
  const root = shopwareRepo({ dirs: ['.claude'] });
  try {
    // Install as an older version would have: no var/, so the dot-directory.
    const varDir = join(root, 'var');
    rmSync(varDir, { recursive: true, force: true });
    parse(run(['apply', '--yes', '--agent', 'claude-code', '--root', root]));
    assert.ok(existsSync(join(root, '.sw-ai-sdk', 'harness.lock.json')));
    assert.match(readText(root, '.gitignore'), /\.sw-ai-sdk\//);
    const before = readLock(root);

    // The project now has its var/ — the next apply migrates.
    mkdirSync(varDir, { recursive: true });
    const body = parse(run(['apply', '--yes', '--root', root]));
    assert.equal(body.ok, true);
    assert.equal(body.lock_file, 'var/sw-ai-sdk/harness.lock.json');
    assert.ok(existsSync(join(root, 'var', 'sw-ai-sdk', 'harness.lock.json')));
    assert.equal(existsSync(join(root, '.sw-ai-sdk')), false, 'the old directory is gone');
    // The `.gitignore` we created for the lock goes with it; a pre-existing
    // one would simply lose the managed block.
    assert.equal(
      existsSync(join(root, '.gitignore')) ? readText(root, '.gitignore') : '',
      '',
      'the managed line is taken back',
    );
    assert.ok(body.migrated?.some((m) => m.target === '.gitignore'));

    // The record survived the move: same agents, same files, no reinstall.
    const after = readLock(root);
    assert.deepEqual(Object.keys(after.agents), Object.keys(before.agents));
    assert.deepEqual(Object.keys(after.files).sort(), Object.keys(before.files).sort());
    assert.equal(body.summary.created, 0);
  } finally { cleanup(root); }
});

test('declines recorded before the move are still honoured after it', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    parse(run(['apply', '--yes', '--agent', 'claude-code', '--root', root]));
    // Remove a rule we installed: that is a decline, not a gap.
    const settings = join(root, '.claude', 'settings.json');
    const doc = JSON.parse(readText(root, '.claude/settings.json'));
    const dropped = doc.permissions.deny.shift();
    writeFileSync(settings, JSON.stringify(doc, null, 2));
    parse(run(['apply', '--yes', '--root', root]));
    assert.ok(readLock(root).declined.some((d) => d.value === dropped));

    mkdirSync(join(root, 'var'), { recursive: true });
    parse(run(['apply', '--yes', '--root', root]));
    const moved = readLock(root);
    assert.ok(moved.declined.some((d) => d.value === dropped), 'the decline survived the move');
    assert.equal(
      JSON.parse(readText(root, '.claude/settings.json')).permissions.deny.includes(dropped),
      false,
      'a declined rule is never re-added',
    );
  } finally { cleanup(root); }
});

test('uninstall from var/ leaves no directory behind', () => {
  const root = shopwareRepo({ dirs: ['.claude'] });
  try {
    parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root]));
    assert.ok(existsSync(join(root, 'var', 'sw-ai-sdk')));
    const body = parse(run(['uninstall', '--yes', '--root', root]));
    assert.equal(body.ok, true);
    assert.equal(existsSync(join(root, 'var', 'sw-ai-sdk')), false);
    assert.ok(existsSync(join(root, 'var')), 'the project’s own var/ is not ours to remove');
  } finally { cleanup(root); }
});

test('migrating a repository that had its own .gitignore keeps every line of it', () => {
  const root = hostRepo({ dirs: ['.claude'], files: { '.gitignore': '/vendor/\nnode_modules/\n' } });
  try {
    parse(run(['apply', '--yes', '--agent', 'claude-code', '--root', root]));
    assert.match(readText(root, '.gitignore'), /\.sw-ai-sdk\//);

    mkdirSync(join(root, 'var'), { recursive: true });
    parse(run(['apply', '--yes', '--root', root]));
    const ignore = readText(root, '.gitignore');
    assert.doesNotMatch(ignore, /sw-ai-sdk/, 'our block is gone');
    assert.match(ignore, /^\/vendor\/$/m);
    assert.match(ignore, /^node_modules\/$/m);
  } finally { cleanup(root); }
});
