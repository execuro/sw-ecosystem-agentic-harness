// Output contract shared by every sw-ecosystem-agentic-harness subcommand.
//
// There is one result object per run. `--json` prints it verbatim: keys
// ordered small-first with the big payload LAST, so an agent that reads only
// the head of the output already knows whether it worked and what to run next.
// Without `--json` the same object is rendered for a human by lib/render.mjs —
// the object is the model, the renderer is only a view, and neither can drift
// from the other because there is only ever one body.
//
// Human text goes to stdout: it is the result, not progress. stderr carries
// progress, warnings and the interactive picker — never part of the result.
//
// The contract: a mandatory `next_step` on every success, `exit 2` on a usage
// error carrying a `help` array of runnable commands.

import { render } from './render.mjs';

export const EXIT_OK = 0;
export const EXIT_FAIL = 1;
export const EXIT_USAGE = 2;

/** Serialise with a stable shape: two-space indent, trailing newline. */
export function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

// Read from argv rather than threaded through every call: `bin/cli.mjs`
// dispatches some usage errors before any flag parsing has happened, and those
// must honour `--json` too. `setFormat`/`setVerbose` exist so a unit test can
// drive this without re-spawning the process.
let format = process.argv.includes('--json') ? 'json' : 'human';
let verbose = process.argv.includes('--verbose');

export function setFormat(value) { format = value === 'json' ? 'json' : 'human'; }
export function setVerbose(value) { verbose = value === true; }
export function isJson() { return format === 'json'; }

function emit(body, code) {
  // `guide` is already prose inside its own body; rendering it would only
  // hide it. Everything else gets the human view unless `--json` asked.
  const asJson = format === 'json' || body.command === 'guide';
  process.stdout.write(asJson
    ? json(body)
    : render(body, { verbose, color: process.stdout.isTTY === true }));
  process.exitCode = code;
  return code;
}

/**
 * A successful result. `body.next_step` is mandatory and enforced here rather
 * than in review: a result an agent cannot act on is a bug, not a style issue.
 */
export function ok(command, body) {
  if (!body || typeof body.next_step !== 'string' || body.next_step.trim() === '') {
    throw new Error(`${command}: every successful result must carry a next_step`);
  }
  return emit({ ok: true, command, ...body }, EXIT_OK);
}

/**
 * The invocation was wrong — an unknown command, a missing `--yes`, a bad
 * flag value. `help` is a list of runnable commands, not prose.
 */
export function usage(command, error, help) {
  return emit(
    {
      ok: false,
      command: command || null,
      error,
      next_step: help && help.length ? help[0] : 'Run `sw-ecosystem-agentic-harness guide`.',
      help: help && help.length ? help : ['sw-ecosystem-agentic-harness guide'],
    },
    EXIT_USAGE,
  );
}

/** The invocation was fine but the work could not be done. */
export function failure(command, error, body = {}) {
  return emit(
    {
      ok: false,
      command,
      error,
      next_step: body.next_step || 'Fix the error above, then re-run the command.',
      help: body.help || [`sw-ecosystem-agentic-harness status`],
      ...body,
    },
    EXIT_FAIL,
  );
}

/** Progress or a warning that is not part of the result. */
export function note(text) {
  process.stderr.write(`${text}\n`);
}
