---
name: sw-setup
description: Print one environment-readiness table for the project's development/test setup — vendor/, Node, the editor CLIs, shopware-cli, the KB MCP, the acceptance-test project, Playwright browsers, its .env, per-plugin test scaffolding, the project wiki, `.gitignore` and whether the SW AH npm packages are current, plus the installer CLI's own configuration/drift status. Stops when every row is ticked. When rows are missing, asks one yes/no question and delegates the fix to the installer CLI. Use when asked to set up the project, check if the environment is ready, or bootstrap the tests. Never designs, implements or verifies a feature itself — that's sw-design-solution, sw-implement-feature and sw-verify-feature, which call this skill first. Never writes a coding agent's configuration file itself — that's the installer CLI.
when_to_use: Trigger phrases — "set up the project", "is the environment ready", "bootstrap the tests", "sw-setup".
allowed-tools: Read Glob Grep AskUserQuestion Skill Bash mcp__ShopwareDevKnowledgeBase__kb_status Bash(npx -y @execuro-sw-ecosystem/sw-ecosystem-agentic-harness@latest *)
---

# sw-setup

One readiness table for this project's development/test environment. No
arguments. Read-only by default; writes only after the user answers yes.

## This file is a stub

The harness ships as an npm package with an installer CLI
(`@execuro-sw-ecosystem/sw-ecosystem-agentic-harness`) that owns every write
to a host's configuration. Do not follow this file's workflow or rule-list
instructions as the protocol for what gets installed or how — an installed
copy of this skill can go stale while the CLI does not. For the current
source of truth, run:

```
npx -y @execuro-sw-ecosystem/sw-ecosystem-agentic-harness@latest guide
```

This skill only renders the CLI's output as a table and relays its one
question; it never restates or re-implements the install protocol.

## Called from other skills

`sw-design-solution`, `sw-implement-feature` and `sw-verify-feature` invoke
this skill as their own first step and read its table; they never repeat
these checks themselves. A caller passes no arguments and reads the printed
table from this run's output — it does not re-run `sw-setup`'s checks.

## Procedure

### 1. Status

Run:

```
npx -y @execuro-sw-ecosystem/sw-ecosystem-agentic-harness@latest status --json
```

`--json` is mandatory for every call this skill makes: without it the CLI
prints a human summary, not the object below. It prints one JSON object
(`ok`, `next_step`, `help`, and its own `agents[]`/`drift[]` configuration
state). Alongside it, run every
environment row's check from `reference/rows.md` in this skill's directory —
read-only, seconds each: file/directory existence, one version command, one
`kb_status` call, three `npm view` registry lookups (Package updates row) —
the one part of step 1 that touches the network, so it is the slow part.
Never write, never install, never ask a question in this step.

Print one checkbox list, one line per row — the environment rows first, then
one line per configuration item the CLI's `agents[]`/`drift[]` reports:

```
- [x] vendor/ — shopware/core 6.7.13.0
- [ ] vendor/ — vendor/bin/phpunit missing (tree built --no-dev)
- [ ] Node — 18.x (need >= 20)
- [-] Visual editors (optional) — Specs Editor not installed, Tender tool not installed
- [x] shopware-cli — 0.16.10
- [x] KB MCP — platform: implemented
- [ ] Acceptance-test project — tests/acceptance/ missing
- [ ] Playwright browsers — not installed
- [ ] ATS env — tests/acceptance/.env missing
- [x] Plugin tests — AhCheckout: phpunit + jest ok
- [ ] Project wiki — docs/project-wiki/ missing
- [ ] Package updates — harness 0.1.0 → 0.1.3, Specs Editor not installed
- [ ] Installer config — .mcp.json entry: drift (from CLI status)
```

Per-plugin rows print one line per directory under `custom/plugins/`, e.g.
`- [ ] Plugin tests — AcmeFeature: jest.admin.config.js missing`.

### 2. All ticked

Print one closing line: `Environment ready.` Stop. No question.

### 3. Missing rows

For a missing environment row, research only what it needs: the guideline
sections `reference/rows.md` cites for that row
(`shopware-project-qa-guidelines.md` §3.3–§3.7, §6.1), `compose.yaml` for the
service name, `custom/plugins/*` names for per-plugin rows.

For a missing/drifted configuration row, do not research or plan the fix
yourself — the CLI's `plan` command already has it:

```
npx -y @execuro-sw-ecosystem/sw-ecosystem-agentic-harness@latest plan --json
```

List the concrete steps in plain words: environment-row fixes in order
(vendor/ → Visual editors → KB MCP → Acceptance-test project →
Playwright browsers → ATS env → Plugin tests → Project wiki → Package
updates), then the CLI's planned configuration changes last — Package
updates comes immediately before those, since updating the harness is what
may change them. Skip any row already ticked.

Ask exactly one question: "Do this and that?" with the steps spelled out in
plain words (no command dump). Ask the user with a structured question tool
if you have one (Claude Code: `AskUserQuestion`; Codex: `request_user_input`,
which is non-blocking outside Plan mode — so end the turn after asking).
Options:
- **Yes, run it** — run the environment-row fixes in order, then
  `npx -y @execuro-sw-ecosystem/sw-ecosystem-agentic-harness@latest apply --yes --json`
  for the configuration changes, then re-run step 1 and print the final table.
- **No, stop** — stop; the table from step 1 is already on screen.

### 4. Rules

- Everything stays under the project directory; never a global install,
  never a path under `~`.
- Host tools that cannot live under the project (Node, shopware-cli, Docker
  itself) are reported with install advice only, never installed.
- Credentials (ATS env values) are prompted for as part of the single
  question in step 3, never invented, never printed back once entered.
- A fix that runs inside a container says so in the step list; if the
  container is not running at execution time it stops and reports that —
  sw-setup never starts the developer's stack itself.
- The Project wiki fix invokes `sw-document-feature --setup` with the Skill
  tool; the KB MCP row only reports whether the platform layer is built —
  the corpus ships already built inside the
  `@execuro-sw-ecosystem/sw-dev-knowledge-base-mcp` package. If `platform` is
  not `implemented`, the fix is to check the registration (re-run the
  installer CLI's `apply --yes --json`) or update that package — never build a
  corpus here. Neither is replicated in this skill.
- This skill never writes a coding agent's configuration file itself
  (`.mcp.json`, permission grants, `.gitignore` lines). Every such write goes
  through the installer CLI's `apply --yes --json`, after the user's yes.

### 5. Report

Print the final table (from step 1, or re-run after step 3's fix), then one
line:
- `Ready for: design · implement · verify` when every row is ticked, or
- the first row still unticked and which skills it blocks, per
  `reference/rows.md`'s "Blocks" line for that row (environment rows), or the
  CLI's own `next_step` (configuration rows) — e.g. `Blocked: vendor/ —
  blocks sw-design-solution, sw-implement-feature, sw-verify-feature`.

## Reference files

`reference/rows.md` in this skill's directory — the twelve environment rows:
check command(s), what "ticked" means, the fix steps verbatim from the
guideline, and which skills the row blocks. Agent configuration state (what
gets installed into `.mcp.json`, permissions, `.gitignore`) is not in this
file — it comes from the installer CLI's `status`/`plan`/`apply` output.
