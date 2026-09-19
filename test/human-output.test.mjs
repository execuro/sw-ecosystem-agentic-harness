// The reported bug: `install` printed several hundred lines of JSON, so a
// person could not tell whether it had worked. These run the real CLI with no
// `--json` and assert on what a human actually sees — plus the `--host` ->
// `--agent` rename and the lock back-compat that rename needs.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, exists, hostRepo, parse, readLock, run } from './helpers.mjs';

const human = (args, opts) => run(args, { ...opts, json: false });
const lines = (text) => text.replace(/\n+$/, '').split('\n');
const OTHER_AGENTS = [/Codex/, /Cursor/, /GitHub Copilot/, /codex/, /cursor/, /copilot/];

// ------------------------------------------- 1. the case this was filed for

test('a second install with nothing to do prints ONE line and exits 0', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    assert.equal(human(['install', '--agent', 'claude-code', '--root', root]).code, 0);

    const second = human(['install', '--agent', 'claude-code', '--root', root]);
    assert.equal(second.code, 0);
    assert.equal(lines(second.stdout).length, 1,
      `a no-op install must be one line, got:\n${second.stdout}`);
    assert.match(second.stdout, /up to date/i);
    // No file counts: "274 unchanged" means nothing to the person who typed
    // `install`, and reads like a failure.
    assert.doesNotMatch(second.stdout, /\d/);
    // No listing of agents, and nothing to restart — nothing changed.
    assert.doesNotMatch(second.stdout, /Claude Code/);
    assert.doesNotMatch(second.stdout, /[Rr]estart/);
    // It is the result, so it is on stdout; stderr stays empty.
    assert.equal(second.stderr.trim(), '');
  } finally { cleanup(root); }
});

// ------------------------------------------------------- 2. what changed

test('a first install reports what changed, grouped by agent, with a restart line', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    const first = human(['install', '--agent', 'claude-code', '--root', root]);
    assert.equal(first.code, 0);
    assert.match(first.stdout, /Claude Code/);
    assert.match(first.stdout, /added \d+ skills: .*sw-setup/);
    assert.match(first.stdout, /added \d+ sub-agents: /);
    assert.match(first.stdout, /\.mcp\.json/);
    assert.match(first.stdout, /Restart Claude Code/);
    // Still a summary, not a dump of all 200-odd files.
    assert.ok(lines(first.stdout).length < 20, `too long:\n${first.stdout}`);
  } finally { cleanup(root); }
});

test('--verbose names every file; the default does not', () => {
  const plain = hostRepo({ dirs: ['.claude'] });
  const loud = hostRepo({ dirs: ['.claude'] });
  try {
    const a = human(['install', '--agent', 'claude-code', '--root', plain]);
    const b = human(['install', '--agent', 'claude-code', '--root', loud, '--verbose']);
    assert.doesNotMatch(a.stdout, /skills\/sw-setup\/SKILL\.md/);
    assert.match(b.stdout, /skills\/sw-setup\/SKILL\.md/);
    assert.ok(lines(b.stdout).length > lines(a.stdout).length * 5);
  } finally { cleanup(plain); cleanup(loud); }
});

// ------------------------------------------ 3. conflicts and drift, always

test('a conflict is shown with its file and its remedy, never collapsed', () => {
  const root = hostRepo({
    dirs: ['.claude'],
    files: { '.claude/skills/sw-setup/SKILL.md': 'something the user wrote\n' },
  });
  try {
    const r = human(['install', '--agent', 'claude-code', '--root', root]);
    assert.match(r.stdout, /conflict/i);
    assert.match(r.stdout, /\.claude\/skills\/sw-setup\/SKILL\.md/);
    assert.match(r.stdout, /fix:/);
  } finally { cleanup(root); }
});

test('drift is shown with its file and its remedy on the next run', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    human(['install', '--agent', 'claude-code', '--root', root]);
    writeFileSync(join(root, '.claude', 'agents', 'sw-qa-engineer.md'), 'my own version\n');

    const again = human(['install', '--agent', 'claude-code', '--root', root]);
    assert.match(again.stdout, /\.claude\/agents\/sw-qa-engineer\.md/);
    assert.match(again.stdout, /edited since install|drift/i);
    assert.match(again.stdout, /fix:/);

    const status = human(['status', '--root', root]);
    const line = lines(status.stdout).find((l) => l.includes('.claude/agents/sw-qa-engineer.md'));
    assert.ok(line, 'status must name the drifted file');
    assert.match(line, /edited since install/);
  } finally { cleanup(root); }
});

// A conflict is a file somebody else wrote and the CLI refuses to overwrite.
// `status` carries it in the same `drift[]` array as real drift, so it is the
// one place that can blame the user for a file they never touched.
test('status calls a conflict a conflict, not an edit the user made', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    // Pre-existing foreign file on a path we ship: never adopted, never locked.
    mkdirSync(join(root, '.claude', 'agents'), { recursive: true });
    writeFileSync(join(root, '.claude', 'agents', 'sw-qa-engineer.md'), 'somebody else wrote this\n');
    human(['install', '--agent', 'claude-code', '--root', root]);
    // ...and a genuine drift alongside it, so the two are told apart.
    writeFileSync(join(root, '.claude', 'agents', 'sw-shopware-architect.md'), 'my own version\n');

    const status = human(['status', '--root', root]);
    const conflict = lines(status.stdout).find((l) => l.includes('.claude/agents/sw-qa-engineer.md'));
    assert.ok(conflict, 'status must name the conflicting file');
    assert.match(conflict, /conflict/);
    assert.doesNotMatch(conflict, /edited since install/);

    const drift = lines(status.stdout).find((l) => l.includes('.claude/agents/sw-shopware-architect.md'));
    assert.ok(drift, 'status must name the drifted file');
    assert.match(drift, /edited since install/);

    // The --json shape keeps every key it had, and now says which is which.
    const body = parse(run(['status', '--root', root]));
    const entry = body.drift.find((d) => d.target.endsWith('sw-qa-engineer.md'));
    assert.equal(entry.state, 'conflict');
    for (const key of ['target', 'expected', 'actual', 'reason', 'remedy']) {
      assert.ok(key in entry, `status --json lost the drift[].${key} key`);
    }
  } finally { cleanup(root); }
});

