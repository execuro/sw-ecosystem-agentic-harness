#!/usr/bin/env node
// sw-ecosystem-agentic-harness — the single entry point.
//
// Every lib module exports its command as a function taking argv and never
// looks at process.argv, so the dispatch works identically whether the package
// is reached directly, through npm's .bin symlink, or through `npx`.

import * as out from '../lib/out.mjs';

// A consumer that stops reading (`| head`, a truncating harness) closes our
// stdout, and the next write raises EPIPE. That is the reader's choice, not an
// error of ours, so exit quietly instead of dumping a stack over the output.
for (const stream of [process.stdout, process.stderr]) {
  stream.on('error', (e) => {
    if (e?.code === 'EPIPE') process.exit(out.EXIT_OK);
    throw e;
  });
}

const COMMANDS = {
  status: async () => (await import('../lib/commands.mjs')).status,
  plan: async () => (await import('../lib/commands.mjs')).plan,
  apply: async () => (await import('../lib/commands.mjs')).apply,
  install: async () => (await import('../lib/commands.mjs')).install,
  uninstall: async () => (await import('../lib/commands.mjs')).uninstall,
  guide: async () => (await import('../lib/guide.mjs')).main,
};

const USAGE = `usage: sw-ecosystem-agentic-harness <command> [options]

  install    [--agent <a>] [--scope project|user] [--root <path>] [--no-extra-components]
  status     [--agent <a>] [--scope project|user] [--root <path>]
  plan       [--agent <a>] [--scope project|user] [--root <path>] [--no-extra-components]
  apply      --yes [--agent <a>] [--scope project|user] [--root <path>] [--no-extra-components]
  uninstall  --yes [--agent <a>] [--scope project|user] [--root <path>]
  guide      print the install protocol

  install is apply --yes under a friendlier name: the whole install in one
  command, no --yes needed — typing the verb is the consent for that write;
  it can still ask which coding agent(s), see below.

  <a> is one of: claude-code, codex, copilot, cursor. Repeat --agent to select
  several. install/apply resolve which agent(s) to use, in order: --agent if
  given; else the agents already recorded in the lock file, if one exists;
  else, with a terminal attached, an interactive picker; else exit 2 with
  the four "... install --agent <a>" commands as help. status and uninstall
  keep covering every agent by default.

  --scope defaults to project: nothing is written under your home directory
  unless you ask for it. --root defaults to the current directory.

  --no-extra-components skips the two optional extra-component skills (Specs
  Editor, Tender Discovery Tool) even when the package is present locally.

  --json      print the result object instead of the human summary
  --verbose   include the per-file detail --json carries

install, status, plan and uninstall print a short human summary on stdout.
Add --json for the machine-readable object, which always carries a next_step.
Run \`sw-ecosystem-agentic-harness guide\` first — it is the install protocol.`;

const argv = process.argv.slice(2);
const cmd = argv[0];

if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
  process.stdout.write(`${USAGE}\n`);
  process.exit(cmd ? out.EXIT_OK : out.EXIT_USAGE);
}

const load = COMMANDS[cmd];
if (!load) {
  out.usage(null, `unknown command ${cmd}`,
    Object.keys(COMMANDS).map((c) => `sw-ecosystem-agentic-harness ${c}`));
  process.exit(out.EXIT_USAGE);
}

try {
  const main = await load();
  await main(argv.slice(1));
} catch (e) {
  if (e?.help) {
    out.usage(cmd, e.message, e.help);
    process.exit(out.EXIT_USAGE);
  }
  out.failure(cmd, e?.message ?? String(e));
  process.exit(out.EXIT_FAIL);
}
