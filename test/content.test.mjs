// Inventory integrity. This is the suite that catches "we said 11 skills and
// shipped 6", and the version agreement across the four manifests.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CONTENT_VERSION, PKG_ROOT, PKG_VERSION, SUPPORTED_CONTENT, agents, skills } from '../lib/content.mjs';

// Codex's effective skill-body cap. A hard gate rather than an aspiration:
// one skill body, sized for the smallest host.
const CODEX_SKILL_CAP = 8192;
const COPILOT_PROMPT_CAP = 30000;

test('every skill directory is in the inventory, and nothing else is', () => {
  const onDisk = readdirSync(join(PKG_ROOT, 'skills'))
    .filter((f) => statSync(join(PKG_ROOT, 'skills', f)).isDirectory()).sort();
  assert.deepEqual(skills().map((s) => s.name), onDisk);
  assert.ok(onDisk.length >= 10, `expected at least 10 skills, found ${onDisk.length}`);
});

test('every skill has a SKILL.md within the Codex budget', () => {
  for (const skill of skills()) {
    assert.ok(skill.files.includes('SKILL.md'), `${skill.name} has no SKILL.md`);
    const bytes = statSync(join(PKG_ROOT, skill.root, 'SKILL.md')).size;
    assert.ok(bytes <= CODEX_SKILL_CAP,
      `${skill.name}/SKILL.md is ${bytes} bytes, over the ${CODEX_SKILL_CAP}-byte Codex cap`);
  }
});

test('every agent has all three host adapters, and there are no orphans', () => {
  const list = agents();
  assert.equal(list.length, 7);
  for (const agent of list) {
    for (const key of ['claude', 'codex', 'copilot']) {
      assert.ok(statSync(join(PKG_ROOT, agent[key])).size > 0, `missing ${agent[key]}`);
    }
  }
  const names = new Set(list.map((a) => a.name));
  for (const [dir, ext] of [['codex/agents', '.toml'], ['copilot/agents', '.agent.md']]) {
    for (const file of readdirSync(join(PKG_ROOT, dir))) {
      const name = file.replace(ext, '');
      assert.ok(names.has(name), `orphan adapter with no source agent: ${dir}/${file}`);
    }
  }
});

test('no Copilot adapter exceeds the prompt cap', () => {
  for (const agent of agents()) {
    const bytes = statSync(join(PKG_ROOT, agent.copilot)).size;
    assert.ok(bytes < COPILOT_PROMPT_CAP, `${agent.copilot} is ${bytes} chars`);
  }
});

test('no skill or agent carries a Claude-only construct', () => {
  const banned = [/\$\{CLAUDE_SKILL_DIR\}/, /\$ARGUMENTS/, /SendMessage/, /subagent_type/, /\.claude\//];
  const offenders = [];
  const visit = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const child = join(dir, entry.name);
      if (entry.isDirectory()) { visit(child); continue; }
      if (!entry.name.endsWith('.md')) continue;
      const text = readFileSync(child, 'utf8');
      for (const pattern of banned) {
        if (pattern.test(text)) offenders.push(`${child}: ${pattern}`);
      }
    }
  };
  visit(join(PKG_ROOT, 'skills'));
  visit(join(PKG_ROOT, 'agents'));
  assert.deepEqual(offenders, []);
});

test('AskUserQuestion is never named as the only way to ask', () => {
  const offenders = [];
  const visit = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const child = join(dir, entry.name);
      if (entry.isDirectory()) { visit(child); continue; }
      if (!entry.name.endsWith('.md')) continue;
      readFileSync(child, 'utf8').split('\n').forEach((line, i) => {
        if (!line.includes('AskUserQuestion')) return;
        if (line.startsWith('allowed-tools:')) return;      // frontmatter is legitimate
        if (line.includes('request_user_input')) return;     // names both hosts
        offenders.push(`${child}:${i + 1}`);
      });
    }
  };
  visit(join(PKG_ROOT, 'skills'));
  visit(join(PKG_ROOT, 'agents'));
  assert.deepEqual(offenders, []);
});

test('the version agrees across every manifest', () => {
  const read = (p) => JSON.parse(readFileSync(join(PKG_ROOT, p), 'utf8'));
  assert.equal(read('plugin.json').version, PKG_VERSION);
  assert.equal(read('.claude-plugin/plugin.json').version, PKG_VERSION);
  assert.equal(read('.claude-plugin/marketplace.json').plugins[0].name, read('plugin.json').name);
});

test('mcp.json is the portable form, .mcp.json is Claude Code\'s', () => {
  const portable = JSON.parse(readFileSync(join(PKG_ROOT, 'mcp.json'), 'utf8'));
  const claude = JSON.parse(readFileSync(join(PKG_ROOT, '.mcp.json'), 'utf8'));
  assert.equal(portable.$schema, 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json');
  for (const server of Object.values(portable.mcpServers)) {
    assert.equal(server.type, 'stdio', 'the portable schema requires a type per server');
  }
  assert.equal(claude.$schema, undefined, 'Claude Code\'s .mcp.json takes no $schema');
  assert.deepEqual(Object.keys(portable.mcpServers), Object.keys(claude.mcpServers));
});

test('the root manifest carries no dead vendor extension', () => {
  const root = JSON.parse(readFileSync(join(PKG_ROOT, 'plugin.json'), 'utf8'));
  // No Codex manifest struct has an `agents` field, so declaring one is a no-op.
  assert.equal(root.extensions?.['com.openai.codex'], undefined);
});

test('the package declares no runtime dependencies and no install hooks', () => {
  const pkg = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies, undefined, 'no runtime dependencies');
  for (const hook of ['postinstall', 'prepare', 'prepack', 'preinstall', 'install']) {
    assert.equal(pkg.scripts?.[hook], undefined, `${hook} must not fire on a registry install`);
  }
  assert.equal(pkg.publishConfig.access, 'public');
  assert.equal(pkg.type, 'module');
});

test('the content version is one we support', () => {
  assert.ok(SUPPORTED_CONTENT.includes(CONTENT_VERSION));
});
