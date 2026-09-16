# Set up the wiki (step 0, conditional)

Bootstraps `docs/project-wiki/` from `reference/scaffold/` in this skill's directory. Runs only on the two triggers below — a normal documentation run over an existing wiki never enters this file.

Non-destructive by design: it only creates files that do not exist. A file already on disk — a hand-edited `_config.yml` included — is never overwritten, never refreshed to the scaffold version.

## Triggers and modes

| Trigger | Mode | Ends with |
|---|---|---|
| `--setup` in the arguments, no `docs/project-wiki/` | **init** — ask §2, write the baseline | Report §7, then stop. Documentation is a separate run |
| `--setup` in the arguments, wiki exists | **repair** — recreate missing manifest files, drift check | Report §7, then stop |
| No `--setup`, no `docs/project-wiki/` | **init** — ask §2, write the baseline | Report §7, then continue at step 1 of `SKILL.md` |
| No `--setup`, wiki exists | not entered at all | — |

Questions (§2) are asked by the main run, before the sub-agent is spawned: a sub-agent has no interactive channel and cannot ask them. Only the file writing (§5) is delegated.

## 1. Detect

`Glob docs/project-wiki/**` and compare against the manifest (§3). Three outcomes:

- No `docs/project-wiki/` at all → **init**, flavor not yet chosen.
- Directory exists, some entries missing → **repair**.
- All entries for the wiki's own flavor present → nothing to create; drift check (§6) only.

On repair the flavor is never asked — derive it: `docs/project-wiki/_config.yml` present → Jekyll, absent → Vanilla. That derivation is also what the content steps mean by "the Jekyll flavor" (the Liquid ADR table in `adr/index.md`).

## 2. Questions (init only)

Asked once ever per wiki with a structured question tool if you have one (Claude Code: `AskUserQuestion`; Codex: `request_user_input`), in **two calls, never one**:

- **Call 1 — question 1 on its own.** Wait for the answer.
- **Call 2 — questions 2 and 3 together, and only when the answer to question 1 was Jekyll.** On Vanilla there is no second call at all: the flavor is the only answer needed.

Questions 2 and 3 exist solely to fill `_config.yml`, which the Vanilla flavor does not have. Never put them in the same call as question 1 — no structured question tool can make an option list conditional on another answer in the same call, so a single call asks every user to pick a GitHub Pages deployment style, `baseurl` and all, before anyone has established that the wiki is a Jekyll site.

- **Question 1 — "docs/project-wiki/ does not exist yet — set it up as a Jekyll/GitHub Pages site or a plain Markdown wiki?"**
  - Option 1, label "Jekyll / GitHub Pages (Recommended)": adds `_config.yml`, so pages render as a themed site with left sidebar navigation and search (Just the Docs, via `remote_theme:`), plus a Liquid-generated ADR table on top of the hand-maintained ADR index; ready to publish via GitHub Pages or `jekyll serve`.
  - Option 2, label "Vanilla / plain Markdown": no `_config.yml`, no Liquid; every page is plain Markdown, browsable anywhere with no build step.
- **Question 2 — "How will the wiki be published?"** (Jekyll only; decides `baseurl`, see §4)
  - Option 1, label "Its own repository (Recommended)": this folder becomes a repository root, Pages serves it from the branch root, `baseurl` is `/<repo>`.
  - Option 2, label "From this repository, /docs branch deploy": GitHub Pages reads `_config.yml` only from the Pages source root, so a nested wiki renders **unthemed**; `baseurl` stays empty and the README's setup B applies.
  - Option 3, label "GitHub Actions build": a workflow points a Jekyll build at this folder; `baseurl` stays empty.
  - Option 4, label "Not decided yet": `baseurl` is filled from the detected repository per §4 — the project-site default, which is what a first publish almost always needs; the comment above it says when to blank it.
- **Question 3 — "Site title?"** — options: the default `Shopware Project Wiki` (recommended), or the detected project name (§4) followed by " — Project Wiki". Free text via *Other* overrides both.

Nothing else is asked. The wiki always lives at `docs/project-wiki/` — the path is fixed across every page, rule file and template in this skill.

## 3. Manifest — the expected tree

Source files live in `reference/scaffold/` (shared root) and `reference/scaffold/vanilla/` (Vanilla-flavor overlay); targets are relative to `docs/project-wiki/`. 16 files for the Jekyll flavor, 15 for Vanilla (no `_config.yml`).

