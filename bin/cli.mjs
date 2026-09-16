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
  uninstall: async () => (await import('../lib/commands.mjs')).uninstall,
  guide: async () => (await import('../lib/guide.mjs')).main,
};

const USAGE = `usage: sw-ecosystem-agentic-harness <command> [options]

  status     [--host <h>] [--scope project|user] [--root <path>]
  plan       [--host <h>] [--scope project|user] [--root <path>]
  apply      --yes [--host <h>] [--scope project|user] [--root <path>]
  uninstall  --yes [--host <h>] [--scope project|user] [--root <path>]
  guide      print the install protocol

  <h> is one of: claude-code, codex, copilot, cursor. Repeat --host to select
  several; omitting it selects every host that is present.

  --scope defaults to project: nothing is written under your home directory
  unless you ask for it. --root defaults to the current directory.

Every command prints one JSON object on stdout carrying a next_step. Run
\`sw-ecosystem-agentic-harness guide\` first — it is the install protocol.`;

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
