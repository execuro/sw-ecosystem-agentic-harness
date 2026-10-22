// Knowledge routing: the router block in each agent's entry file, the
// SubagentStart hook beside the user's own, and the content that goes in.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PKG_ROOT, cleanup, exists, hostRepo, parse, readJson, readLock, readText, run, snapshot,
} from './helpers.mjs';
import { parseSelection } from '../lib/prompt.mjs';

const BOTH = ['--agent', 'claude-code', '--agent', 'codex'];
const SCRIPT = 'sw-knowledge-routing.mjs';
const noLock = (snap) => Object.fromEntries(Object.entries(snap).filter(([k]) => !/harness\.lock\.json$/.test(k)));
const blocks = (text) => (text.match(/>>> managed by .* block=harness/g) ?? []).length;
const hooksOf = (root, file) => readJson(root, file).hooks.SubagentStart;
const commandsOf = (groups) => groups.flatMap((g) => g.hooks.map((h) => h.command));
const router = readFileSync(join(PKG_ROOT, 'project', 'entry', 'router.md'), 'utf8').trim();

// ------------------------------------------------------------------ apply

test('AGENTS.md + .claude/ + .codex/: one block in AGENTS.md, no CLAUDE.md, both hooks', () => {
  const root = hostRepo({ dirs: ['.claude', '.codex'], files: { 'AGENTS.md': '# mine\n' } });
  try {
    parse(run(['apply', '--yes', ...BOTH, '--root', root]));
    const text = readText(root, 'AGENTS.md');
    assert.ok(text.startsWith('# mine\n'));
    assert.equal(blocks(text), 1);
    assert.ok(text.includes(router));
    assert.equal(exists(root, 'CLAUDE.md'), false);
    assert.equal(exists(root, '.claude/CLAUDE.md'), false);

    assert.ok(exists(root, `.claude/hooks/${SCRIPT}`));
    assert.ok(exists(root, `.codex/hooks/${SCRIPT}`));
    const claude = hooksOf(root, '.claude/settings.json');
    assert.equal(claude.length, 1);
    assert.equal(claude[0].matcher, 'Explore|Plan');
    assert.equal(claude[0].hooks[0].command, `node "$CLAUDE_PROJECT_DIR/.claude/hooks/${SCRIPT}"`);
    const codex = hooksOf(root, '.codex/hooks.json');
    assert.equal(codex.length, 1);
    assert.equal(codex[0].matcher, undefined, 'Codex hook has no matcher: every agent type');
    assert.match(codex[0].hooks[0].command, new RegExp(`git rev-parse --show-toplevel.*\\.codex/hooks/${SCRIPT}`));
  } finally { cleanup(root); }
});

test('a user CLAUDE.md and a user SubagentStart hook: both hooks kept, one block per entry file', () => {
  const userHook = { matcher: 'Explore', hooks: [{ type: 'command', command: 'echo mine' }] };
  const root = hostRepo({
    dirs: ['.claude', '.codex'],
    files: {
      'CLAUDE.md': '# claude notes\n',
      '.claude/settings.json': JSON.stringify({ hooks: { SubagentStart: [userHook] } }, null, 2),
      '.codex/hooks.json': JSON.stringify({ hooks: { SubagentStart: [{ hooks: [{ type: 'command', command: 'echo codex mine' }] }] } }),
    },
  });
  try {
    parse(run(['apply', '--yes', ...BOTH, '--root', root]));
    assert.equal(blocks(readText(root, 'CLAUDE.md')), 1);
    assert.equal(blocks(readText(root, 'AGENTS.md')), 1);
    assert.ok(readText(root, 'CLAUDE.md').startsWith('# claude notes\n'));
    assert.deepEqual(hooksOf(root, '.claude/settings.json')[0], userHook);
    assert.equal(hooksOf(root, '.claude/settings.json').length, 2);
    const codexCommands = commandsOf(hooksOf(root, '.codex/hooks.json'));
    assert.equal(codexCommands[0], 'echo codex mine');
    assert.equal(codexCommands.length, 2);
  } finally { cleanup(root); }
});

test('an empty project with --agent codex gets AGENTS.md and the Codex hook only', () => {
  const root = hostRepo();
  try {
    parse(run(['apply', '--yes', '--agent', 'codex', '--root', root]));
    assert.equal(blocks(readText(root, 'AGENTS.md')), 1);
    assert.ok(exists(root, `.codex/hooks/${SCRIPT}`));
    assert.equal(commandsOf(hooksOf(root, '.codex/hooks.json')).length, 1);
    assert.equal(exists(root, 'CLAUDE.md'), false);
    assert.equal(exists(root, '.claude'), false);
  } finally { cleanup(root); }
});

