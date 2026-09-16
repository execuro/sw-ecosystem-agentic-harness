// node --test scripts/gen-codex-agents.test.mjs
//
// Checks the two properties the generator exists for: the TOMLs on disk match
// their agent source, and `developer_instructions` really is the body verbatim
// Parsing is deliberately naive — these are generated files with
// a fixed shape, not arbitrary TOML.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const agents = readdirSync(join(ROOT, 'agents')).filter((f) => f.endsWith('.md')).sort();

test('the committed TOMLs are what the generator produces', () => {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'gen-codex-agents.mjs'), '--check'], {
    cwd: ROOT,
    stdio: 'pipe',
  });
});

test('there is one TOML per agent and no orphans', () => {
  const tomls = readdirSync(join(ROOT, 'codex', 'agents')).filter((f) => f.endsWith('.toml')).sort();
  assert.deepEqual(tomls, agents.map((f) => f.replace(/\.md$/, '.toml')));
});

for (const file of agents) {
  const name = file.replace(/\.md$/, '');

  test(`${name}: developer_instructions is the body verbatim`, () => {
    const raw = readFileSync(join(ROOT, 'agents', file), 'utf8');
    const toml = readFileSync(join(ROOT, 'codex', 'agents', `${name}.toml`), 'utf8');

    const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
    const emitted = /developer_instructions = '''\n([\s\S]*)\n'''/.exec(toml);
    assert.ok(emitted, 'no developer_instructions literal block');
    assert.equal(emitted[1], body.replace(/\s+$/, ''));
  });

  test(`${name}: the source hash header matches the agent file`, () => {
    const raw = readFileSync(join(ROOT, 'agents', file), 'utf8');
    const toml = readFileSync(join(ROOT, 'codex', 'agents', `${name}.toml`), 'utf8');
    const header = /^# source-sha256: ([0-9a-f]{64})$/m.exec(toml);
    assert.ok(header, 'no source-sha256 header');
    assert.equal(header[1], createHash('sha256').update(raw).digest('hex'));
  });

  test(`${name}: no Claude-only keys leaked into the TOML`, () => {
    const toml = readFileSync(join(ROOT, 'codex', 'agents', `${name}.toml`), 'utf8');
    const head = toml.slice(0, toml.indexOf('developer_instructions'));
    for (const key of ['tools', 'color', 'memory']) {
      assert.ok(!new RegExp(`^${key} =`, 'm').test(head), `${key} must not be emitted`);
    }
    // Every current sw-* agent is `model: inherit` or unset, i.e. no pin to carry.
    assert.ok(!/^model =/m.test(head), 'no agent pins a model today');
  });
}
