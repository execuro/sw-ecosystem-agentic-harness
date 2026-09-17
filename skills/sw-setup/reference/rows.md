# Readiness rows

Twelve environment rows. Each: check (read-only), what "ticked" means, the fix
(only run on approval, in this order), and which skills the row blocks when
unticked. Host configuration files (`.mcp.json` entries, `.gitignore` lines,
permission grants) are not rows here — the installer CLI owns them and
reports their state in its own `status`/`plan` output; see `SKILL.md`.

When that `status` call reports no install at all (no lock file, so no
recorded hosts), the installer CLI's `apply --yes`/`install` has no `--host`
to reuse and, run from this skill, no terminal to ask on — it would exit 2.
Do not pass a guessed `--host`. Report this to the user instead: the first
install must be run by them directly in a terminal, e.g.
`npx -y @execuro-sw-ecosystem/sw-ecosystem-agentic-harness@latest install`,
which then either takes their `--host` or prompts them interactively. Re-run
this skill's `status` check afterwards — every later `apply --yes` reuses the
hosts that first run recorded, and this skill can call it directly again.

## 1. vendor/

- **Check:** `vendor/shopware/core` exists, `composer.lock` exists,
  `vendor/bin/phpunit` exists — file presence only, never a host
  executable-bit check: composer runs inside the container, so the file can
  land `-rw-------` on the host and still run fine inside the container
  (guideline §6.2).
- **Ticked:** all three present; report the `shopware/core` version from
  `composer.lock`.
- **Unticked:** the printed line names the specific missing path(s), not just
  the row — e.g. a tree built `--no-dev` has `vendor/shopware/core` and
  `composer.lock` but no `vendor/bin/phpunit`, so the line reads
  `vendor/ — vendor/bin/phpunit missing (tree built --no-dev)`. This is the
  same row and the same fix below, offered inside step 3's single question
  like any other row.
- **Fix:** `docker compose exec web composer install --no-interaction`
  (guideline §6.1 — "a vendor tree built with `--no-dev` has no
  `vendor/bin/phpunit`"). Runs inside the `web` container; if it is not
  running, stop and report that — sw-setup never starts the stack itself.
- **Blocks:** `sw-design-solution`, `sw-implement-feature`,
  `sw-verify-feature` (and its architecture/code-quality/ac-tests sub-skills).

## 2. Node

- **Check:** `node --version`; parse major and minor.
- **Ticked:** ≥ 20. Warn (do not fail) when < 20.15: the Tender Discovery Tool
  needs `zlib.crc32` for the xlsx write-back, so `export --xlsx` will not run
  below 20.15 while everything else does.
- **Fix:** none — host tool. Report the install advice only: use the
  project's documented Node version manager, or https://nodejs.org/. Never
  install it globally on the user's behalf.
- **Blocks:** the Specs Editor, the Tender Discovery Tool, the KB MCP server
  (the knowledge-base MCP), the acceptance-test project,
  Playwright.

## 3. Visual editors (optional)

The Specs Editor and the Tender Discovery Tool are **optional add-ons**, not
part of this plugin. The installer CLI installs them itself, per host — this
row never runs an extra component's own install command.

So this row never blocks readiness. It asks.

- **Check:** read `extra_components[]` from the `status` output the skill already
  ran in step 1 — each entry's `available`, `installed_for` (the hosts it is
  placed in), and `install` (the npm command, when missing). Never probe a
  path and never run an extra component by hand; the CLI owns both.
- **Ticked:** `[x]` when an extra component's `available` is true and
  `installed_for` includes this host; `[-]` when the user has declined it.
  Only an unanswered offer shows `[ ]`, and even then it does not hold the
  table open — report it as optional and move on.
- **Fix:** offer each missing extra component inside step 3's single question,
  naming what it buys, not how it works: "Specs Editor — review a PRD or
  tech spec on a live page, with notes, question answers and diagrams.
  Install?" — and "Tender Discovery Tool — read a client tender workbook,
  confirm its column mapping and review the analysis on a live page.
  Install?" On yes, for each accepted one: `npm i -D <package>@0.1.0` (the
  `package` field from `extra_components[]`), then re-run

  ```
  npx -y @execuro-sw-ecosystem/sw-ecosystem-agentic-harness@latest apply --yes
  ```

  which places one `SKILL.md` per extra component into each selected host's own
  skills directory, records it, and removes it again on uninstall. **Never
  run the extra component's own `install-skill`** — with no `--target` it
  defaults to Claude Code's own skills directory, wrong for a Codex, Copilot
  or Cursor install. Needs the Node row ticked.
- **On no:** record the decline and do not re-ask on the next run. `apply`
  keeps reporting that skill as `skipped` — the intended steady state, not a
  fault. `--editor` on `sw-design-requirements` / `sw-design-solution` /
  `sw-discover-tender` then stops with one line naming this skill.
