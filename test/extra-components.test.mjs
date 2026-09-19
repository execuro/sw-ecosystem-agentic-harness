// The two optional extra components: probed with `npx --no-install
// install-skill --print`, never fetched, never invoked with `--target`.
//
// Every test that spawns depends on the fake-npx shell shim, so the whole
// suite is skipped on win32 — the only platform where a `#!/usr/bin/env
// node` shim is not directly executable.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { EXTRA_COMPONENTS } from '../lib/extra-components.mjs';
import {
  ALL_AGENT_FLAGS, ALL_MARKERS, cleanup, exists, fakeNpx, hostRepo, mtimes, parse, readArgvLog, readLock, readText,
  run, snapshot, withNpx,
} from './helpers.mjs';

const SKIP = { skip: process.platform === 'win32' };

const BODY = {
  'sw-specs-editor': '---\nname: sw-specs-editor\ndescription: test fixture\n---\n\nSpecs Editor skill body.\n',
  'sw-tender-discovery-tool': '---\nname: sw-tender-discovery-tool\ndescription: test fixture\n---\n\nTender Discovery Tool skill body.\n',
};

function install(shimDir, extra = {}) {
  const root = hostRepo({ dirs: ALL_MARKERS, ...extra });
  const body = parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root], { env: withNpx(shimDir) }));
  return { root, body };
}

// ------------------------------------------------------------------- 1

test('neither extra component present — skipped everywhere, no host reads as drift', SKIP, () => {
  const { dir } = fakeNpx({ bodies: {} });
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const body = parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root], { env: withNpx(dir) }));
    const skillCopy = body.actions.filter((a) => a.kind === 'skill-copy');
    // Cursor reads Claude's trees directly here, so only 3 hosts get their
    // own skill-copy actions.
    assert.equal(skillCopy.length, EXTRA_COMPONENTS.length * 3);
    assert.ok(skillCopy.every((a) => a.state === 'skipped'));
    assert.equal(body.summary.failed, 0);
    for (const c of EXTRA_COMPONENTS) assert.equal(exists(root, `.claude/skills/${c.id}`), false);
    assert.match(body.next_step, /npm i -D/);

    const status = parse(run(['status', '--root', root], { env: withNpx(dir) }));
    assert.equal(status.agents.some((h) => h.state === 'drift' || h.state === 'not-installed'), false);
  } finally { cleanup(root); }
});

// ------------------------------------------------------------------- 2

test('one extra component present — lands in the three Claude-tree hosts, not Cursor', SKIP, () => {
  const { dir } = fakeNpx({ bodies: { 'sw-specs-editor': BODY['sw-specs-editor'] } });
  const { root, body } = install(dir);
  try {
    assert.ok(exists(root, '.claude/skills/sw-specs-editor/SKILL.md'));
    assert.ok(exists(root, '.agents/skills/sw-specs-editor/SKILL.md'));
    assert.ok(exists(root, '.github/skills/sw-specs-editor/SKILL.md'));
    assert.equal(exists(root, '.cursor/skills/sw-specs-editor/SKILL.md'), false);

    const other = body.actions.filter((a) => a.component === 'sw-tender-discovery-tool');
    assert.ok(other.every((a) => a.state === 'skipped'));

    const lock = readLock(root);
    const entries = Object.entries(lock.files).filter(([t]) => t.endsWith('sw-specs-editor/SKILL.md'));
    assert.equal(entries.length, 3);
    assert.ok(entries.every(([, v]) => v.source.startsWith('npm:')));
  } finally { cleanup(root); }
});

// ------------------------------------------------------------------- 3

test('--agent codex writes under .agents/skills, never .claude/skills', SKIP, () => {
  const { dir } = fakeNpx({ bodies: BODY });
  const root = hostRepo({ dirs: ['.codex', '.agents'] });
  try {
    run(['apply', '--yes', '--agent', 'codex', '--root', root], { env: withNpx(dir) });
    assert.ok(exists(root, '.agents/skills/sw-specs-editor/SKILL.md'));
    assert.equal(exists(root, '.claude/skills/sw-specs-editor/SKILL.md'), false);
  } finally { cleanup(root); }
});

test('--agent cursor writes under .cursor/skills alone', SKIP, () => {
  const { dir } = fakeNpx({ bodies: BODY });
  const root = hostRepo({ dirs: ['.cursor'] });
  try {
    run(['apply', '--yes', '--agent', 'cursor', '--root', root], { env: withNpx(dir) });
    assert.ok(exists(root, '.cursor/skills/sw-specs-editor/SKILL.md'));
  } finally { cleanup(root); }
});

// ------------------------------------------------------------------- 4

test('idempotent, and an extra component that disappears reads as skipped, not drift', SKIP, () => {
  const { dir } = fakeNpx({ bodies: BODY });
  const { root } = install(dir);
  try {
    const before = mtimes(root);
    const second = parse(run(['apply', '--yes', '--root', root], { env: withNpx(dir) }));
    assert.equal(second.summary.created, 0);
    assert.equal(second.summary.updated, 0);
    assert.equal(second.summary.drift, 0);
    assert.deepEqual(mtimes(root), before);

    // The shim is off PATH: an extra component that has disappeared.
    const third = parse(run(['apply', '--yes', '--root', root]));
    const skillCopy = third.actions.filter((a) => a.kind === 'skill-copy');
    assert.ok(skillCopy.every((a) => a.state === 'skipped'));
    assert.deepEqual(mtimes(root), before);
    assert.ok(exists(root, '.claude/skills/sw-specs-editor/SKILL.md'), 'the file already on disk must survive');
  } finally { cleanup(root); }
});

