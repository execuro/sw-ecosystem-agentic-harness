// Windows behaviour, driven on any platform by injecting the platform rather
// than reading process.platform — which is the only reason it ever gets tested.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mcpServers, wrapCommand } from '../lib/content.mjs';
import { buildPlan } from '../lib/hosts.mjs';
import { rel, abs } from '../lib/fsx.mjs';
import { EXTRA_COMPONENTS, probeArgs } from '../lib/extra-components.mjs';
import { ALL_MARKERS, cleanup, hostRepo, readLock, run } from './helpers.mjs';

test('npx is wrapped in cmd /c on win32 and left bare elsewhere', () => {
  const spec = { command: 'npx', args: ['-y', 'pkg'] };
  assert.deepEqual(wrapCommand(spec, 'win32'), { command: 'cmd', args: ['/c', 'npx', '-y', 'pkg'] });
  for (const platform of ['linux', 'darwin']) {
    assert.deepEqual(wrapCommand(spec, platform), { command: 'npx', args: ['-y', 'pkg'] });
  }
});

test('no win32 plan anywhere emits a bare "command": "npx"', () => {
  const ctx = {
    root: '/repo', scope: 'project', platform: 'win32',
    hosts: ['claude-code', 'codex', 'copilot', 'cursor'], lock: null, version: '0.1.0',
  };
  const offenders = [];
  const scan = (value, where) => {
    if (value === null || typeof value !== 'object') return;
    if (value.command === 'npx') offenders.push(where);
    for (const [k, v] of Object.entries(value)) scan(v, `${where}.${k}`);
  };
  for (const action of buildPlan(ctx)) {
    scan(action.value, action.id);
    if (typeof action.body === 'string' && /^command = "npx"/m.test(action.body)) {
      offenders.push(action.id);
    }
  }
  assert.deepEqual(offenders, [], 'a bare npx fails with spawn ENOENT on Windows');
});

test('the Codex TOML block uses cmd /c on win32', () => {
  const ctx = {
    root: '/repo', scope: 'project', platform: 'win32', hosts: ['codex'], lock: null, version: '0.1.0',
  };
  const block = buildPlan(ctx).find((a) => a.block === 'mcp_servers');
  assert.match(block.body, /command = "cmd"/);
  assert.match(block.body, /"\/c", "npx"/);
});

test('mcpServers resolves the project-wiki path rather than emitting a variable', () => {
  const [, kb] = mcpServers({ platform: 'linux', root: '/repo' });
  assert.equal(kb.args.includes('--project-wiki'), true);
  assert.equal(kb.args.some((a) => /\$\{|\$[A-Z]/.test(a)), false, 'Codex performs no variable expansion');
});

test('paths in output and the lock are POSIX on every platform', () => {
  const root = hostRepo({ dirs: ALL_MARKERS });
  try {
    run(['apply', '--yes', '--root', root]);
    for (const key of Object.keys(readLock(root).files)) {
      assert.doesNotMatch(key, /\\/, `lock key is not POSIX: ${key}`);
    }
  } finally { cleanup(root); }
});

test('an extra-component probe is wrapped in cmd /c npx --no-install on win32', () => {
  for (const component of EXTRA_COMPONENTS) {
    const spec = `${component.pkg}@${component.version}`;
    assert.deepEqual(probeArgs(component, 'win32'),
      ['cmd', '/c', 'npx', '--no-install', spec, 'install-skill', '--print']);
    assert.deepEqual(probeArgs(component, 'linux'),
      ['npx', '--no-install', spec, 'install-skill', '--print']);
  }
});

test('rel and abs round trip through a POSIX key', () => {
  const root = process.platform === 'win32' ? 'C:\\repo' : '/repo';
  const key = '.claude/skills/sw-setup/SKILL.md';
  assert.equal(rel(root, abs(root, key)), key);
});