| Scaffold path | Target path | Required | Flavor |
|---|---|---|---|
| `README.md` (or `vanilla/README.md`) | `docs/project-wiki/README.md` | yes | overlay (both, content differs) |
| `index.md` (or `vanilla/index.md`) | `docs/project-wiki/index.md` | yes | overlay (both, content differs) |
| `_config.yml` | `docs/project-wiki/_config.yml` | Jekyll only | jekyll-only |
| `adr/index.md` (or `vanilla/adr/index.md`) | `docs/project-wiki/adr/index.md` | yes | overlay (both, content differs) |
| `baseline/tech-stack.md` | `docs/project-wiki/baseline/tech-stack.md` | yes | both |
| `baseline/glossary.md` | `docs/project-wiki/baseline/glossary.md` | yes | both |
| `domains/index.md` | `docs/project-wiki/domains/index.md` | yes | both |
| `domains/platform/index.md` | `docs/project-wiki/domains/platform/index.md` | yes | both |
| `domains/platform/extensions-inventory.md` | `docs/project-wiki/domains/platform/extensions-inventory.md` | yes | both |
| `domains/platform/customization-guidelines.md` | `docs/project-wiki/domains/platform/customization-guidelines.md` | yes | both |
| `domains/platform/configuration.md` | `docs/project-wiki/domains/platform/configuration.md` | yes | both |
| `domains/platform/logging.md` | `docs/project-wiki/domains/platform/logging.md` | yes | both |
| `domains/platform/debugging.md` | `docs/project-wiki/domains/platform/debugging.md` | yes | both |
| `domains/platform/environments-and-deployment.md` | `docs/project-wiki/domains/platform/environments-and-deployment.md` | yes | both |
| `guidelines/index.md` | `docs/project-wiki/guidelines/index.md` | yes | both |
| `guidelines/documentation-guidelines.md` | `docs/project-wiki/guidelines/documentation-guidelines.md` | yes | both |

Business domains (`domains/<slug>/`), feature pages, and ADR records are **not** part of the manifest — later steps create them from the templates, for features that actually exist. This file never invents an example domain or feature page.

## 4. Values to resolve (init and repair)

Detected, not asked — show them in the announce line so the user can object:

| Placeholder | How to read it |
|---|---|
| `{{PROJECT_NAME}}` | `Read composer.json` → top-level `"name"`. If it starts with `shopware/` (e.g. `shopware/production`) or is absent → use the repository folder name (`basename` of the repo root). |
| `{{SHOPWARE_VERSION}}` | `grep -n -A3 '"name": "shopware/core"' composer.lock` → the `"version"` line; if no `composer.lock`, `Read composer.json` → `require."shopware/core"` constraint. Normalise: strip `^ ~ v`, keep the first three numeric segments (`6.7.13.0` → `6.7.13`, `~6.6.10.0` → `6.6.10`, `v6.7.13` → `6.7.13`, `^6.7` → `6.7`). Used as `Shopware <X.Y.Z>`. |
| `{{DATE}}` | Today, `YYYY-MM-DD`. |

Replace exactly these three tokens and nothing else — the Jekyll flavor's `adr/index.md` contains Liquid `{{ p.date }}` expressions that must survive untouched.

Two Jekyll-only values come from the §2 answers and are edited into `_config.yml` after substitution:

- `title:` — the answer to question 3.
- `baseurl:` — **defaults to `"/<repo>"`, not to empty.** An empty `baseurl` on a GitHub Pages project site makes every theme asset 404: the navigation still renders, the build still succeeds, and the site is served as unstyled HTML with no error anywhere. Empty is therefore the unsafe default and is used only where it is provably right.

  Derive `<repo>` from `git remote get-url origin` (basename, `.git` stripped) and resolve in this order:

  | Case | `baseurl` |
  |---|---|
  | A remote exists and `<repo>` is **not** `<org>.github.io` — a project site | `"/<repo>"` |
  | `<repo>` is `<org>.github.io` — a user/org site served at the domain root | `""` |
  | Question 2 answered "GitHub Actions build" | `""` |
  | No git remote at all | `""`, and the report says it must be set to `/<repo>` once the wiki is published |

  When the wiki is still nested inside the project repository, the remote found here is the *project's*, not the wiki's — write the value it implies, and add the report line that `baseurl` has to be revisited once the wiki gets its own repository.

  State the resolved value in the announce line either way, so it is visible rather than implicit.

## 5. Write the baseline (delegated)

Spawn **one** `general-purpose` agent via the Agent tool. Everything it needs goes in the brief — it asks nothing and decides nothing:

