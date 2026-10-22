// The entry-file resolver: which file each agent reads, so where the router
// block goes. Table-driven over every row of the resolution table.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanup, hostRepo } from './helpers.mjs';
import { CURSOR_RULE, resolveEntryFiles, staleEntries } from '../lib/entry-files.mjs';

const ROWS = [
  // claude-code
  { name: 'claude: a CLAUDE.md that imports @AGENTS.md', agents: ['claude-code'],
    files: { 'CLAUDE.md': '# x\n@AGENTS.md\n', 'AGENTS.md': '# a\n' }, targets: ['AGENTS.md'] },
  { name: 'claude: the import may sit in .claude/CLAUDE.md', agents: ['claude-code'],
    files: { '.claude/CLAUDE.md': '@./AGENTS.md\n' }, targets: ['AGENTS.md'] },
  { name: 'claude: root CLAUDE.md', agents: ['claude-code'],
    files: { 'CLAUDE.md': '# x\n', 'AGENTS.md': '# a\n' }, targets: ['CLAUDE.md'] },
  { name: 'claude: .claude/CLAUDE.md', agents: ['claude-code'],
    files: { '.claude/CLAUDE.md': '# x\n' }, targets: ['.claude/CLAUDE.md'] },
  { name: 'claude: only CLAUDE.local.md creates a root CLAUDE.md', agents: ['claude-code'],
    files: { 'CLAUDE.local.md': '# me\n' }, targets: ['CLAUDE.md'] },
  { name: 'claude: AGENTS.md-only project never gets a CLAUDE file', agents: ['claude-code'],
    files: { 'AGENTS.md': '# a\n' }, targets: ['AGENTS.md'] },
  { name: 'claude: nothing at all falls back to AGENTS.md', agents: ['claude-code'],
    files: {}, targets: ['AGENTS.md'] },
  // codex
  { name: 'codex: AGENTS.md', agents: ['codex'], files: {}, targets: ['AGENTS.md'] },
  { name: 'codex: AGENTS.override.md warns and is never targeted', agents: ['codex'],
    files: { 'AGENTS.override.md': '# o\n' }, targets: ['AGENTS.md'], warns: /AGENTS\.override\.md/ },
  // copilot
  { name: 'copilot: .github/copilot-instructions.md', agents: ['copilot'],
    files: { '.github/copilot-instructions.md': '# c\n' }, targets: ['.github/copilot-instructions.md'] },
  { name: 'copilot: otherwise AGENTS.md', agents: ['copilot'], files: {}, targets: ['AGENTS.md'] },
  // cursor
  { name: 'cursor: root AGENTS.md', agents: ['cursor'],
    files: { 'AGENTS.md': '# a\n' }, targets: ['AGENTS.md'] },
  { name: 'cursor: otherwise its own always-on rule', agents: ['cursor'],
    files: {}, targets: [CURSOR_RULE] },
  { name: 'cursor: reuses the AGENTS.md another agent in the run will write', agents: ['codex', 'cursor'],
    files: {}, targets: ['AGENTS.md'] },
  // several agents
  { name: 'claude + codex share AGENTS.md', agents: ['claude-code', 'codex'],
    files: {}, targets: ['AGENTS.md'] },
  { name: 'claude gets CLAUDE.md while codex keeps AGENTS.md', agents: ['claude-code', 'codex'],
    files: { 'CLAUDE.md': '# x\n' }, targets: ['CLAUDE.md', 'AGENTS.md'] },
];

for (const row of ROWS) {
  test(`resolver — ${row.name}`, () => {
    const root = hostRepo({ files: row.files });
    try {
      const { files, warnings } = resolveEntryFiles(root, row.agents);
      assert.deepEqual(files.map((f) => f.target), row.targets);
      for (const agent of row.agents) {
        assert.ok(files.some((f) => f.reaches.includes(agent)), `${agent} is reached by some file`);
      }
      if (row.warns) assert.match(warnings.join('\n'), row.warns);
      else assert.deepEqual(warnings, []);
      for (const forbidden of ['CLAUDE.local.md', 'AGENTS.override.md']) {
        assert.ok(!files.some((f) => f.target === forbidden), `${forbidden} is never a target`);
      }
    } finally { cleanup(root); }
  });
}

test('resolver — an AGENTS.md-only project never gets a CLAUDE file, whichever agents run', () => {
  const root = hostRepo({ files: { 'AGENTS.md': '# a\n' } });
  try {
    const { files } = resolveEntryFiles(root, ['claude-code', 'codex', 'copilot', 'cursor']);
    assert.deepEqual(files.map((f) => f.target), ['AGENTS.md']);
    assert.deepEqual(files[0].reaches, ['claude-code', 'codex', 'copilot', 'cursor']);
    assert.equal(files[0].create, false);
  } finally { cleanup(root); }
});

test('resolver — create is true only for a file that does not exist yet', () => {
  const root = hostRepo({ files: { 'CLAUDE.md': '# x\n' } });
  try {
    const { files } = resolveEntryFiles(root, ['claude-code', 'codex']);
    assert.deepEqual(files.map((f) => [f.target, f.create]), [['CLAUDE.md', false], ['AGENTS.md', true]]);
  } finally { cleanup(root); }
});

test('staleEntries — a block in a file no agent reads any more, and a superseded Cursor rule', () => {
  const lock = {
    files: { [CURSOR_RULE]: { host: 'cursor' }, '.claude/skills/x/SKILL.md': { host: 'claude-code' } },
    json_pointers: [], rules: [],
    fences: [
      { file: 'AGENTS.md', block: 'harness', syntax: 'markdown', hash: 'h' },
      { file: '.codex/config.toml', block: 'agents', syntax: 'toml', hash: 'h' },
    ],
  };
  const wanted = [{ target: 'CLAUDE.md' }];
  assert.deepEqual(staleEntries(lock, wanted).map((e) => e.target).sort(), ['AGENTS.md', CURSOR_RULE].sort());
  assert.deepEqual(staleEntries(lock, [{ target: 'AGENTS.md' }, { target: CURSOR_RULE }]), []);
  assert.deepEqual(staleEntries(null, wanted), []);
});
