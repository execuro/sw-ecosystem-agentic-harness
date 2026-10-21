// Anchored target agents: `agents` writes `sw-ecosystem-agentic-harness.json`
// next to the lock, and every later command reads it instead of guessing from
// marker directories. Detection only ever yields `candidates`.

import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { test } from 'node:test';
import {
  cleanup, exists, hostRepo, parse, readJson, run, shopwareRepo, snapshot,
} from './helpers.mjs';

const VAR_FILE = 'var/sw-ai-sdk/sw-ecosystem-agentic-harness.json';
const DOT_FILE = '.sw-ai-sdk/sw-ecosystem-agentic-harness.json';

test('agents --agent anchors in var/sw-ai-sdk and writes nothing else', () => {
  const root = shopwareRepo({ dirs: ['.claude'] });
  try {
    const body = parse(run(['agents', '--agent', 'claude-code', '--root', root]));
    assert.equal(body.ok, true);
    assert.deepEqual(body.targets, { agents: ['claude-code'], source: 'settings', settings_file: VAR_FILE });
    assert.deepEqual(body.candidates, ['claude-code']);
    const file = readJson(root, VAR_FILE);
    assert.deepEqual(file.agents, ['claude-code']);
    assert.equal(file.schema, 1);
    assert.equal(file.source, 'detected');
    assert.deepEqual(Object.keys(snapshot(root)), [VAR_FILE]);
  } finally { cleanup(root); }
});

test('agents --agent falls back to .sw-ai-sdk when the root has no var/', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    const body = parse(run(['agents', '--agent', 'codex', '--root', root]));
    assert.equal(body.targets.settings_file, DOT_FILE);
    assert.equal(readJson(root, DOT_FILE).source, 'chosen');
  } finally { cleanup(root); }
});

test('agents --json reads the anchor back with the candidates', () => {
  const root = shopwareRepo({ dirs: ['.claude', '.vscode'] });
  try {
    const before = parse(run(['agents', '--root', root]));
    assert.equal(before.targets.source, 'none');
    assert.deepEqual(before.targets.agents, []);
    assert.deepEqual(before.candidates, ['claude-code', 'copilot']);
    assert.equal(exists(root, VAR_FILE), false, 'reading must not write');

    run(['agents', '--agent', 'claude-code', '--root', root]);
    const after = parse(run(['agents', '--root', root]));
    assert.deepEqual(after.targets.agents, ['claude-code']);
    assert.deepEqual(after.candidates, ['claude-code', 'copilot']);
  } finally { cleanup(root); }
});

test('agents with an unknown id exits 2 and writes nothing', () => {
  const root = shopwareRepo({ dirs: ['.claude'] });
  try {
    const before = snapshot(root);
    const r = run(['agents', '--agent', 'vim', '--root', root]);
    assert.equal(r.code, 2);
    assert.deepEqual(snapshot(root), before);
  } finally { cleanup(root); }
});

test('apply --yes with anchored targets and no TTY installs only those agents', () => {
  const root = shopwareRepo({ dirs: ['.claude', '.vscode'] });
  try {
    run(['agents', '--agent', 'claude-code', '--root', root]);
    const r = run(['apply', '--yes', '--root', root]);
    assert.equal(r.code, 0);
    assert.deepEqual(parse(r).agents.map((a) => a.id), ['claude-code']);
    assert.ok(exists(root, '.claude/skills/sw-setup/SKILL.md'));
    assert.equal(exists(root, '.github'), false);
    assert.equal(exists(root, '.vscode/mcp.json'), false);
  } finally { cleanup(root); }
});

test('--agent overrides the anchored targets and leaves them as they were', () => {
  const root = shopwareRepo({ dirs: ['.claude', '.codex'] });
  try {
    run(['agents', '--agent', 'claude-code', '--root', root]);
    const body = parse(run(['apply', '--yes', '--agent', 'codex', '--root', root]));
    assert.deepEqual(body.agents.map((a) => a.id), ['codex']);
    assert.deepEqual(readJson(root, VAR_FILE).agents, ['claude-code']);
  } finally { cleanup(root); }
});

test('the first install with --agent anchors that choice', () => {
  const root = shopwareRepo({ dirs: ['.claude'] });
  try {
    run(['install', '--agent', 'claude-code', '--root', root]);
    const file = readJson(root, VAR_FILE);
    assert.deepEqual(file.agents, ['claude-code']);
    assert.equal(file.source, 'chosen');
  } finally { cleanup(root); }
});

test('the TTY picker anchors its choice', async () => {
  const root = shopwareRepo({ dirs: ['.claude'] });
  const realStdin = Object.getOwnPropertyDescriptor(process, 'stdin');
  const realOut = process.stdout.write;
  const realErr = process.stderr.write;
  try {
    const input = new PassThrough();
    input.isTTY = true;
    input.write('2\n');
    Object.defineProperty(process, 'stdin', { value: input, configurable: true });
    process.stdout.write = () => true;
    process.stderr.write = () => true;
    const { install } = await import('../lib/commands.mjs');
    await install(['--root', root, '--json']);
  } finally {
    process.stdout.write = realOut;
    process.stderr.write = realErr;
    Object.defineProperty(process, 'stdin', realStdin);
    process.exitCode = 0;
  }
  try {
    const file = readJson(root, VAR_FILE);
    assert.deepEqual(file.agents, ['codex']);
    assert.equal(file.source, 'chosen');
  } finally { cleanup(root); }
});

test('uninstall --agent prunes the targets, and the last one removes the file', () => {
  const root = shopwareRepo({ dirs: ['.claude', '.codex'] });
  try {
    run(['agents', '--agent', 'claude-code', '--agent', 'codex', '--root', root]);
    run(['apply', '--yes', '--root', root]);
    run(['uninstall', '--yes', '--agent', 'codex', '--root', root]);
    assert.deepEqual(readJson(root, VAR_FILE).agents, ['claude-code']);
    run(['uninstall', '--yes', '--agent', 'claude-code', '--root', root]);
    assert.equal(exists(root, VAR_FILE), false);
  } finally { cleanup(root); }
});

test('status: a stray detected agent is not-targeted and does not count', () => {
  const root = shopwareRepo({ dirs: ['.claude', '.vscode'] });
  try {
    run(['agents', '--agent', 'claude-code', '--root', root]);
    run(['apply', '--yes', '--root', root]);
    const body = parse(run(['status', '--root', root]));
    const byId = Object.fromEntries(body.agents.map((a) => [a.id, a]));
    assert.equal(byId.copilot.state, 'not-targeted');
    assert.equal(byId.copilot.targeted, false);
    assert.equal(byId['claude-code'].targeted, true);
    assert.equal(byId['claude-code'].state, 'ok');
    assert.equal(body.state, 'ok');
    assert.deepEqual(body.drift, []);
    assert.deepEqual(body.targets, { agents: ['claude-code'], source: 'settings', settings_file: VAR_FILE });
    assert.equal(body.lock_file, 'var/sw-ai-sdk/harness.lock.json');
    assert.ok(body.candidates.includes('copilot'));
  } finally { cleanup(root); }
});

test('status with nothing anchored says so and names the verb', () => {
  const root = shopwareRepo({ dirs: ['.claude', '.vscode'] });
  try {
    const body = parse(run(['status', '--root', root]));
    assert.equal(body.targets.source, 'none');
    assert.equal(body.targets.settings_file, VAR_FILE);
    assert.match(body.next_step, /agents --agent/);
    assert.ok(body.agents.every((a) => a.targeted === true));
  } finally { cleanup(root); }
});
