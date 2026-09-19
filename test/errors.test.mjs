// Error aggregation. One unwritable host must never abort the others, and an
// apply we cannot record is refused rather than left unrecoverable.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chmodSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_AGENT_FLAGS, ALL_MARKERS, cleanup, exists, hostRepo, parse, readLock, run, snapshot } from './helpers.mjs';

const ROOTLESS = { skip: process.platform === 'win32' || process.getuid?.() === 0 };

test('a read-only host fails alone; the others still install', ROOTLESS, () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    chmodSync(join(root, '.codex'), 0o555);
    const r = run(['apply', '--yes', '--agent', 'claude-code', '--agent', 'codex', '--root', root]);
    const body = parse(r);

    assert.equal(r.code, 1, 'a failed host must surface as a non-zero exit');
    assert.ok(body.errors.length > 0);
    assert.ok(body.errors.some((e) => e.host === 'codex'));
    // Claude Code went in regardless.
    assert.ok(exists(root, '.claude/skills/sw-setup/SKILL.md'));
    assert.ok(exists(root, '.claude/agents/sw-qa-engineer.md'));
    assert.ok(body.agents.some((h) => h.id === 'claude-code' && h.created > 0));
    assert.ok(body.next_step.length > 0, 'a failure still has to say what to do');
  } finally {
    chmodSync(join(root, '.codex'), 0o755);
    cleanup(root);
  }
});

test('two failing hosts are both reported', ROOTLESS, () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    chmodSync(join(root, '.codex'), 0o555);
    chmodSync(join(root, '.github'), 0o555);
    const body = parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root]));
    const failed = new Set(body.errors.map((e) => e.host));
    assert.ok(failed.has('codex'), 'codex failure missing');
    assert.ok(failed.has('copilot'), 'copilot failure missing');
    assert.ok(exists(root, '.claude/skills/sw-setup/SKILL.md'), 'claude-code should still be installed');
  } finally {
    chmodSync(join(root, '.codex'), 0o755);
    chmodSync(join(root, '.github'), 0o755);
    cleanup(root);
  }
});

test('an apply that cannot be recorded is refused before it writes', ROOTLESS, () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const before = snapshot(root);
    chmodSync(root, 0o555);
    const r = run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root]);
    assert.equal(r.code, 1);
    assert.match(parse(r).error, /lock file/i);
    chmodSync(root, 0o755);
    assert.deepEqual(snapshot(root), before,
      'an apply we cannot undo must not happen at all');
    assert.equal(readLock(root), null);
  } finally {
    chmodSync(root, 0o755);
    cleanup(root);
  }
});

test('status still answers when a host is unreadable', ROOTLESS, () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    chmodSync(join(root, '.codex'), 0o555);
    const r = run(['status', '--root', root]);
    assert.equal(r.code, 0);
    const body = parse(r);
    assert.equal(body.agents.length, 4, 'every host is still reported');
  } finally {
    chmodSync(join(root, '.codex'), 0o755);
    cleanup(root);
  }
});
