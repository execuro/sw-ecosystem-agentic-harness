# Contributing

## Toolchain

Node >= 20, `git`. Zero runtime dependencies — keep it that way; a new
dependency here ships to every project that installs this package.

## Before you send a change

All of these must pass:

```bash
npm test                        # the full suite
npm run gen:check                # generated adapters match their sources
node scripts/check-pack.mjs      # the tarball matches the files allow-list
```

If you edited an agent or a skill, regenerate the per-agent adapters first and
commit the result:

```bash
npm run gen
```

## Rules that bite

- **`codex/agents/*.toml` and `copilot/agents/*.agent.md` are generated** from
  `agents/*.md` by `scripts/gen-codex-agents.mjs` and
  `scripts/gen-copilot-agents.mjs`. Never hand-edit them — run `npm run gen`
  and commit the output. `npm run gen:check` fails the build on drift.
- **Every `SKILL.md` stays under 8192 bytes**, Codex's effective cap and the
  smallest of the four coding agents'. A test enforces it. When a skill grows
  past the cap, move material into `reference/*.md` beside it — that is
  **reorganisation, never compression**. Audit the split against the
  pre-split file line by line; do not drop meaning to make the number work.
- **Skills stay agent-neutral.** No `${CLAUDE_SKILL_DIR}`, no `$ARGUMENTS`, no
  `SendMessage` or `subagent_type`, no literal `.claude/…` path. Any prose that
  asks the user a question names both Claude Code's and Codex's question
  tools, not just one.
- **The result object is the model; `lib/render.mjs` is only a view.** Every
  command builds one body, `--json` prints it verbatim and the human summary
  is rendered from that same body — never assembled beside it. The renderer is
  pure `body -> string` with no I/O, so it is unit-tested in
  `test/render.test.mjs` without a terminal. Human text goes to stdout (it is
  the result); only the interactive picker and warnings go to stderr.
- **Test suites pass `--json`.** `test/helpers.mjs`'s `run()` appends it for
  every call; only a suite that is about the human output opts out with
  `{ json: false }`.
- **The installer never prompts, never fetches, and writes atomically.**
  Every file is written to a temporary path and renamed. A change that breaks
  any of those three properties is a change to the contract this package
  makes with its users, not an implementation detail — flag it explicitly in
  the change description.

## Working on the package

`scripts/` is developer tooling: run by hand and by CI, never shipped in the
published tarball, and never run on a user's machine.

`claude plugin validate <dir> --strict` resolves a directory to one manifest
and returns `contents: []` on its own, so run it against all four explicit
targets — `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`,
`skills`, `agents` — not just the directory.
