// Output contract shared by every sw-ecosystem-agentic-harness subcommand.
//
// stdout carries exactly one JSON object and nothing else. Its keys are
// ordered small-first with the big payload LAST, so an agent that reads only
// the head of the output already knows whether it worked and what to run next.
//
// stderr carries progress and warnings that are not part of the result.
//
// The contract: structured JSON on stdout, a mandatory `next_step` on every
// success, `exit 2` on a usage error carrying a `help` array of runnable
// commands.

export const EXIT_OK = 0;
export const EXIT_FAIL = 1;
export const EXIT_USAGE = 2;

/** Serialise with a stable shape: two-space indent, trailing newline. */
export function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function emit(body, code) {
  process.stdout.write(json(body));
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
