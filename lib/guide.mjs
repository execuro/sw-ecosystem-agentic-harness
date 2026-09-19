// The install protocol, in one place.
//
// The `sw-setup` skill is a stub that sends the agent here rather than
// restating any of this: an installed copy of a skill goes stale, this does
// not, because it ships with the CLI that implements it.

import * as out from './out.mjs';
import { PKG_NAME, PKG_VERSION } from './content.mjs';

const RUN = `npx -y ${PKG_NAME}@${PKG_VERSION}`;

export const GUIDE = `# ${PKG_NAME} — install protocol

This CLI installs the Shopware agentic harness — 10 \`sw-*\` skills and 7
\`sw-*\` sub-agents — into whichever coding agents this repository uses, and
registers the MCP servers and permission rules they depend on.

## The loop

1. \`${RUN} install\`
   The whole install in one command. It never prompts for consent — typing
   the verb is the consent — but it does still need to know **which** coding
   agent(s) to write into, resolved in order: \`--agent\`, if given; else the
   agents a lock file already records, if this is a re-run; else, with a real
   terminal attached, an interactive picker; else it exits 2 with the four
   \`${RUN} install --agent <a>\` commands as \`help\` rather than guess or
   hang — Codex's question tool does not block outside Plan mode, and CI has
   no terminal, so a skill invoking this must always pass \`--agent\`.

2. \`${RUN} status\`
   Read-only, optional. Reports which agents are present, what is already
   installed, and anything that has drifted since it was installed. Always safe.

3. \`${RUN} plan\`
   Prints the exact set of changes and writes nothing. Every entry says what it
   would do and why. Show this to the user before applying.

4. \`${RUN} apply --yes\`
   The scriptable name for the same write \`install\` performs — use it for
   re-runs and repairs. It refuses without \`--yes\`, and resolves which
   agent(s) to touch the same way \`install\` does (see step 1).

5. \`${RUN} uninstall --yes\`
   Removes what the lock file records and reverts the managed config blocks.

## Flags

  --agent claude-code|codex|copilot|cursor  select one coding agent,
                                             repeatable — see the resolution
                                             order in step 1 above; a skill
                                             invoking \`install\`/\`apply\` must
                                             always pass it, since it has no
                                             terminal
  --scope project|user                      default: project
  --root <path>                             default: the current directory
  --json                                    print the result object instead of
                                             the human summary — a skill or
                                             agent always passes this
  --verbose                                 include the per-file detail

## The two visual editors

The Specs Editor and the Tender Discovery Tool are optional, ship their own
skill inside their own npm package, and are **not installed by this CLI**.
The \`sw-setup\` skill owns their whole lifecycle — it offers them, installs
each one with that package's own \`install-skill --target <skills dir>\`,
updates them by re-running it, and removes them with \`uninstall-skill\`.
This CLI never probes for them, never reports them, and never reaches the
network for them; \`status --json\` reports each agent's \`skills_dir\`,
which is the target \`sw-setup\` hands them.

## What you can rely on

- **\`--json\` puts exactly one JSON object on stdout.** Every successful
  result carries a \`next_step\` string: the literal command to run next.
  Errors carry a \`help\` array of runnable commands. Without \`--json\`,
  \`install\`, \`status\`, \`plan\` and \`uninstall\` print a short human
  summary of that same object instead — same body, one view for a person and
  one for a program. Anything parsing this output must pass \`--json\`.
- **Exit codes:** 0 success, 2 usage error (your invocation was wrong,
  including \`install\`/\`apply\` run with no \`--agent\`, no existing lock and
  no terminal to ask on), 1 the work could not be done.
- **Nothing is silently overwritten.** A file we did not install, or one you
  edited after we installed it, is reported as \`conflict\` or \`drift\` and
  left exactly as it is. Its \`remedy\` field tells the user what to do.
- **Existing rules are never removed or loosened.** Permission lists are
  merged. A rule you delete after install is recorded as declined and is never
  offered again.
- **Re-running is free.** A second \`apply\` reports everything as
  \`unchanged\` and does not rewrite a single byte.

## The one thing it cannot preserve

Rewriting a JSON config re-serialises it, so an array the user had written on
one line comes back expanded one element per line. Indentation, line endings,
a BOM and key order are all preserved; inline array style is not, because
preserving it would mean shipping a JSON parser that keeps a full syntax tree,
and this CLI has no dependencies by design. Nothing is lost — the value is
identical — but the diff is larger than the change. A file with comments or
trailing commas is never rewritten at all; it becomes a manual step instead.

## After applying

Every coding agent reads its configuration at startup. The result's \`help\`
array names the restart or reload each one needs — pass it on to the user
rather than assuming the change is already live.

## Keeping it current

This guide is version ${PKG_VERSION}. To install or upgrade to the newest
published version, run \`npx -y ${PKG_NAME}@latest install\`. Omitting
\`@latest\` can reuse a copy already in the \`npx\` cache or this project's
\`node_modules\`, so you would silently stay on whatever version you first
installed.

## If you are a skill

Call this CLI. Do not re-implement any of it, and do not copy this text into a
skill file — run \`${RUN} guide\` and follow what it says now.
`;

export async function main() {
  return out.ok('guide', {
    version: PKG_VERSION,
    next_step: `${RUN} install`,
    help: [`${RUN} install`, `${RUN} status --json`, `${RUN} plan --json`, `${RUN} apply --yes --json`],
    guide: GUIDE,
  });
}
