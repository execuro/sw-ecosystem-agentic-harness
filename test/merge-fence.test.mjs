// The fence scanner, shared by TOML and Markdown. The round-trip property —
// removeFence restores the file byte-for-byte — is what bounds the blast
// radius to lines we ourselves emitted.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fenceInner, findFence, removeFence, renderTomlTable, tomlTableExists, tomlValue, upsertFence } from '../lib/merge.mjs';

const META = { version: '0.1.0' };

test('creates a fence in an empty file', () => {
  const { next, created } = upsertFence('', 'mcp_servers', 'x = 1', META, 'toml');
  assert.equal(created, true);
  assert.match(next, /managed by sw-ecosystem-agentic-harness block=mcp_servers/);
  assert.match(next, /^x = 1$/m);
});

test('appends to an existing file without touching its content', () => {
  const before = '# user config\nkey = "value"\n';
  const { next } = upsertFence(before, 'mcp_servers', 'x = 1', META, 'toml');
  assert.ok(next.startsWith(before), 'the user content must be a byte-for-byte prefix');
});

test('replaces a fence body and leaves everything outside alone', () => {
  const base = upsertFence('before = 1\n', 'b', 'old = 1', META, 'toml').next;
  const withTail = `${base}after = 2\n`;
  const { next } = upsertFence(withTail, 'b', 'new = 2', META, 'toml');
  assert.match(next, /^new = 2$/m);
  assert.doesNotMatch(next, /old = 1/);
  assert.match(next, /^before = 1$/m);
  assert.match(next, /^after = 2$/m);
});

test('removeFence restores the file byte for byte', () => {
  for (const before of ['', 'a = 1\n', '# c\n\nb = 2\n', 'a = 1\r\nb = 2\r\n']) {
    const { next } = upsertFence(before, 'blk', 'x = 1', META, 'toml');
    const restored = removeFence(next, 'blk').next;
    assert.equal(restored, before, `round trip failed for ${JSON.stringify(before)}`);
  }
});

test('a file with no final newline gains one, and keeps it — documented', () => {
  const before = 'no-trailing-newline = 1';
  const { next } = upsertFence(before, 'blk', 'x = 1', META, 'toml');
  assert.equal(removeFence(next, 'blk').next, `${before}\n`);
});

test('findFence reports the inner body, warning line included', () => {
  const { next } = upsertFence('', 'blk', 'x = 1', META, 'toml');
  const fence = findFence(next, 'blk');
  assert.equal(fence.inner, fenceInner('x = 1', 'toml'));
});

test('the close marker is never mistaken for an open marker', () => {
  const { next } = upsertFence('', 'blk', 'x = 1', META, 'toml');
  assert.equal(findFence(next, 'blk').inner.includes('end managed by'), false);
});

test('two blocks in one file do not interfere', () => {
  let text = upsertFence('', 'one', 'a = 1', META, 'toml').next;
  text = upsertFence(text, 'two', 'b = 2', META, 'toml').next;
  assert.equal(findFence(text, 'one').inner.includes('a = 1'), true);
  assert.equal(findFence(text, 'two').inner.includes('b = 2'), true);
  const onlyTwo = removeFence(text, 'one').next;
  assert.equal(findFence(onlyTwo, 'one'), null);
  assert.equal(findFence(onlyTwo, 'two').inner.includes('b = 2'), true);
});

test('markdown fences use HTML comments and carry no warning line', () => {
  const { next } = upsertFence('# notes\n', 'harness', 'body text', META, 'markdown');
  assert.match(next, /<!-- >>> managed by/);
  assert.equal(findFence(next, 'harness').inner, 'body text');
  assert.ok(next.startsWith('# notes\n'));
});

test('a fence marker inside the user prose is not matched', () => {
  const prose = 'Example:\n\n```\n<!-- >>> managed by sw-ecosystem-agentic-harness block=harness -->\n```\n';
  const fence = findFence(prose, 'harness');
  // It looks like an open marker with no close, so nothing is reported.
  assert.equal(fence, null);
});

test('tomlTableExists sees a user table but not our own', () => {
  const ours = upsertFence('', 'mcp_servers', '[mcp_servers.p]\ncommand = "npx"', META, 'toml').next;
  assert.equal(tomlTableExists(ours, '[mcp_servers.p]', ['mcp_servers']), false);
  const theirs = `[mcp_servers.p]\ncommand = "own"\n${ours}`;
  assert.equal(tomlTableExists(theirs, '[mcp_servers.p]', ['mcp_servers']), true);
});

test('tomlTableExists ignores indented lines and trailing comments', () => {
  assert.equal(tomlTableExists('  [agents]\n', '[agents]', []), false);
  assert.equal(tomlTableExists('[agents] # mine\n', '[agents]', []), true);
});

test('tomlValue quotes strings and renders arrays', () => {
  assert.equal(tomlValue('a"b\\c'), '"a\\"b\\\\c"');
  assert.equal(tomlValue(['x', 'y']), '["x", "y"]');
  assert.equal(tomlValue(4), '4');
  assert.equal(tomlValue(true), 'true');
});

test('renderTomlTable skips undefined and inlines objects', () => {
  const t = renderTomlTable('[s.x]', { command: 'npx', type: undefined, env: { A: '1' } });
  assert.equal(t, '[s.x]\ncommand = "npx"\nenv = { A = "1" }');
});