test('apply is idempotent: the second run changes nothing', () => {
  const root = hostRepo({ dirs: ['.claude', '.codex'], files: { 'AGENTS.md': '# mine\n' } });
  try {
    run(['apply', '--yes', ...BOTH, '--root', root]);
    const before = noLock(snapshot(root));
    const second = parse(run(['apply', '--yes', ...BOTH, '--root', root]));
    assert.equal(second.summary.created + second.summary.updated, 0);
    assert.deepEqual(noLock(snapshot(root)), before);
    assert.equal(hooksOf(root, '.claude/settings.json').length, 1);
  } finally { cleanup(root); }
});

test('the old catalogue block is upgraded in place', () => {
  const old = [
    '# mine', '',
    '<!-- >>> managed by sw-ecosystem-agentic-harness block=harness v=0.1.0 -->',
    '## Shopware agentic harness', '', '| Skill | What it does |',
    '<!-- <<< end managed by sw-ecosystem-agentic-harness block=harness -->', '',
  ].join('\n');
  const root = hostRepo({ dirs: ['.codex'], files: { 'AGENTS.md': old } });
  try {
    parse(run(['apply', '--yes', '--agent', 'codex', '--root', root]));
    const text = readText(root, 'AGENTS.md');
    assert.equal(blocks(text), 1);
    assert.ok(text.includes('## Shopware project knowledge'));
    assert.ok(!text.includes('Shopware agentic harness'));
    assert.ok(text.startsWith('# mine\n'));
  } finally { cleanup(root); }
});

test('adding a CLAUDE.md later moves Claude Code\'s block to it and removes the old one', () => {
  const root = hostRepo({ dirs: ['.claude', '.codex'], files: { 'AGENTS.md': '# mine\n' } });
  try {
    run(['apply', '--yes', ...BOTH, '--root', root]);
    writeFileSync(join(root, 'CLAUDE.md'), '# new claude file\n');
    const plan = parse(run(['plan', '--root', root]));
    assert.ok(plan.entry_files.some((e) => e.target === 'CLAUDE.md' && e.change === 'append'));
    parse(run(['apply', '--yes', '--root', root]));
    assert.equal(blocks(readText(root, 'CLAUDE.md')), 1);
    assert.equal(blocks(readText(root, 'AGENTS.md')), 1, 'Codex still reads AGENTS.md');
    const status = parse(run(['status', '--root', root]));
    assert.equal(status.state, 'ok');
  } finally { cleanup(root); }
});

test('a block left in a file no agent reads any more is removed', () => {
  const root = hostRepo({ dirs: ['.claude'], files: { 'AGENTS.md': '# mine\n' } });
  try {
    run(['apply', '--yes', '--agent', 'claude-code', '--root', root]);
    assert.equal(blocks(readText(root, 'AGENTS.md')), 1);
    writeFileSync(join(root, 'CLAUDE.md'), '# new\n');
    const body = parse(run(['apply', '--yes', '--root', root]));
    assert.equal(blocks(readText(root, 'AGENTS.md')), 0);
    assert.equal(readText(root, 'AGENTS.md'), '# mine\n');
    assert.equal(blocks(readText(root, 'CLAUDE.md')), 1);
    assert.deepEqual(body.retired.map((r) => r.target), ['AGENTS.md']);
  } finally { cleanup(root); }
});

test('Cursor gets its own always-on rule when no AGENTS.md exists, and drops it once one does', () => {
  const root = hostRepo({ dirs: ['.cursor'] });
  try {
    run(['apply', '--yes', '--agent', 'cursor', '--root', root]);
    const rule = '.cursor/rules/sw-shopware-knowledge.mdc';
    assert.match(readText(root, rule), /^---\ndescription: .*\nalwaysApply: true\n---\n/);
    assert.ok(readText(root, rule).includes(router));
    assert.equal(exists(root, 'AGENTS.md'), false);

    writeFileSync(join(root, 'AGENTS.md'), '# now there is one\n');
    run(['apply', '--yes', '--root', root]);
    assert.equal(exists(root, rule), false);
    assert.equal(blocks(readText(root, 'AGENTS.md')), 1);
  } finally { cleanup(root); }
});

test('CLAUDE.local.md and AGENTS.override.md are never written; the override is warned about', () => {
  const root = hostRepo({
    dirs: ['.codex'],
    files: { 'CLAUDE.local.md': '# me\n', 'AGENTS.override.md': '# o\n' },
  });
  try {
    const plan = parse(run(['plan', '--agent', 'claude-code', '--agent', 'codex', '--root', root]));
    assert.match(plan.warnings.join('\n'), /AGENTS\.override\.md/);
    run(['apply', '--yes', ...BOTH, '--root', root]);
    assert.equal(readText(root, 'CLAUDE.local.md'), '# me\n');
    assert.equal(readText(root, 'AGENTS.override.md'), '# o\n');
    assert.equal(blocks(readText(root, 'CLAUDE.md')), 1);
  } finally { cleanup(root); }
});