// ------------------------------------------------------------------- 5

test('a hand-edited extra-component copy drifts under apply, and is kept — not deleted — by uninstall', SKIP, () => {
  const { dir } = fakeNpx({ bodies: BODY });
  const { root } = install(dir);
  try {
    const target = join(root, '.claude', 'skills', 'sw-specs-editor', 'SKILL.md');
    writeFileSync(target, 'mine now\n');

    const driftBody = parse(run(['apply', '--yes', '--root', root], { env: withNpx(dir) }));
    const drifted = driftBody.actions.find((a) => a.target === '.claude/skills/sw-specs-editor/SKILL.md');
    assert.equal(drifted.state, 'drift');
    assert.equal(readFileSync(target, 'utf8'), 'mine now\n');

    // Uninstall with the shim off PATH: revert must need no probe.
    const uninstallBody = parse(run(['uninstall', '--yes', '--root', root]));
    assert.ok(uninstallBody.kept.some((k) => k.target === '.claude/skills/sw-specs-editor/SKILL.md'));
    assert.equal(readFileSync(target, 'utf8'), 'mine now\n');
    assert.equal(exists(root, '.agents/skills/sw-specs-editor/SKILL.md'), false, 'the untouched host copy is removed');
  } finally { cleanup(root); }
});

// ------------------------------------------------------------------- 6

test('a foreign file at an extra-component target is a conflict, untouched', SKIP, () => {
  const { dir } = fakeNpx({ bodies: BODY });
  const root = hostRepo({
    dirs: ALL_MARKERS,
    files: { '.claude/skills/sw-specs-editor/SKILL.md': 'someone else wrote this\n' },
  });
  try {
    const body = parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root], { env: withNpx(dir) }));
    const action = body.actions.find((a) => a.target === '.claude/skills/sw-specs-editor/SKILL.md');
    assert.equal(action.state, 'conflict');
    assert.equal(readText(root, '.claude/skills/sw-specs-editor/SKILL.md'), 'someone else wrote this\n');
    assert.equal(body.summary.failed, 0);
  } finally { cleanup(root); }
});

// ------------------------------------------------------------------- 7

test('a non-frontmatter body on exit 0 is probe-failed and nothing is written', SKIP, () => {
  const { dir } = fakeNpx({ bodies: { 'sw-specs-editor': 'not a skill document\n' } });
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const body = parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root], { env: withNpx(dir) }));
    const action = body.actions.find((a) => a.component === 'sw-specs-editor' && a.host === 'claude-code');
    assert.equal(action.state, 'skipped');
    assert.equal(action.probe.state, 'probe-failed');
    assert.equal(exists(root, '.claude/skills/sw-specs-editor/SKILL.md'), false);
  } finally { cleanup(root); }
});

test('a clean non-zero exit is absent, with an npm i -D remedy', SKIP, () => {
  const { dir } = fakeNpx({ bodies: {} });
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const body = parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root], { env: withNpx(dir) }));
    const action = body.actions.find((a) => a.component === 'sw-specs-editor' && a.host === 'claude-code');
    assert.equal(action.probe.state, 'absent');
    assert.match(action.remedy, /^npm i -D @execuro-sw-ecosystem\/sw-specs-editor@0\.1\.0$/);
  } finally { cleanup(root); }
});

test('an empty PATH is probe-failed and mentions npx, but the run still succeeds', SKIP, () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const body = parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root], { env: { PATH: '' } }));
    assert.equal(body.ok, true);
    const action = body.actions.find((a) => a.component === 'sw-specs-editor' && a.host === 'claude-code');
    assert.equal(action.probe.state, 'probe-failed');
    assert.match(action.probe.reason, /npx/);
  } finally { cleanup(root); }
});

// ------------------------------------------------------------------- 8

test('probing is read-only, always passes --no-install, never -y or --target, and spawns at most twice for four hosts', SKIP, () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  const probe1 = fakeNpx({ bodies: BODY });
  try {
    const before = snapshot(root);
    run(['status', '--root', root], { env: withNpx(probe1.dir) });
    run(['status', '--root', root], { env: withNpx(probe1.dir) });
    assert.deepEqual(snapshot(root), before);

    const probe2 = fakeNpx({ bodies: BODY });
    parse(run(['apply', '--yes', ...ALL_AGENT_FLAGS, '--root', root], { env: withNpx(probe2.dir) }));
    const argv = readArgvLog(probe2.logFile);
    assert.ok(argv.length <= 2, `expected at most 2 spawns across 4 hosts, got ${argv.length}`);
    for (const a of argv) {
      assert.ok(a.includes('--no-install'));
      assert.equal(a.includes('-y'), false);
      assert.equal(a.includes('--target'), false);
    }
  } finally { cleanup(root); }
});

// ------------------------------------------------------------------- 9

test('--no-extra-components emits no skill-copy actions and never spawns npx', SKIP, () => {
  const { dir, logFile } = fakeNpx({ bodies: BODY });
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const body = parse(run(['plan', '--root', root, '--no-extra-components'], { env: withNpx(dir) }));
    assert.equal(body.actions.filter((a) => a.kind === 'skill-copy').length, 0);
    assert.deepEqual(readArgvLog(logFile), []);
  } finally { cleanup(root); }
});

test('status --no-extra-components reports no extra components and never spawns npx', SKIP, () => {
  const { dir, logFile } = fakeNpx({ bodies: BODY });
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    const body = parse(run(['status', '--root', root, '--no-extra-components'], { env: withNpx(dir) }));
    assert.deepEqual(body.extra_components, []);
    assert.deepEqual(readArgvLog(logFile), []);
  } finally { cleanup(root); }
});