- mode (init or repair) and the exact list of target paths to write (missing ones only, on repair);
- the flavor, and per row which source file to read: `README.md`, `index.md`, `adr/index.md` come from `reference/scaffold/vanilla/<path>` on Vanilla, otherwise from `reference/scaffold/<path>`; `_config.yml` is written on Jekyll only; the other 12 always come from the shared `reference/scaffold/<path>`;
- the three resolved token values, and the `title` / `baseurl` values for `_config.yml`;
- the rules: read → substitute the three tokens → write; never overwrite an existing file; never touch `domains/<business-domain>/`, feature pages or ADR records; never write outside `docs/project-wiki/`; leave Liquid expressions untouched;
- what to return: the created/kept table of §7, nothing else.

Announce the run in one line before spawning, naming the flavor and the detected values: "docs/project-wiki/ does not exist — initialising the wiki (Jekyll / GitHub Pages, acme/webshop, Shopware 6.7.13)."

## 6. Drift check (`guidelines/documentation-guidelines.md` already present)

Skip when `guidelines/documentation-guidelines.md` was created in this run. Otherwise `Read` both `docs/project-wiki/guidelines/documentation-guidelines.md` and `reference/scaffold/guidelines/documentation-guidelines.md`; ignore the lines `last_synced:` and `verified_against:` and the three placeholder tokens (compare by reverse-substituting the resolved values, or by dropping those lines). If the wiki copy still differs in rules or wording → do **not** overwrite; record "documentation guidelines drift" for the report (one line, which `##` section differs). The wiki copy stays authoritative for readers; the drift is information for the maintainers.

Skip any `_config.yml` comparison on Vanilla — the file legitimately does not exist there, that is not drift.

**Legacy wikis** — `docs/project-wiki/CONVENTIONS.md` exists and `guidelines/documentation-guidelines.md` does not: report "legacy CONVENTIONS.md found, not migrated" and ask once, same tool: "Migrate docs/project-wiki/CONVENTIONS.md to guidelines/documentation-guidelines.md?" — **Yes**: write `reference/scaffold/guidelines/documentation-guidelines.md` (tokens substituted, carrying over nothing from the old file) then delete `docs/project-wiki/CONVENTIONS.md`; **No (Recommended)**: leave both alone, repeat the report next run. Never delete `CONVENTIONS.md` without that explicit yes.

## 7. Report

One compact table, paths only:

```
| result | file |
|---|---|
| created | docs/project-wiki/domains/platform/logging.md |
| kept | 15 files |
| drift | docs/project-wiki/guidelines/documentation-guidelines.md (Frontmatter) |
| flavor | Jekyll / GitHub Pages · baseurl "/acme-docs" |
```

Collapse `kept` into a count; list every `created` file; add the `drift` row (with the differing section) only when §6 found one; add the `flavor` row only on init, with the `baseurl` decision after it. On `--setup` this table is the whole run's report. Otherwise it is the first line of the report in step 7 of `SKILL.md`, and the run continues at step 1.

On Jekyll, always name the resolved `baseurl` in that row, and when it was left empty add one line saying it must become `/<repo>` before the site is published as a project site — otherwise the site builds, the navigation renders, and every stylesheet 404s with no error to show for it.

## Dry-run examples

- **Empty project, no flag** (`composer.json` name `acme/webshop`, lock `6.7.13.0`, origin `git@github.com:acme/webshop-docs.git`): detect → no directory → ask §2 → Jekyll + own repository + default title → resolve `acme/webshop`, `6.7.13`, today, `baseurl: "/webshop-docs"` → announce → sub-agent writes 16 files → table: 16 created, `flavor | Jekyll / GitHub Pages · baseurl "/webshop-docs"`, no drift check (`guidelines/documentation-guidelines.md` was just created) → continue at step 1.
- **Empty project, user picks Vanilla**: the second call never happens — questions 2–3 are never shown (no `_config.yml` to configure) → 15 writes, overlay files from `reference/scaffold/vanilla/` → table: 15 created, `flavor | Vanilla / plain Markdown` → continue at step 1.
- **`--setup`, existing wiki with `domains/platform/logging.md` deleted**: repair → flavor derived from `_config.yml` → 1 write → drift check → table: 1 created, kept count, no `flavor` row → stop. Business domains, feature pages and the hand-edited `_config.yml` untouched.
- **`--setup`, complete wiki**: nothing missing → drift check only → table: N kept → stop.
- **No flag, complete wiki**: this file is never opened.
