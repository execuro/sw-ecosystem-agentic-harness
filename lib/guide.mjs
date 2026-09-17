// The install protocol, in one place.
//
// The `sw-setup` skill is a stub that sends the agent here rather than
// restating any of this: an installed copy of a skill goes stale, this does
// not, because it ships with the CLI that implements it.

import * as out from './out.mjs';
import { PKG_NAME, PKG_VERSION } from './content.mjs';
import { EXTRA_COMPONENTS } from './extra-components.mjs';

const RUN = `npx -y ${PKG_NAME}@${PKG_VERSION}`;
const EXTRA_COMPONENT_INSTALLS = EXTRA_COMPONENTS.map((c) => `npm i -D ${c.pkg}@${c.version}`).join('\n');

export const GUIDE = `# ${PKG_NAME} — install protocol

This CLI installs the Shopware agentic harness — 10 \`sw-*\` skills and 7
\`sw-*\` sub-agents — into whichever coding agents this repository uses, and
registers the MCP servers and permission rules they depend on.

## The loop

1. \`${RUN} install\`
   The whole install in one command. It refuses to prompt — Codex's question
   tool does not block outside Plan mode, and CI has no terminal — so the verb
   itself is the consent. Same as \`apply --yes\`.

2. \`${RUN} status\`
   Read-only, optional. Reports which hosts are present, what is already
   installed, and anything that has drifted since it was installed. Always safe.

3. \`${RUN} plan\`
   Prints the exact set of changes and writes nothing. Every entry says what it
   would do and why. Show this to the user before applying.

4. \`${RUN} apply --yes\`
   The scriptable name for the same write \`install\` performs — use it for
   re-runs and repairs. It refuses without \`--yes\`; there is no prompt, because
   Codex's question tool does not block outside Plan mode and CI has no
   terminal.

5. \`${RUN} uninstall --yes\`
   Removes what the lock file records and reverts the managed config blocks.

## Flags

  --host claude-code|codex|copilot|cursor   restrict to one host, repeatable
  --scope project|user                      default: project
  --root <path>                             default: the current directory
  --no-extra-components                     skip the optional extra-component skills

## Optional extra components

Two skills — Specs Editor and Tender Discovery Tool — ship inside their own
npm packages, not this one. \`plan\`/\`apply\` detect them offline
(\`npx --no-install\`) and never fetch them, probing for the exact version
this release pins — any other version, including \`@latest\`, is treated as
absent and the skill is skipped:

\`\`\`bash
${EXTRA_COMPONENT_INSTALLS}
\`\`\`

The exact command is also in a \`skipped\` action's \`remedy\`, and in
\`status\`'s \`extra_components\` array. Install it, then re-run \`${RUN} apply --yes\`.

## What you can rely on

- **stdout is exactly one JSON object.** Every successful result carries a
  \`next_step\` string: the literal command to run next. Errors carry a
  \`help\` array of runnable commands.
- **Exit codes:** 0 success, 2 usage error (your invocation was wrong),
  1 the work could not be done.
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

Every host reads its configuration at startup. The result's \`help\` array
names the restart or reload each one needs — pass it on to the user rather
than assuming the change is already live.

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
    help: [`${RUN} install`, `${RUN} status`, `${RUN} plan`, `${RUN} apply --yes`],
    guide: GUIDE,
  });
}