// ---------------------------------------------------------------- plan JSON

test('plan --json exposes detected, entry_files, hooks and warnings', () => {
  const root = hostRepo({ dirs: ['.claude', '.codex'], files: { 'AGENTS.md': '# mine\n' } });
  try {
    const plan = parse(run(['plan', ...BOTH, '--root', root]));
    assert.deepEqual(plan.detected.map((d) => d.id), ['claude-code', 'codex']);
    assert.deepEqual(plan.detected[0].evidence, ['.claude']);
    assert.equal(plan.entry_files.length, 1);
    const [entry] = plan.entry_files;
    assert.equal(entry.target, 'AGENTS.md');
    assert.equal(entry.change, 'append');
    assert.deepEqual(entry.reaches, ['claude-code', 'codex']);
    assert.ok(entry.reason.length > 0);
    assert.equal(entry.body, router);
    assert.deepEqual(plan.hooks.map((h) => [h.file, h.event, h.matcher]), [
      ['.claude/settings.json', 'SubagentStart', 'Explore|Plan'],
      ['.codex/hooks.json', 'SubagentStart', null],
    ]);
    for (const hook of plan.hooks) {
      assert.match(hook.command, /^node /);
      assert.ok(hook.trust_note.length > 0);
    }
    assert.deepEqual(plan.warnings, []);
    const status = parse(run(['status', ...BOTH, '--root', root]));
    assert.deepEqual(Object.keys(status).filter((k) => ['detected', 'entry_files', 'hooks', 'warnings'].includes(k)).sort(),
      ['detected', 'entry_files', 'hooks', 'warnings']);
  } finally { cleanup(root); }
});

test('a stray .github/ or a bare AGENTS.md is not evidence for any agent', () => {
  const root = hostRepo({ dirs: ['.github', '.vscode'], files: { 'AGENTS.md': '# a\n' } });
  try {
    assert.deepEqual(parse(run(['plan', '--agent', 'codex', '--root', root])).detected, []);
  } finally { cleanup(root); }
});

test('detection evidence lists the files that matched', () => {
  const root = hostRepo({ files: { 'CLAUDE.md': '#\n', '.github/copilot-instructions.md': '#\n' } });
  try {
    const plan = parse(run(['plan', '--agent', 'codex', '--root', root]));
    assert.deepEqual(plan.detected, [
      { id: 'claude-code', evidence: ['CLAUDE.md'] },
      { id: 'copilot', evidence: ['.github/copilot-instructions.md'] },
    ]);
  } finally { cleanup(root); }
});

// -------------------------------------------------------------- uninstall

test('uninstall removes our blocks, hook entries and scripts, and keeps the user\'s', () => {
  const userHook = { matcher: 'Explore', hooks: [{ type: 'command', command: 'echo mine' }] };
  const root = hostRepo({
    dirs: ['.claude', '.codex'],
    files: {
      'CLAUDE.md': '# claude notes\n',
      'AGENTS.md': '# agents notes\n',
      '.claude/settings.json': JSON.stringify({ hooks: { SubagentStart: [userHook] } }, null, 2) + '\n',
    },
  });
  try {
    run(['apply', '--yes', ...BOTH, '--root', root]);
    const body = parse(run(['uninstall', '--yes', '--root', root]));
    assert.equal(body.summary.failed, 0);
    assert.deepEqual(body.kept, []);
    assert.equal(readText(root, 'CLAUDE.md'), '# claude notes\n');
    assert.equal(readText(root, 'AGENTS.md'), '# agents notes\n');
    assert.deepEqual(readJson(root, '.claude/settings.json'), { hooks: { SubagentStart: [userHook] } });
    assert.equal(exists(root, `.claude/hooks/${SCRIPT}`), false);
    assert.equal(exists(root, `.codex/hooks/${SCRIPT}`), false);
    assert.equal(exists(root, '.codex/hooks.json'), false, 'a hooks file we created is removed');
    assert.equal(readLock(root), null);
  } finally { cleanup(root); }
});

test('a hook entry the user edited is not ours any more and survives uninstall', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    run(['apply', '--yes', '--agent', 'claude-code', '--root', root]);
    const file = join(root, '.claude', 'settings.json');
    const doc = JSON.parse(readFileSync(file, 'utf8'));
    doc.hooks.SubagentStart[0].matcher = 'Explore';
    writeFileSync(file, JSON.stringify(doc, null, 2));
    run(['uninstall', '--yes', '--root', root]);
    assert.equal(hooksOf(root, '.claude/settings.json')[0].matcher, 'Explore');
  } finally { cleanup(root); }
});

