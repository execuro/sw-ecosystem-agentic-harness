// The agent-facing contract: one JSON object, a mandatory next_step, and exit
// codes that mean what they say.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ALL_MARKERS, cleanup, hostRepo, parse, run, snapshot } from './helpers.mjs';

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

test('an unknown --host and --scope exit 2 and name the valid values', () => {
  for (const args of [['status', '--host', 'emacs'], ['status', '--scope', 'global']]) {
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