// ------------------------------------------ 4. never name an absent agent

test('a Claude-Code-only project is never told about the other agents', () => {
  const root = hostRepo({ dirs: ['.claude', '.github'] });
  try {
    for (const args of [
      ['install', '--agent', 'claude-code', '--root', root],
      ['install', '--agent', 'claude-code', '--root', root],
      ['status', '--root', root],
    ]) {
      const r = human(args);
      for (const other of OTHER_AGENTS) {
        assert.doesNotMatch(r.stdout, other, `${args.join(' ')} named ${other}`);
      }
    }
  } finally { cleanup(root); }
});

// ------------------------------------------------------ 5. --json is intact

test('--json still prints one parseable object per command, with a next_step', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    const install = parse(run(['install', '--agent', 'claude-code', '--root', root]));
    assert.equal(install.ok, true);
    assert.equal(install.command, 'install');
    for (const key of ['version', 'content_version', 'scope', 'root', 'summary',
      'lock_file', 'next_step', 'help', 'agents', 'actions', 'manual', 'errors']) {
      assert.ok(key in install, `install --json lost the ${key} key`);
    }
    assert.deepEqual(install.agents.map((a) => a.id), ['claude-code']);
    assert.ok(install.actions.length > 50, 'the per-file detail still lives in the JSON');

    const status = parse(run(['status', '--root', root]));
    for (const key of ['state', 'installed_version', 'inventory', 'agents',
      'drift', 'declined', 'manual', 'errors']) {
      assert.ok(key in status, `status --json lost the ${key} key`);
    }
    assert.equal(status.agents.length, 4, 'the JSON still reports every supported agent');

    const planned = parse(run(['plan', '--root', root]));
    assert.ok('summary' in planned && 'actions' in planned);

    const removed = parse(run(['uninstall', '--yes', '--root', root]));
    assert.equal(removed.ok, true);
    assert.ok('summary' in removed && 'kept' in removed);
  } finally { cleanup(root); }
});

test('no command prints its body as JSON unless --json asked for it', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    human(['install', '--agent', 'claude-code', '--root', root]);
    for (const args of [
      ['install', '--agent', 'claude-code', '--root', root],
      ['status', '--root', root],
      ['plan', '--root', root],
      ['uninstall', '--yes', '--root', root],
    ]) {
      const r = human(args);
      assert.throws(() => JSON.parse(r.stdout), `${args.join(' ')} still dumped JSON`);
    }
  } finally { cleanup(root); }
});

// -------------------------------------------------------- 6. the rename

test('--agent selects an agent and --host is now an unknown option', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    assert.equal(run(['install', '--agent', 'claude-code', '--root', root]).code, 0);
    assert.ok(exists(root, '.claude/skills/sw-setup/SKILL.md'));

    const rejected = run(['install', '--host', 'claude-code', '--root', root]);
    assert.equal(rejected.code, 2, '--host must be a clean break, not an alias');
    const body = parse(rejected);
    assert.match(body.error, /unknown option --host/);
    assert.ok(body.help.length > 0);
    for (const line of body.help) {
      assert.match(line, /^sw-ecosystem-agentic-harness /, `help entry is not runnable: ${line}`);
    }
  } finally { cleanup(root); }
});

test('the exit-2 help for a missing selection names --agent, not --host', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    const r = run(['install', '--root', root]);
    assert.equal(r.code, 2);
    const body = parse(r);
    assert.match(body.error, /--agent/);
    assert.ok(body.help.some((l) => l.includes('--agent claude-code')));
    assert.ok(!body.help.some((l) => l.includes('--host')));
  } finally { cleanup(root); }
});

// ---------------------------------------- 7. a lock from before the rename

test('a lock recording the legacy `hosts` key still resolves its agents', () => {
  const root = hostRepo({ dirs: ['.claude'] });
  try {
    run(['install', '--agent', 'claude-code', '--root', root]);

    // Rewrite the lock the way every already-installed project has it.
    const path = join(root, '.sw-ai-sdk', 'harness.lock.json');
    const lock = JSON.parse(readFileSync(path, 'utf8'));
    const { agents, ...rest } = lock;
    assert.deepEqual(Object.keys(agents), ['claude-code']);
    writeFileSync(path, `${JSON.stringify({ ...rest, hosts: agents }, null, 2)}\n`);

    // A bare `install` — no --agent, no TTY. Without the back-compat read this
    // exits 2 and the project silently loses its recorded selection.
    const r = run(['install', '--root', root]);
    assert.equal(r.code, 0, `a legacy lock must still resolve: ${r.stdout}${r.stderr}`);
    const body = parse(r);
    assert.deepEqual(body.agents.map((a) => a.id), ['claude-code']);

    // And the lock is migrated on write.
    const after = readLock(root);
    assert.deepEqual(Object.keys(after.agents), ['claude-code']);
    assert.ok(!('hosts' in after), 'the legacy key is not written back');
  } finally { cleanup(root); }
});
