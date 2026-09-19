# Shopware Ecosystem Agentic Harness

The `sw-*` skills and sub-agents for Shopware 6 projects: they turn a briefing
into a PRD, a PRD into a technical spec, a spec into tested code, and tested
code into a project wiki page.

New line

It ships as **one npm package carrying an installer**. The installer copies the
skills and agents into whichever coding agents your repository uses and
registers the MCP servers and permission rules they depend on. Nothing is
loaded as a plugin, because the configuration the harness needs has no plugin
vehicle on any host.

- Published by Execuro UG (haftungsbeschränkt) under the MIT licence.
- Installs into **Claude Code, OpenAI Codex, GitHub Copilot and Cursor**.
- Zero runtime dependencies, and no install hooks: nothing executes on your
  machine except the CLI you invoke yourself.

## What it ships

| Component | Where | Contents |
| --- | --- | --- |
| Skills | `skills/` | 10 `sw-*` skills — `sw-setup`, `sw-discover-tender`, `sw-design-requirements`, `sw-design-solution`, `sw-implement-feature`, `sw-document-feature`, `sw-verify-feature` and its three verifiers (`-ac-tests`, `-architecture`, `-code-quality`) |
| Sub-agents | `agents/` | `sw-storefront-developer`, `sw-php-backend-developer`, `sw-admin-frontend-developer`, `sw-qa-engineer`, `sw-shopware-architect`, `sw-product-manager`, `sw-tender-editor` |
| Codex adapters | `codex/agents/` | The seven agents as Codex TOML roles — Codex plugins cannot ship sub-agents, so the installer writes these into `.codex/agents/` |
| Copilot adapters | `copilot/agents/` | The same seven as `.agent.md`, with Claude tool names mapped to Copilot's |
| Installer | `bin/`, `lib/` | The `sw-ecosystem-agentic-harness` CLI |

Every adapter is generated from `agents/*.md` at build time, committed, and
diff-checked in CI — so a bad mapping is a red build here, never a broken
install on your machine.

### Separate packages

The knowledge-base MCP server (`@execuro-sw-ecosystem/sw-dev-knowledge-base-mcp`)
and the two visual editors (`@execuro-sw-ecosystem/sw-specs-editor`,
`@execuro-sw-ecosystem/sw-tender-discovery-tool`) are their own npm packages.
This package registers the knowledge base as an MCP server; it does not contain
it. The knowledge-base server is also listed in the MCP Registry as
`io.github.execuro/sw-dev-knowledge-base-mcp` — a separate discovery-catalogue
identity, not an npm package name — and can be run standalone in any stdio MCP
client without this harness.

The two editors are **optional add-ons**, and each ships its own skill inside
its package rather than here. They are not this CLI's business at all: it
neither detects nor installs them. `sw-setup` owns their whole lifecycle —
it offers them, and installs, updates and removes each one with that
package's own `install-skill`/`uninstall-skill --target <skills dir>`. A
project that declines is fully set up without them, and `--editor` on
`sw-design-requirements`, `sw-design-solution` or `sw-discover-tender` then
stops with one line saying so.

## Commands

| Command | What it does |
| --- | --- |
| `install` | installs into the resolved coding agent(s) (see Flags below); the same as `apply --yes` |
| `status` | read-only; what is installed, what drifted, and each agent's `skills_dir` |
| `plan` | the exact changes, written as a diff; writes nothing |
| `apply --yes` | performs them |
| `uninstall --yes` | removes what the lock file records |
| `guide` | the install protocol, the single source of truth |

Flags: `--agent claude-code|codex|copilot|cursor` (repeatable), `--scope
project|user` (default `project`), `--root <path>` (default the current
directory), `--yes` (required by `apply` and `uninstall` — `install` implies
it), `--json` and `--verbose` (see Output below).

`install`/`apply` resolve which coding agent(s) to write into, in order:
`--agent` if given; else the agents a lock file already records (a re-run
needs no question); else, with a terminal attached, an interactive picker;
else exit 2 with the four `install --agent <a>` commands as `help` — it never
guesses and never hangs. `status` and `uninstall` are unaffected by this and
keep covering every agent by default; `plan` writes nothing, so with no
`--agent` and no lock it previews all four and says so.

### Output

`install`, `status`, `plan` and `uninstall` print a short human summary on
stdout — what changed, grouped by coding agent, and the restart each one
needs. When nothing changed, that is a single line. Conflicts, drift and
manual steps are always shown in full, with the file and the remedy, because
those are the only things you have to act on.

