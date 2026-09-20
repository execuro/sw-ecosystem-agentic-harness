# Changelog

All notable changes to the Shopware Ecosystem Agentic Harness are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
versioning is [semver](https://semver.org/) — `0.x` until the first stable
release.

## [Unreleased]

## [0.1.10] - 2026-09-20

### Changed

- **The design skills follow the Specs Editor's split of PRD and tech-spec
  workflows.** `sw-design-requirements` and `sw-design-solution` (their
  `SKILL.md`, editor-mode, editor-gate, readiness and pre-check references) and
  `README.md` now describe one session per document, with `--doc` naming the
  document, and a feature's PRD and spec as two independent sessions.

## [0.1.9] - 2026-09-19

### Changed

- `README.md` names `sw-setup` as part of the installation flow. Documentation only.

## [0.1.8] - 2026-09-19

### Changed

- **The lock file moved to `var/sw-ai-sdk/harness.lock.json`, and the
  `.gitignore` line is gone with it.** A Shopware project ignores the whole of
  `var/` through the `shopware/core` Flex recipe (`/var/*`, with a single
  `!/var/.htaccess` negation) and already keeps its machine-local state there
  — `var/cache`, `var/log` — so the installer no longer creates a directory in
  the repository root and no longer writes to `.gitignore` at all. A root with
  no `var/` (`--scope user` under $HOME, or a checkout that is not a Shopware
  project) keeps `.sw-ai-sdk/` and its managed line, unchanged. Nothing here
  reads a path outside the install root, on any platform.
  **Migration is automatic and lossless:** a lock still at the old path is
  read, rewritten to the new one, and the old file, its directory and the
  managed `.gitignore` block are removed. Declined rules, recorded agents and
  file hashes all survive, so the first run after upgrading reinstalls nothing
  — it reports `migrated[]` in `--json` and one line in the human summary.
  `lock_file` in every result body now carries the resolved path; anything
  that hard-coded `.sw-ai-sdk/` should read that key instead.

### Removed

- **BREAKING: the "extra component" mechanism is gone.** The CLI no longer
  detects, installs, updates or removes the two optional visual editors
  (Specs Editor, Tender Discovery Tool); each package installs its own skill,
  orchestrated by the `sw-setup` skill. Removed with it: the
  `extra_components[]` key from `status --json`, the `--no-extra-components`
  flag on `install`/`plan`/`apply`, the `skipped` field from `plan`'s and
  `apply`'s `summary` (nothing else could produce that state), the
  `skill-copy` action kind, and the "Optional extra components" section of
  `guide`. Anything reading `extra_components[]` or counting `summary.skipped`
  must stop.
  **Why:** the mechanism had never once worked. It spawned `npx --no-install
  <pkg>@<pin> install-skill --print` and required stdout to begin with `---`,
  but both editors document a `source:`/`next_step:` preamble before the skill
  document, so the check could never pass and neither skill was ever installed.
  `--no-install` also suppresses installing but not resolving, so every
  `status`, `plan` and `apply` issued a real request to the npm registry —
  `status` was never offline-safe, contrary to what the module claimed.
- The two editors are now invoked as `@latest` everywhere, including in the
  `allowed-tools` permission grants of `sw-design-requirements`,
  `sw-design-solution` and `sw-discover-tender`, which still named an exact
  version and would therefore have denied the calls. The `@latest` check now
  guards `allowed-tools` lines as well as prose.

### Added

- `status --json` reports `skills_dir` per agent — the directory that agent
  actually reads skills from, and the `--target` `sw-setup` hands to an
  editor package's own `install-skill`/`uninstall-skill`.

## [0.1.7] - 2026-09-19

### Changed

- **BREAKING: `install`, `status`, `plan` and `uninstall` print a human
  summary, not JSON.** Typing `install` and getting several hundred lines of
  JSON made success unreadable; the result object is now rendered for a
  person on stdout — what changed, grouped by coding agent, and the restart
  each one needs. A run with nothing to do is one line. Conflicts, drift and
  manual steps are never collapsed: each names its file and its remedy, and
  an agent this project has not installed is never named at all. Pass
  `--json` for the previous object, unchanged apart from the key rename
  below, and `--verbose` for the per-file detail alongside the summary.
  **Every skill, script or agent parsing this output must add `--json`.**
- **BREAKING: `--host` is now `--agent`, with no alias.** `--host` is
  rejected as an unknown option (exit 2, with runnable `--agent` help), the
  `hosts` key in every result body is now `agents`, and the lock file records
  `agents`. A lock written by an earlier version under `hosts` is still read
  and is rewritten as `agents` on the next run, so an existing install keeps
  its recorded selection. Consistent with the earlier
  `--no-companions` -> `--no-extra-components` break.
  **WARNING — the lock migration is one-way:** writing `agents` drops the
  legacy `hosts` key, so after any run of this version an older pinned CLI
  (`npx …@0.1.6`) exits 2 in that repository with "no --host given, this
  repository has no recorded install". Verified against the published 0.1.6
  tarball.
- `install` invoked with a bad flag now reports `install`, not `apply`, in
  its usage help.

### Fixed

- `status` no longer labels a conflict as "edited since install". Its
  `drift[]` entries now carry the action's `state`, and the human renderer
  titles conflicts as conflicts.

## [0.1.6] - 2026-09-18

### Changed

- `README.md` only (commit subject: "Test"). No code change.

## [0.1.5] - 2026-09-17

### Fixed

- **`install`/`apply` no longer write into every detected host when
  `--host` is omitted.** They now resolve which host(s) to use in order:
  `--host` if given; else the hosts a lock file already records; else an
  interactive picker when a terminal is attached; else exit 2 naming the
  four `install --host <h>` commands as `help`, instead of silently
  defaulting to Claude Code, Codex, Copilot *and* Cursor. `status` and
  `uninstall` keep covering every host by default, and `plan` previews all
  four and says so when nothing was selected.

## [0.1.4] - 2026-09-17

### Added

- **`sw-setup` gained a twelfth readiness row, "Package updates".** It checks
  whether the harness, the Specs Editor and the Tender Discovery Tool are at
  their target versions (the harness at npm's latest, each editor at its own
  `extra_components[].version` pin, never npm's latest) via three
  `npm view` lookups, each with a 10-second timeout — a failed or timed-out
  lookup reports "could not check" rather than failing the row. Folds into
  step 3's single question; never blocks readiness. The KB MCP keeps its
  existing row (registered as `@latest`, nothing to update).

## [0.1.3] - 2026-09-17

### Changed

- **The `vendor/` row now names the specific missing file when unticked.**
  `sw-setup`'s printed line says which of `vendor/shopware/core`,
  `composer.lock` or `vendor/bin/phpunit` is missing instead of just marking
  the row unticked, so a `--no-dev` vendor tree (which has the first two but
  not `vendor/bin/phpunit`) is diagnosable at a glance. Same fix as before,
  `composer install --no-interaction`, offered the same way.
- **The update documentation now covers every component.** `README.md`'s
  **Keep up to date** section became **Keeping it up to date** and says how
  each of the three parts updates on its own schedule: this package through
  `install`, the MCP servers by themselves (they are registered as `@latest`,
  so a host fetches the newest build when it next starts one), and the Specs
  Editor and Tender Discovery Tool through their own `npm i -D` line followed
  by a re-run of `install`. The section also moved below Install's own
  subsections, which it had been separating from their heading.
- **The two extra components are now named individually, with the exact
  pinned `npm i -D` command for each**, in both `README.md`'s new **The
  optional editors** subsection and `guide`'s output — replacing the earlier
  `<package>@<version>` placeholder — because the probe accepts only the
  exact version `EXTRA_COMPONENTS` pins and skips the skill for anything else,
  including `@latest`.
- **Breaking: the "companion" terminology is renamed to "extra component".**
  The CLI flag `--no-companions` is now `--no-extra-components`, and the
  `status` JSON output key `companions` is now `extra_components`. Anything
  scripting against `0.1.2` or earlier that reads `companions` or passes
  `--no-companions` must update to the new names — there is no backwards-
  compatible alias.
- **`sw-storefront-developer`'s locate proofs now check for deprecated
  forwarder files and `feature()` branches, and read the active theme's
  `views` chain.** Proof 1 rejects a template whose header names it a removed
  forwarder; proof 2 notes the `feature()` branch a block sits in; proof 3
  also greps the theme's `theme.json` `views` order. The chain order and
  where an override belongs are now deferred to the storefront guideline's
  expert template-inheritance and override-placement sections instead of
  being restated in the agent body.

## [0.1.2] - 2026-09-16

### Changed

- **Install/update instructions now anchor to `@latest`.** Every `npx`
  invocation of this package in `README.md`, `sw-setup`'s `SKILL.md` and
  `reference/rows.md` uses `@execuro-sw-ecosystem/sw-ecosystem-agentic-harness@latest`
  instead of a bare package name or a frozen version — a bare invocation can
  resolve to a stale copy already in the `npx` cache or `node_modules`. Added
  a **Keep up to date** section to `README.md` and a **Keeping it current**
  section to `guide`'s output.

## [0.1.1] - 2026-09-16

### Added

- **An `install` command** — `apply --yes` under a friendlier one-step name.
  Typing the verb is the consent, so it never prompts and needs no `--yes`; the
  scriptable `apply --yes` is unchanged and stays what skills and CI call.

### Fixed

- CI and the GitHub Pages setup for the plugin marketplace.

## [0.1.0] - 2026-09-16

### Added

- **An npm package with an installer CLI** — `bin/cli.mjs` plus `lib/`,
  published as `@execuro-sw-ecosystem/sw-ecosystem-agentic-harness` with the bin
  `sw-ecosystem-agentic-harness`. Commands `status`, `plan`, `apply`,
  `uninstall` and `guide`, each printing one JSON object with a mandatory
  `next_step`; `exit 2` on a usage error with a `help` array of runnable
  commands. Zero runtime dependencies, no install hooks.
- **Installs into all four hosts** — Claude Code, OpenAI Codex, GitHub Copilot
  and Cursor, each into its own native discovery directories, with the MCP
  servers written in each host's own format.
- `copilot/agents/*.agent.md` — Copilot adapters generated by
  `scripts/gen-copilot-agents.mjs`, with Claude tool names mapped through
  Copilot's alias table. An unknown tool name fails the build rather than
  disappearing.
- `content/AGENTS.md` — generated from the shipped skills and agents by
  `scripts/gen-agents-md.mjs`. Codex, Copilot and Cursor read it from the
  installed tree, and Codex never reads `CLAUDE.md`.
- `scripts/frontmatter.mjs` — the frontmatter reader shared by all three
  generators.
- `scripts/check-pack.mjs` — fails when the tarball would carry anything outside
  the `files` allow-list, or when a lifecycle script is declared.
- `.github/workflows/release.yml` — OIDC trusted publishing with
  `--provenance`, gated on the generators, the tests, the pack check and the
  licence metadata.
- A full `node --test` suite, zero dependencies, covering the whole risk
  surface the compatibility guide names: install idempotency asserted on
  **mtimes**, malformed and JSONC configs, the uninstall round trip, Windows
  command wrapping and POSIX lock keys, and per-host error aggregation.
- The remaining `sw-*` skills — `sw-setup`, `sw-discover-tender`,
  `sw-design-requirements`, `sw-design-solution` — so the package now ships
  all **10** skills and **7** sub-agents. The Specs Editor's own skill ships
  inside its own package, not here.

### Changed

- **`sw-setup` is now a stub skill.** It runs the CLI's `status`, renders the
  table, asks its one question and runs `apply --yes`. It never writes a host
  file and no longer carries the rule list — the CLI is the single source of
  truth for what gets installed.
- **Every `SKILL.md` is under 8 KB**, Codex's effective cap, enforced by a test.
  `sw-discover-tender` (27.5 KB), `sw-design-solution` (17.8 KB) and
  `sw-design-requirements` (12.7 KB) were reorganised into `reference/` router
  files — reorganised, not compressed: each split was audited line-by-line
  against its pre-split copy.
- **No Claude-only construct is left anywhere.** All `${CLAUDE_SKILL_DIR}`,
  `$ARGUMENTS`, `SendMessage`, `subagent_type` and literal `.claude/…` paths are
  gone, and every `AskUserQuestion` in prose now names the capability with both
  hosts as an aside.
- `mcp.json` is now the portable Agent Plugins 1.0 form — it carries the
  `$schema` and a `type: "stdio"` per server, and is no longer a copy of
  Claude Code's `.mcp.json`. They are different formats.
- `README.md` documents the installer rather than a marketplace install.

### Removed

- `extensions.com.openai.codex` from the root `plugin.json`. No Codex manifest
  struct has an `agents` field, so the declaration was a no-op.
- The "carries no executables" claim from both plugin descriptions. The package
  now carries exactly one: the installer.

### Notes

- Distribution is the installer, not a plugin marketplace. The plugin
  manifests are kept valid in CI although nothing reads them today.
- The `ShopwareDevKnowledgeBase` and `playwright` MCP registrations both track
  `@latest`; every other pinned thing in this package is pinned exactly.