// -------------------------------------------------------------- the script

function installed(agent, dir) {
  const root = hostRepo({ dirs: [dir] });
  run(['apply', '--yes', '--agent', agent, '--root', root]);
  return { root, script: join(root, dir, 'hooks', SCRIPT) };
}

function runHook(script, input) {
  return execFileSync(process.execPath, [script], { input, encoding: 'utf8' });
}

test('the hook prints the SubagentStart additionalContext shape with the router', () => {
  const { root, script } = installed('claude-code', '.claude');
  try {
    const out = JSON.parse(runHook(script, JSON.stringify({ hook_event_name: 'SubagentStart', agent_type: 'Explore' })));
    assert.deepEqual(Object.keys(out), ['hookSpecificOutput']);
    assert.equal(out.hookSpecificOutput.hookEventName, 'SubagentStart');
    assert.equal(out.hookSpecificOutput.additionalContext, router);
  } finally { cleanup(root); }
});

test('the hook exits 0 and still prints the router on bad or empty stdin', () => {
  const { root, script } = installed('codex', '.codex');
  try {
    for (const input of ['', 'not json', '{"truncated":']) {
      assert.equal(JSON.parse(runHook(script, input)).hookSpecificOutput.additionalContext, router);
    }
  } finally { cleanup(root); }
});

test('the hook script is generated and marked so', () => {
  const text = readFileSync(join(PKG_ROOT, 'project', 'hooks', SCRIPT), 'utf8');
  assert.match(text, /^#!.*\n\/\/ GENERATED by scripts\/gen-routing\.mjs/);
});

// ---------------------------------------------------------------- content

test('the router is short and plain: <= 30 lines, no long prose, no sw-* names', () => {
  const lines = router.split('\n');
  assert.ok(lines.length <= 30, `router is ${lines.length} lines`);
  const long = lines.filter((l) => !l.startsWith('|') && l.length > 160);
  assert.deepEqual(long, []);
  assert.doesNotMatch(router, /\bsw-[a-z]/, 'the router names no skill or agent');
});

test('the Cursor rule carries the same router', () => {
  const mdc = readFileSync(join(PKG_ROOT, 'project', 'entry', 'cursor', 'sw-shopware-knowledge.mdc'), 'utf8');
  assert.ok(mdc.includes(router));
  assert.match(mdc, /^---\n[\s\S]*alwaysApply: true[\s\S]*\n---\n/);
});

// ----------------------------------------------------------------- picker

test('picker: Enter takes the detected agents, "all" still takes every agent', () => {
  const agents = ['claude-code', 'codex', 'copilot', 'cursor'];
  assert.deepEqual(parseSelection('', agents, ['codex', 'claude-code']), ['claude-code', 'codex']);
  assert.deepEqual(parseSelection('  ', agents, ['codex']), ['codex']);
  assert.deepEqual(parseSelection('all', agents, ['codex']), agents);
  assert.deepEqual(parseSelection('3', agents, ['codex']), ['copilot']);
  assert.deepEqual(parseSelection('', agents, []), agents, 'nothing detected: Enter means all');
});

// ------------------------------------------------- the registered Codex command

function codexCommand(root) {
  return hooksOf(root, '.codex/hooks.json')[0].hooks[0].command;
}

function runRegistered(command, cwd) {
  const input = JSON.stringify({ hook_event_name: 'SubagentStart', agent_type: 'explorer' });
  return JSON.parse(execFileSync('sh', ['-c', command], { cwd, input, encoding: 'utf8' }));
}

test('the registered Codex command runs from the project root of a non-git project', { skip: process.platform === 'win32' }, () => {
  const root = hostRepo({ dirs: ['.codex'] });
  try {
    run(['apply', '--yes', '--agent', 'codex', '--root', root]);
    const out = runRegistered(codexCommand(root), root);
    assert.equal(out.hookSpecificOutput.hookEventName, 'SubagentStart');
    assert.equal(out.hookSpecificOutput.additionalContext, router);
  } finally { cleanup(root); }
});

test('the registered Codex command resolves the repo root from a git subdirectory', { skip: process.platform === 'win32' }, () => {
  const root = hostRepo({ dirs: ['.codex', 'src/deep'] });
  try {
    execFileSync('git', ['init', '-q'], { cwd: root });
    run(['apply', '--yes', '--agent', 'codex', '--root', root]);
    const out = runRegistered(codexCommand(root), join(root, 'src', 'deep'));
    assert.equal(out.hookSpecificOutput.additionalContext, router);
  } finally { cleanup(root); }
});