`--json` prints the result object instead: the same body, with the per-file
detail, a `next_step` on every success and a `help` array of runnable commands
on every error. **Anything parsing this output must pass `--json`.**
`--verbose` keeps the human summary but adds the per-file detail.

## Install

```bash
npx -y @execuro-sw-ecosystem/sw-ecosystem-agentic-harness@latest install
```

Want to look first? `status` is read-only and `plan` prints the diff; neither
writes anything.

Then restart your coding agent — every host reads its configuration at startup.
The command's output tells you which ones and how.

Then run the `sw-setup` skill in that agent. The installer only writes the
harness files; `sw-setup` checks and completes everything else the skills need
— `vendor/`, Node, `shopware-cli`, the knowledge-base MCP, the acceptance-test
project and its Playwright browsers, the per-plugin test scaffolding, and the
optional editor add-ons. It prints one readiness table and is done when every
row is ticked.

`apply` refuses without `--yes`. Neither `apply` nor `install` prompts for
consent — typing the verb, or passing `--yes`, is the consent — but with no
`--agent`, no existing lock and no terminal (Codex's question tool does not
block outside Plan mode, and CI has no terminal either), it exits 2 rather
than guess. Add `--agent claude-code` (repeatable) to install into one agent,
and `--scope user` to install into your home directory instead of this
repository. The default scope is the project — nothing is written under `~`
unless you ask.

### What it writes

| Host | Skills | Sub-agents | MCP | Settings |
| --- | --- | --- | --- | --- |
| Claude Code | `.claude/skills/` | `.claude/agents/` | `.mcp.json` | `.claude/settings.json` |
| Codex | `.agents/skills/` | `.codex/agents/*.toml` | `.codex/config.toml` | `.codex/config.toml` |
| GitHub Copilot | `.github/skills/` | `.github/agents/*.agent.md` | `.mcp.json`, `.vscode/mcp.json` | — |
| Cursor | reads Claude's | reads Claude's | `.cursor/mcp.json` | — |

`AGENTS.md` gets a managed block too — Codex, Copilot and Cursor read it, and
Codex never reads `CLAUDE.md`.

The installer's own state — the lock file recording what it wrote — goes to
`var/sw-ai-sdk/harness.lock.json`. A Shopware project already ignores the whole
of `var/` through the `shopware/core` Flex recipe (`/var/*`) and already keeps
its machine-local state there, so the repository root stays clean and **no
`.gitignore` line is written at all**. A root with no `var/` — `--scope user`
under your home directory, or a checkout that is not a Shopware project —
falls back to `.sw-ai-sdk/` and gets the managed `.gitignore` line as before.
An install recorded at the old path is moved on the next `install`, which also
takes back the `.gitignore` line it no longer needs; nothing is reinstalled and
no declined rule is forgotten.

### What it will not do

- **It never overwrites a file it did not install.** A file already at one of
  these paths that differs from ours is reported as a conflict and left alone.
- **It never overwrites your edits.** Once installed, a file you change is
  reported as drift and skipped on every later run.
- **It never removes or loosens an existing rule.** Permission lists are merged.
  A rule you delete after install is remembered as declined and never re-added.
- **It never rewrites a config with comments.** A JSONC `.vscode/mcp.json`
  becomes a manual step with the exact snippet, rather than losing your notes.
- **It writes atomically.** Every file is written to a temporary file and
  renamed, so an interrupted run cannot truncate your settings.

Undo everything with:

```bash
npx -y @execuro-sw-ecosystem/sw-ecosystem-agentic-harness@latest uninstall --yes
```

It removes exactly what the lock file at `var/sw-ai-sdk/harness.lock.json` records,
keeps anything you hand-edited, and tells you what it kept.

### From a skill

`sw-setup` is a stub: it runs `status --json`, renders the table, asks once,
and runs `apply --yes --json`. A skill always passes `--json`; the bare
commands print the human summary. It deliberately restates none of the
protocol, because an installed skill file goes stale and the CLI does not.
Anything that needs the protocol runs:

```bash
npx -y @execuro-sw-ecosystem/sw-ecosystem-agentic-harness@latest guide
```

## Keeping it up to date

Three things update on different schedules.

| What | How it updates |
| --- | --- |
| This package — skills, sub-agents, permission rules, MCP registrations | `npx -y @execuro-sw-ecosystem/sw-ecosystem-agentic-harness@latest install` |
| The MCP servers (`ShopwareDevKnowledgeBase`, `playwright`) | By themselves. They are registered as `@latest`, so your agent fetches the newest build the next time it starts one. Nothing to run. |
| Specs Editor, Tender Discovery Tool | `sw-setup` does, by re-running each package's own `install-skill` at `@latest` — see below. |

### The optional editors

