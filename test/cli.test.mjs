// The agent-facing contract: one JSON object, a mandatory next_step, and exit
// codes that mean what they say.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ALL_AGENT_FLAGS, ALL_MARKERS, cleanup, exists, hostRepo, parse, readLock, run, snapshot } from './helpers.mjs';

test('guide exits 0 and prints the protocol', () => {
  const r = run(['guide']);
  assert.equal(r.code, 0);
  const body = parse(r);
  assert.equal(body.ok, true);
  assert.match(body.guide, /install protocol/);
});

test('--help exits 0; no arguments exits 2', () => {
  assert.equal(run(['--help']).code, 0);
  assert.equal(run([]).code, 2);
});

test('an unknown command exits 2 with runnable help', () => {
  const r = run(['bogus']);
  assert.equal(r.code, 2);
  const body = parse(r);
  assert.equal(body.ok, false);
  assert.ok(body.help.length > 0);
  for (const line of body.help) {
    assert.match(line, /^sw-ecosystem-agentic-harness /, `help entry is not runnable: ${line}`);
  }
});

test('an unknown --agent and --scope exit 2 and name the valid values', () => {
  for (const args of [['status', '--agent', 'emacs'], ['status', '--scope', 'global']]) {
    const r = run(args);
    assert.equal(r.code, 2, args.join(' '));
    assert.ok(parse(r).help.length > 0);
  }
});

test('an unknown option exits 2', () => {
  assert.equal(run(['status', '--nope']).code, 2);
});

test('apply without --yes exits 2 and writes nothing', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const before = snapshot(root);
    const r = run(['apply', '--root', root]);
    assert.equal(r.code, 2);
    assert.equal(parse(r).ok, false);
    assert.deepEqual(snapshot(root), before);
  } finally { cleanup(root); }
});

test('uninstall without --yes exits 2 and writes nothing', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const before = snapshot(root);
    assert.equal(run(['uninstall', '--root', root]).code, 2);
    assert.deepEqual(snapshot(root), before);
  } finally { cleanup(root); }
});

test('a missing --root fails with exit 2, not a stack trace', () => {
  const r = run(['status', '--root', '/definitely/not/here']);
  assert.equal(r.code, 2);
  assert.doesNotMatch(r.stderr, /at Object|at Module/);
});

test('stdout is exactly one JSON object, and stderr carries none of the result', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const r = run(['status', '--root', root]);
    assert.equal(r.code, 0);
    assert.doesNotThrow(() => JSON.parse(r.stdout));
    assert.equal(r.stderr.trim(), '');
  } finally { cleanup(root); }
});

test('every successful command carries a non-empty next_step', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    for (const args of [['guide'], ['status', '--root', root], ['plan', '--root', root]]) {
      const body = parse(run(args));
      assert.ok(body.next_step.trim().length > 0, args.join(' '));
    }
  } finally { cleanup(root); }
});

// ------------------------------------------------------------------ install

/** Deep-replace every occurrence of `root` in string values with a placeholder,
 * and drop `hash`/`bytes`, so two locks recorded under different scratch roots
 * (the wiki path is baked into ShopwareDevKnowledgeBase's args, which changes
 * its content hash) can be compared for equality regardless of where each ran. */
function normaliseRoot(value, root) {
  if (typeof value === 'string') return value.split(root).join('<root>');
  if (Array.isArray(value)) return value.map((v) => normaliseRoot(v, root));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === 'hash' || k === 'bytes') continue;
      out[k] = normaliseRoot(v, root);
    }
    return out;
  }
  return value;
}

/** Lock content stripped of timestamps, hashes and the scratch root, for cross-root comparison. */
function comparableLock(lock, root) {
  const clone = normaliseRoot(structuredClone(lock), root);
  delete clone.installed_at;
  delete clone.updated_at;
  for (const host of Object.values(clone.agents ?? {})) delete host.installed_at;
  return clone;
}

test('install produces the same files and lock content as apply --yes', () => {
  const installRoot = hostRepo({ dirs: ALL_MARKERS });
  const applyRoot = hostRepo({ dirs: ALL_MARKERS });
  try {
    const installResult = run(['install', ...ALL_AGENT_FLAGS, '--root', installRoot]);
    const applyResult = run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', applyRoot]);
    assert.equal(installResult.code, 0);
    assert.equal(applyResult.code, 0);

    const installFiles = Object.keys(snapshot(installRoot)).sort();
    const applyFiles = Object.keys(snapshot(applyRoot)).sort();
    assert.deepEqual(installFiles, applyFiles);

    const installLock = readLock(installRoot);
    const applyLock = readLock(applyRoot);
    assert.deepEqual(comparableLock(installLock, installRoot), comparableLock(applyLock, applyRoot));
  } finally { cleanup(installRoot); cleanup(applyRoot); }
});

test('install\'s JSON carries ok:true, command:"install" and a non-empty next_step', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const body = parse(run(['install', ...ALL_AGENT_FLAGS, '--root', root]));
    assert.equal(body.ok, true);
    assert.equal(body.command, 'install');
    assert.ok(body.next_step.trim().length > 0);
  } finally { cleanup(root); }
});

test('install needs no --yes; apply without --yes still exits 2', () => {
  const installRoot = hostRepo({ dirs: ALL_MARKERS });
  const applyRoot = hostRepo({ dirs: ALL_MARKERS });
  try {
    assert.equal(run(['install', ...ALL_AGENT_FLAGS, '--root', installRoot]).code, 0);
    assert.equal(run(['apply', '--root', applyRoot]).code, 2);
  } finally { cleanup(installRoot); cleanup(applyRoot); }
});

test('install --agent claude-code writes the Claude trees and not the Codex ones', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const r = run(['install', '--agent', 'claude-code', '--root', root]);
    assert.equal(r.code, 0);
    assert.ok(exists(root, '.claude/skills'));
    assert.ok(!exists(root, '.codex/config.toml'));
  } finally { cleanup(root); }
});

test('install --yes behaves identically to install', () => {
  const plainRoot = hostRepo({ dirs: ALL_MARKERS });
  const yesRoot = hostRepo({ dirs: ALL_MARKERS });
  try {
    assert.equal(run(['install', ...ALL_AGENT_FLAGS, '--root', plainRoot]).code, 0);
    assert.equal(run(['install', '--yes', ...ALL_AGENT_FLAGS, '--root', yesRoot]).code, 0);

    assert.deepEqual(Object.keys(snapshot(plainRoot)).sort(), Object.keys(snapshot(yesRoot)).sort());
    assert.deepEqual(comparableLock(readLock(plainRoot), plainRoot), comparableLock(readLock(yesRoot), yesRoot));
  } finally { cleanup(plainRoot); cleanup(yesRoot); }
});

test('an unknown flag on install exits 2 with a non-empty runnable help array', () => {
  const r = run(['install', '--nope']);
  assert.equal(r.code, 2);
  const body = parse(r);
  assert.ok(body.help.length > 0);
  for (const line of body.help) {
    assert.match(line, /^sw-ecosystem-agentic-harness /, `help entry is not runnable: ${line}`);
  }
});
