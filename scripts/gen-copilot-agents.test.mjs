// The Copilot adapter generator, mirroring gen-codex-agents.test.mjs.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { parseFrontmatter, splitFrontmatter, toolList } from './frontmatter.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'agents');
const OUT = join(ROOT, 'copilot', 'agents');

const sources = readdirSync(SRC).filter((f) => f.endsWith('.md')).sort();

test('the committed adapters match the generator', () => {
  assert.doesNotThrow(() => execFileSync(
    process.execPath, [join(ROOT, 'scripts', 'gen-copilot-agents.mjs'), '--check'],
    { cwd: ROOT, stdio: 'pipe' },
  ));
});

test('one adapter per agent, no orphans', () => {
  const produced = readdirSync(OUT).filter((f) => f.endsWith('.agent.md')).sort();
  assert.deepEqual(produced, sources.map((f) => f.replace(/\.md$/, '.agent.md')));
});

test('the body is carried verbatim and the source hash matches', () => {
  for (const file of sources) {
    const raw = readFileSync(join(SRC, file), 'utf8');
    const { body } = splitFrontmatter(raw, file);
    const name = file.replace(/\.md$/, '');
    const adapter = readFileSync(join(OUT, `${name}.agent.md`), 'utf8');
    assert.ok(adapter.includes(body.replace(/^\n+/, '')), `${name}: body not verbatim`);
    const hash = createHash('sha256').update(raw).digest('hex');
    assert.ok(adapter.includes(`source-sha256: ${hash}`), `${name}: stale source hash`);
  }
});

test('every adapter has the description Copilot requires', () => {
  for (const file of sources) {
    const name = file.replace(/\.md$/, '');
    const adapter = readFileSync(join(OUT, `${name}.agent.md`), 'utf8');
    const { frontmatter } = splitFrontmatter(adapter, name);
    const fm = parseFrontmatter(frontmatter, name);
    assert.ok(fm.description && fm.description.length > 2, `${name}: no description`);
    assert.equal(fm.name, `"${name}"`);
  }
});

test('Claude tool names are mapped, and MCP tools are dropped', () => {
  const ALIASES = new Set(['execute', 'read', 'edit', 'search', 'agent', 'web', 'todo']);
  for (const file of sources) {
    const name = file.replace(/\.md$/, '');
    const { frontmatter } = splitFrontmatter(readFileSync(join(SRC, file), 'utf8'), file);
    const source = parseFrontmatter(frontmatter, file);
    const adapter = readFileSync(join(OUT, `${name}.agent.md`), 'utf8');
    const m = /^tools: \[(.*)\]$/m.exec(adapter);

    if (toolList(source.tools) === null) {
      assert.equal(m, null, `${name}: an agent with no tool list must not gain one`);
      continue;
    }
    const mapped = m[1].split(',').map((t) => t.trim()).filter(Boolean);
    for (const tool of mapped) assert.ok(ALIASES.has(tool), `${name}: unmapped tool ${tool}`);
    assert.equal(new Set(mapped).size, mapped.length, `${name}: duplicate aliases`);
    assert.doesNotMatch(m[1], /mcp__/, `${name}: MCP tools have no Copilot equivalent`);
  }
});

test('no adapter leaks a Claude-only frontmatter key', () => {
  for (const file of sources) {
    const name = file.replace(/\.md$/, '');
    const { frontmatter } = splitFrontmatter(readFileSync(join(OUT, `${name}.agent.md`), 'utf8'), name);
    const fm = parseFrontmatter(frontmatter, name);
    for (const key of ['color', 'memory']) {
      assert.equal(fm[key], undefined, `${name}: ${key} has no Copilot meaning`);
    }
    assert.notEqual(fm.model, '"inherit"', `${name}: inherit is the absence of a pin`);
  }
});