They are installed, updated and removed by the `sw-setup` skill, not by this
CLI, and there is no version to match against this package:

```bash
npx -y @execuro-sw-ecosystem/sw-specs-editor@latest install-skill --target <skills dir>
npx -y @execuro-sw-ecosystem/sw-tender-discovery-tool@latest install-skill --target <skills dir>
```

- `sw-specs-editor` backs the `--editor` flag on `sw-design-requirements` and
  `sw-design-solution`.
- `sw-tender-discovery-tool` backs the `--editor` flag and the `.xlsx` import
  on `sw-discover-tender`.

`<skills dir>` is the `skills_dir` this CLI reports for that agent in
`status --json`. Re-running the same line is the update — `@latest` plus the
editor's own "already current" path makes it idempotent — and
`uninstall-skill` with the same `--target` removes it. Nothing needs to be
re-run here afterwards.

Re-running `install` is safe at any time: it rewrites only what it owns,
leaves anything you hand-edited alone (reported as drift), and records the new
version in the lock file. It prints one line when there was nothing to change.
Restart your coding agent afterwards — every host reads its configuration at
startup.

`@latest` matters. Without it, `npx` can reuse a copy already in its cache or
in this project's `node_modules`, so you would silently keep running the
version you first installed.

To look before you change anything: `... @latest status` reports
`installed_version`, any drift, and each agent's `skills_dir`. It writes
nothing.

## Prerequisites

| Requirement | Why | Check |
| --- | --- | --- |
| `shopware-cli` ≥ 0.16 | Every `bin/console` call and every build the agents run goes through it | `shopware-cli --version` |
| A running dev environment | `shopware-cli project console` proxies into the `web` container; without it you get `service "web" is not running` | `shopware-cli project dev` |
| Node ≥ 20 | The MCP servers and the editor tools run through `npx` | `node -v` |

PHP on the host is **not** required. The agents never call `php` or
`bin/console` directly, and never call webpack or vite directly — the storefront
ships both bundler configs and only the CLI knows which one applies to a given
version.

## Configuration

The installer writes these; `sw-setup` reports on them. Both are covered by
`apply --yes` above, so this section is what is being installed and why, not a
second step to run.

- the permission rules below, into `.claude/settings.json` (Claude Code) or
  `.codex/config.toml` (Codex);
- the `playwright` and `ShopwareDevKnowledgeBase` MCP registrations, with the
  `--project-wiki` path resolved for this machine — Codex performs no variable
  expansion, so it cannot be left as a placeholder;
- `sandbox.network.allowLocalBinding`, which the Specs Editor and Tender
  Discovery Tool loopback servers need.

The package's own `mcp.json` carries only `playwright` — it is the portable
manifest checked by `claude plugin validate`, not what gets installed. Both
servers are written into each host's own MCP config (`.mcp.json`,
`.codex/config.toml`, `.vscode/mcp.json`, `.cursor/mcp.json`) at `apply` time,
from `content/mcp-servers.json`.

### The `@latest` exception

`playwright` and `ShopwareDevKnowledgeBase` are registered as `@latest`; every
other pinned thing in this package is pinned exactly. That is deliberate: a
browser driver and a documentation corpus both ship stale if pinned, and
staleness there is a worse failure than a version drifting under you.

### The permission rules

```json
{
  "permissions": {
    "deny": [
      "Edit(vendor/**)",
      "Edit(public/theme/**)",
      "Edit(public/bundles/**)",
      "Edit(custom/**/Resources/app/storefront/dist/**)",
      "Edit(custom/**/Resources/public/**)",
      "Bash(shopware-cli project ci*)"
    ],
    "allow": ["Bash(grep *)"]
  }
}
```

Why each group:

- **`vendor/**`** — an agent finds the "real" block fastest in core and can
  patch it there. Core edits are silently lost on the next `composer update` and
  break every other extension. The correct move is always `sw_extends` from
  `custom/plugins/<Name>/src/Resources/views/…`.
- **`public/theme/**`, `public/bundles/**`, `**/dist/**`, `**/Resources/public/**`**
  — compiled output. Editing it looks like it works and is overwritten by the
  next `theme:compile` or asset build.
- **`Bash(shopware-cli project ci*)`** — `project ci` is a CI build step; run
  against a working tree it deletes source files.

Do not add matching `Write(…)` entries. File-permission checks match on
`Edit(path)` rules only, and an `Edit(…)` rule already covers every
file-editing tool — `Write`, `Edit`, `MultiEdit`, `NotebookEdit`. A
`Write(path)` deny rule is inert and Claude Code warns about it on every start.

