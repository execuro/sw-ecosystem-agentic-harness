// Host detection: marker-directory existence only, and never a write.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_MARKERS, cleanup, hostRepo, parse, run, snapshot } from './helpers.mjs';

const EXPECT = {
  '.claude': 'claude-code', '.codex': 'codex', '.github': 'copilot', '.cursor': 'cursor',
};

test('every combination of markers detects exactly the right hosts', () => {
  for (let mask = 0; mask < 16; mask += 1) {
    const dirs = ALL_MARKERS.filter((_, i) => mask & (1 << i));
    const root = hostRepo({ dirs });
    try {
      const body = parse(run(['status', '--root', root]));
      const detected = new Set(body.hosts.filter((h) => h.detected).map((h) => h.id));
      const wanted = new Set(dirs.map((d) => EXPECT[d]));
      assert.deepEqual([...detected].sort(), [...wanted].sort(), `markers: ${dirs.join(',') || 'none'}`);
    } finally { cleanup(root); }
  }
});

test('a marker that is a file, not a directory, does not count', () => {
  const root = hostRepo({ files: { '.claude': 'not a directory' } });
  try {
    const body = parse(run(['status', '--root', root]));
    assert.equal(body.hosts.find((h) => h.id === 'claude-code').detected, false);
  } finally { cleanup(root); }
});

test('status never writes — not even a lock file', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const before = snapshot(root);
    run(['status', '--root', root]);
    run(['status', '--root', root]);
    assert.deepEqual(snapshot(root), before);
  } finally { cleanup(root); }
});

test('plan never writes', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const before = snapshot(root);
    const body = parse(run(['plan', '--root', root]));
    assert.ok(body.summary.create > 0);
    assert.deepEqual(snapshot(root), before);
  } finally { cleanup(root); }
});

test('a read-only Codex marker is reported, not treated as a write failure', { skip: process.platform === 'win32' || process.getuid?.() === 0 }, () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    chmodSync(join(root, '.codex'), 0o555);
    const codex = parse(run(['status', '--root', root])).hosts.find((h) => h.id === 'codex');
    assert.equal(codex.writable, false);
    assert.match(codex.notes.join(' '), /read-only|sandbox/i);
  } finally {
    chmodSync(join(root, '.codex'), 0o755);
    cleanup(root);
  }
});

test('Cursor reports that it reads the Claude trees directly', () => {
  const root = hostRepo({ dirs: ['.cursor', '.claude/skills', '.claude/agents'] });
  try {
    const cursor = parse(run(['status', '--root', root])).hosts.find((h) => h.id === 'cursor');
    assert.match(cursor.notes.join(' '), /\.claude/);
  } finally { cleanup(root); }
});