- **Blocks:** Specs Editor missing → `sw-design-requirements --editor`,
  `sw-design-solution --editor`, the `sw-specs-editor` skill. Tender
  Discovery Tool missing → `sw-discover-tender --editor` and its `.xlsx`
  import, plus the `sw-tender-discovery-tool` skill.

## 4. shopware-cli

- **Check:** `command -v shopware-cli`.
- **Ticked:** present on `PATH`.
- **Fix:** none — host tool. Report the install advice only: Homebrew cask
  `shopware-cli` (verified in `sw-verify-feature-architecture`, step 4).
  Never install it on the user's behalf.
- **Blocks:** `sw-verify-feature-architecture`, `sw-verify-feature-code-quality`
  (static analysis, Twig linters), `sw-implement-feature` (per-AC
  `extension fix`/`extension validate`).

## 5. KB MCP

- **Check:** `mcp__ShopwareDevKnowledgeBase__kb_status` reports the `platform`
  layer as `implemented`. (Whether the `ShopwareDevKnowledgeBase` entry
  exists in `.mcp.json` is installer configuration, not checked here — the
  installer CLI's `status`/`plan` output covers it.)
- **Ticked:** `platform` `implemented`.
- **Fix:** the entry itself is installed by the installer CLI (`apply`), not
  by this skill. The corpus ships already built, inside the
  `@execuro-sw-ecosystem/sw-dev-knowledge-base-mcp` package — nobody
  consuming this package builds one. If `platform` is not `implemented`,
  check the registration first: does `.mcp.json` list the
  `ShopwareDevKnowledgeBase` entry, and is `sw-dev-knowledge-base-mcp`
  current? The fix is to re-run the installer CLI's `apply --yes`, or bump
  the `sw-dev-knowledge-base-mcp` package to a version that ships the
  corpus — never build one locally.
- **Blocks:** `sw-design-requirements` (stock-behaviour lookup),
  `sw-design-solution` step 0.5/step 3 (KB grep), `sw-product-manager`,
  `sw-shopware-architect`.

## 6. Acceptance-test project

- **Check:** `tests/acceptance/package.json` exists and lists
  `@shopware-ag/acceptance-test-suite` as a dependency;
  `tests/acceptance/playwright.config.ts` exists;
  `tests/acceptance/fixtures/BaseTestFile.ts` exists.
- **Ticked:** all three present.
- **Fix (guideline §3.7, host, once):**
  ```bash
  mkdir -p tests/acceptance && cd tests/acceptance
  npm init -y && npm pkg set type=module
  npm install -D @playwright/test @shopware-ag/acceptance-test-suite dotenv
  ```
  then write `playwright.config.ts` and `fixtures/BaseTestFile.ts` from the
  templates quoted in guideline §3.7 verbatim (do not paraphrase — Playwright
  fails on a malformed config). Needs the Node row ticked.
- **Blocks:** `sw-implement-feature` (e2e authoring by `sw-qa-engineer`),
  `sw-verify-feature-ac-tests` (Playwright execution).

## 7. Playwright browsers

- **Check:** `npx playwright install --dry-run` output (or
  `~/.cache/ms-playwright`/the project-local browsers path) shows Chromium
  installed for the Playwright version in `tests/acceptance/package.json`.
- **Ticked:** Chromium present.
- **Fix:** `npx playwright install --with-deps chromium` run inside
  `tests/acceptance` (guideline §3.7). Needs the Acceptance-test project row
  ticked (the `@playwright/test` version comes from there).
- **Blocks:** `sw-implement-feature` (e2e execution), `sw-verify-feature-ac-tests`.

## 8. ATS env

- **Check:** `tests/acceptance/.env` exists.
- **Ticked:** file exists and defines `APP_URL`, `SHOPWARE_ADMIN_USERNAME`,
  `SHOPWARE_ADMIN_PASSWORD` (the names guideline §3.7's `.env.example` block
  documents).
- **Fix:** copy `tests/acceptance/.env.example` to `tests/acceptance/.env` if
  the example is missing, write it from the guideline §3.7 template first —
  then ask the user for the real `APP_URL`/admin credentials (or
  `SHOPWARE_ACCESS_KEY_ID`/`SHOPWARE_SECRET_ACCESS_KEY` as the alternative the
  template lists) with a structured question tool if one is available, or
  directly otherwise; never invent values, never print them back once
  entered. Needs the Acceptance-test project row ticked.
- **Blocks:** `sw-implement-feature` (e2e execution), `sw-verify-feature-ac-tests`.

## 9. Plugin tests, per `custom/plugins/<Name>`

- **Enumerate:** `ls custom/plugins`; one row per directory found.
- **Check per plugin:**
  - PHP: `custom/plugins/<Name>/phpunit.xml.dist` and
    `custom/plugins/<Name>/tests/TestBootstrap.php` both exist.
  - Admin JS: only if `custom/plugins/<Name>/src/Resources/app/administration`
    exists — then also require `custom/plugins/<Name>/package.json` and
    `custom/plugins/<Name>/jest.admin.config.js` (or the project's equivalent
    name, e.g. `jest.administration.config.js`).
  - Storefront JS: only if
    `custom/plugins/<Name>/src/Resources/app/storefront` exists — then also
    require `package.json` and `jest.storefront.config.js`.
- **Ticked:** the PHP pair present, plus each applicable JS pair present.
- **Fix:** scaffold the missing files from the guideline templates —
  `phpunit.xml.dist` from §3.3, `tests/TestBootstrap.php` from §3.4 (fill
  `<Name>`/`<Vendor>` from `composer.json`), Jest config(s) from §3.5 (option
  (a), plugin-local preset), `package.json` scripts block from §3.5's closing
  JSON snippet. The `npm install` steps run inside the `web` container; if it
  is not running, stop and report that — sw-setup never starts the stack
  itself.
- **Blocks:** `sw-implement-feature` (PHPUnit/Jest execution for that
  plugin's ACs), `sw-verify-feature` (and its sub-skills, for that plugin).

## 10. Project wiki

- **Check:** `docs/project-wiki/` exists.
- **Ticked:** directory present.
- **Fix:** invoke skill `sw-document-feature --setup` (Skill tool) — it asks
  its own flavour questions and writes the scaffold; do not replicate that
  logic here.
- **Blocks:** `sw-document-feature`.

## 11. `.gitignore`

- **Check:** `.gitignore` contains all six lines:
  ```
  /specs/.editor/
  /specs/.rfp/
  tests/acceptance/node_modules/
  tests/acceptance/.env
  tests/acceptance/test-results/
  var/verification-screenshots/
  ```
  (`/specs/.editor/` and `/specs/.rfp/` are already present in this project's
  `.gitignore`; check the other four independently. `.sw-ai-sdk/` is not on
  this list — the installer CLI adds that one itself.)

  Do **not** add `specs/<rfp-basename>/`. The tender tool's normalised source
  export and its `import-map.json` live there and are committed on purpose —
  they are what the analysis reads, hashes and exports from. Only the transient
  half (snapshot, proposed map) goes to the ignored `/specs/.editor/`.
- **Ticked:** all six present (exact path forms, not just a substring match
  on directory name).
- **Fix:** append whichever of the six lines are missing, each under a short
  comment naming its owner (specs-editor, sw-discover-tender, acceptance-test
  project, verify-ac-tests screenshots). Idempotent — safe to re-run.
- **Blocks:** nothing directly; unticked means the next `git status` will
  show generated/secret files as untracked.

## 12. Package updates (optional)

The KB MCP is excluded — it is registered as `@latest` and re-resolves on
every host launch, so there is nothing to update (see row 5). This row covers
only the three versioned packages: the harness itself, the Specs Editor and
the Tender Discovery Tool.

This row never blocks readiness. It folds into step 3's single question.

- **Check:** three `npm view <pkg> version` calls, each with a 10-second
  timeout — `npm view @execuro-sw-ecosystem/sw-ecosystem-agentic-harness
  version`, `npm view @execuro-sw-ecosystem/sw-specs-editor version`,
  `npm view @execuro-sw-ecosystem/sw-tender-discovery-tool version`. Installed
  versions come from three different places: the harness's from
  `installed_version` in the `status` JSON the skill already ran in step 1
  (from the lock file); the Specs Editor's from `version` in
  `node_modules/@execuro-sw-ecosystem/sw-specs-editor/package.json`; the
  Tender Discovery Tool's the same way, in its own `node_modules` path. A
  failed or timed-out `npm view` call reports "could not check" for that
  package only — never an unticked row, never an error, never a blocked run.
  No network is a normal condition, not a fault.
- **Ticked:** all three packages at their target version — the harness at
  npm's latest, each editor at the pin its own `status` output names
  (`extra_components[].version`), not at npm's latest.
- **Unticked:** one line per stale package, `installed → available` — e.g.
  `harness 0.1.1 → 0.1.3`, `Specs Editor 0.1.0 → 0.1.0 (pinned)` when current.
  An editor whose npm latest is ahead of the pin is a harness-release lag,
  not a missing update: report it, but do not offer to install that newer
  version — only a newer harness can raise the pin.
- **Fix:** update the harness first — a newer harness may carry newer pins:
  `npx -y @execuro-sw-ecosystem/sw-ecosystem-agentic-harness@latest install`.
  That command rewrites the installed `sw-setup` skill itself, so the newer
  skill takes effect on the next run — which step 3 already causes by
  re-running step 1. Re-read the new `status` output, then for each stale
  editor run the same `npm i -D <package>@<version>` shape row 3's Fix uses,
  with `<package>` and `<version>` taken from that editor's own
  `extra_components[]` entry in the re-read `status`.
- **Blocks:** nothing. Out of date is not broken.