If your team uses enterprise managed settings, put the same `deny` array there
instead — it then applies across every repo without per-repo commits.

## Verifying the installation

```bash
# 1. the install is complete and undrifted
npx -y @execuro-sw-ecosystem/sw-ecosystem-agentic-harness@latest status

# 2. the toolchain the agents call actually exists
shopware-cli project console --help
shopware-cli project storefront-build --help
shopware-cli extension validate --help

# 3. the deny rules are live — ask the session to edit any file under
#    vendor/shopware/storefront/Resources/views/ and confirm it is blocked
```

`status` reports `state: "ok"` when every host is installed and nothing has
drifted. A second `apply --yes` is the other check: it must report everything
as `unchanged` and rewrite nothing.

Then run one real task: ask `sw-storefront-developer` for a trivial storefront
change (for example a `data-testid` on the header logo block). A correct report
contains the Locate proofs (template path, block name and the file it was found
in, other bundles providing that path), a `lint:twig` result, and a Playwright
assertion that the attribute appears in the rendered HTML. If any of the three
is missing, the configuration above is incomplete.

## What the agents do differently once configured

These are the behaviours the configuration above switches on:

- **Locate before writing.** No `{% block %}` is written until the template path
  is confirmed on disk, the block name is confirmed *in that file* (block names
  are not unique across the storefront), every other bundle providing the same
  relative path is listed, and — when the dev env is up — `debug:twig` has
  printed the matched and overridden files.
- **Lint, build, render as a gate.** `shopware-cli project console lint:twig
  <file>` after every Twig edit; `shopware-cli extension validate --full --only
  eslint,stylelint` after SCSS/JS; then cache/theme/`storefront-build`; then a
  render assertion. A `sw_extends` with a wrong path or a non-existent block
  name is a **silent no-op** — only the render assertion catches it.
- **Correct inheritance model.** `@Storefront` < `@Plugins` < one active-theme
  slot, `theme.json` `views` reordering, the silent two-bundle conflict, and
  never targeting your own namespace.

## Working on the package

```bash
# regenerate every host adapter after editing an agent or a skill
npm run gen

# what CI checks
npm run gen:check
npm test                        # the full suite, zero dependencies
node scripts/check-pack.mjs     # the tarball matches the files allow-list
claude plugin validate .claude-plugin/plugin.json --strict
claude plugin validate .claude-plugin/marketplace.json --strict
claude plugin validate skills --strict
claude plugin validate agents --strict
```

`claude plugin validate <dir>` resolves a directory to one manifest and returns
`contents: []`, so it is not a sufficient gate on its own — hence the four
explicit targets.

`scripts/` is developer tooling, run by hand and by CI. It is not in the
published tarball and never runs on a user's machine.

### The plugin manifests

`plugin.json`, `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`
are kept valid in CI although nothing reads them today. Distribution is the
installer, not a plugin marketplace. **The marketplace manifest in this
repository is development-only.**

### Every `SKILL.md` is capped at 8 KB

Codex's effective skill-body limit is the smallest of the four coding agents', so it is
the budget every skill is written to. Overflow lives in `reference/*.md` beside
each `SKILL.md`, loaded on demand. A test enforces the cap, so the gate is
mechanical rather than a review habit.

## Troubleshooting

| Symptom | What it means | What to do |
| --- | --- | --- |
| `state: "conflict"` | A file we did not install already sits at that path. It is never overwritten. | Move or delete the existing file, or `--agent`-scope the run away from it, then re-run `apply`. |
| `state: "drift"` | You (or something else) edited a file this installer wrote. It is left alone on every later run. | Nothing to fix — this is by design. Re-run `status` to confirm it is the only thing reported. |
| A manual step for `.vscode/mcp.json` | That file is JSONC (comments or trailing commas). Rewriting it would destroy your notes, so it is never touched automatically. | Add the printed snippet to `.vscode/mcp.json` yourself, under the `servers` key. |
| `.codex/` reported read-only | Codex's default workspace-write sandbox makes `.codex/` and `.agents/` read-only from inside a Codex session. | Run the installer from a plain shell, not from inside Codex. |
| A manual step for `[agents]` in `.codex/config.toml` | An unfenced `[agents]` table already exists. TOML forbids a duplicate table header, and the installer never edits lines it did not write. | Add `max_concurrent_threads_per_session = 4` to your existing `[agents]` table by hand. |
| An MCP server that will not start after install | Usually a stale or unpublished package version, or a registry/network problem reaching npm. | Run the server's `npx` command directly (see the registration in your host's MCP config) to see the real error; `npm i -D` the package first if the registry needs auth. |

## Licence

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Execuro UG
(haftungsbeschränkt).
