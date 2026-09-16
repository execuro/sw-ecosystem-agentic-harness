# Page rules

**Authority.** `docs/project-wiki/guidelines/documentation-guidelines.md` (wiki) is authoritative for reader-facing rules: frontmatter schema, status meanings, folder/surface rules, terminology. This file is authoritative for how the skill derives status and writes pages. Reader-facing rules are referenced here, not copied — when a summary below drifts from the documentation guidelines, the documentation guidelines win and this line gets fixed.

## Templates (in this skill's `reference/templates/` directory, fill them)

| Page | Template | Where |
|---|---|---|
| Feature page | `reference/templates/feature-page.md` | `domains/<domain>/<surface>/<feature>.md` |
| Domain index | `reference/templates/domain-index.md` | `domains/<domain>/index.md` (+ row in `domains/index.md`) |
| ADR (user-provided, accepted) | `reference/templates/adr.md` | `adr/YYYY-MM-DD-<kebab-title>.md` (listed by the regenerated TOC block of `adr/index.md`) |
| ADR (promoted from `specs/*-adr-*.md`) | none — per `reference/adr-promotion.md` | `adr/<date>-<kebab-topic>.md` |

Templates own the page *shape* (section order, placeholders); the documentation guidelines own the rules. Delete every `<…>` placeholder; unknown facts become `_TBD_`, never invented.

## Frontmatter (feature page — every key, no omissions)

Schema per the documentation guidelines' "Frontmatter" section. Skill-side derivation:

- `nav_order` — position within the parent domain's Features table (order the feature was added, or the position the user asks for).
- `parent` — the domain's `title` from `domains/<domain>/index.md` (exact string, case-sensitive).
- `grand_parent` — always `Domains`.
- `feature` — PRD slug without `NNNN-` (chat mode: kebab-case, 2–5 words); identical on both surface halves.
- `status` — only from the gate verdict (below).
- `extension` — plugin/app/theme name in `custom/`, or the Composer package name (`vendor/name`) when a vendor-installed extension delivers it, or `null`.
- `spec`, `prd` — the paths read, or `null` (chat mode: both `null`).
- `verified_against` — `Shopware X.Y.Z` from `composer.json` → `shopware/core`, 4th segment stripped (`"6.7.13.0"` → `Shopware 6.7.13`).
- `last_synced` — run date, set only on pages touched this run.
- `tags` — `[<domain>, <surface>]` plus `planned` / `not-built` when applicable.
- `related` — relative paths only; counterpart surface page (if it exists), `../index.md`, platform pages linked from the body.

## Status derivation (single source: `built-check.md` verdict)

| Evidence | `status` | Block |
|---|---|---|
| Code or package present **and** report with every AC `pass` | `built` | none — Status reads "`built` — verified YYYY-MM-DD (AC-1..AC-n pass)" |
| Code or package present, no report | `partially-built` | ⚠️ PARTIALLY BUILT, "verification not run" |
| Code or package present, any AC `not pass` / `partly` | `partially-built` | ⚠️ PARTIALLY BUILT, listing those ACs |
| No code, PRD and/or spec exist (after enforce) | `planned` | ⚠️ NOT BUILT |
| Nothing found (after enforce) | `not-built` | ⚠️ NOT BUILT |

"Code or package present" = a concrete artefact under `custom/` **or** an installed Composer package (`composer.lock`, `vendor/`). The block is mandatory for every status except `built`.

## Flag block (exact markup — existing pages use it)

In `## Status`, directly after the intro prose under the H1:

```
> ⚠️ NOT BUILT
>
> **What exists in the repo:** <PRD/spec paths, flags, partial code with paths>
> **What is missing:** <what sw-document-feature searched for and could not find under custom/ or vendor/>
> **Reference:** <spec AC-1..AC-n, verification report date or "verification not run">. Checked against the repo on YYYY-MM-DD.
>
> Do not describe this feature as available. Everything below is the *intended* design from the spec.
```

`partially-built` uses the same shape with the first line `> ⚠️ PARTIALLY BUILT`, "What is missing" listing the failing/unverified ACs (with the report's note) or the missing artefacts, and the last line "Only the parts listed as existing are available." The *Developer* heading becomes `## Developer (planned)` for `planned`/`not-built` and describes the *intended* location from the spec; for `partially-built` it describes what exists and marks intended parts "(planned)".

## Decision Log (trailing section, per the documentation guidelines)

`## Decision Log` is the **last** section, after *Related*. One line per user decision, override, or status change the page cannot explain by itself, format `YYYY-MM-DD — <what and who>`. Append only — never rewrite earlier lines; omit the section when it would be empty. Lines this skill writes:

- `YYYY-MM-DD — User enforced documentation although the built-check found no code`
- `YYYY-MM-DD — Status changed <old>→<new> by built-check (<one-line evidence>)`
- `YYYY-MM-DD — Domain set to <domain> by user (ambiguous between <a> and <b>)`
- `YYYY-MM-DD — <topic>: <decision> (user)` for any other answer from a structured question tool (Claude Code: `AskUserQuestion`; Codex: `request_user_input`)
- `YYYY-MM-DD — ADR <title> recorded as provided by user` / `YYYY-MM-DD — ADR <id> promoted from <specs path>`

An answer is first rewritten into the section it affects (intro prose, Business user, Developer); the log line is the only trace of the question. Never paste the question or the raw reply.

## Shape and length

- Sections in template order: title → intro prose (no "Summary" heading) → Status → Business user → Developer → Related → (Decision Log) → footer line.
- Intro is 1–2 sentences on **this surface only**, directly under the H1, no bold labels; the why is a link to `../index.md#features`.
- No paragraph over 4 lines; prefer bullets. Roughly one screen per section — if Developer needs more, the spec is the place and the page links to it.
- One topic per page; two features → two pages. Relative links only; folder landings are `index.md`, linked explicitly.
- No `layout` key (applied site-wide from `_config.yml` `defaults:`). `nav_order`, `parent`, `grand_parent` ARE required — see the frontmatter derivation above.
- Maintenance metadata (scope, last synced, verified against, re-sync) is a single italic line at the *bottom* of the page, never a bold header block under the H1.

## Domain and surface

Canonical domain list, feature→domain rules, surface assignment, and `platform` boundaries: `domain-guidelines.md`. Two domains still tie → ask (same tool) with the candidates and log the answer. Never invent a domain slug; a new domain is created from the domain-index template and rowed in `domains/index.md` and the wiki `index.md` domain map.

## Business user / Developer content

Business user: only what the actor does or sees on this surface — menu paths, fields, states, error behaviour, ACL/role names. No rationale (index "Why" column), no implementation.

Developer, bullets with fixed labels: **Where** · **Extension points used** · **Decisions** (link ADRs) · **Config** (link `../../platform/configuration.md`) · **Debug/observe** (link `../../platform/logging.md`, `../../platform/debugging.md`) · **Gotchas**. Backend-only work is filed here under the triggering surface with one bullet saying so. What not to document: documentation guidelines "Reference code, don't restate it" (point to paths; link Shopware docs via the ShopwareDevKnowledgeBase MCP).

Where decisions go: documentation guidelines "Where decisions go". Skill rule — every unmarked decision (PRD §9 items, spec Decision Log lines, chat decisions) → Developer › Decisions; business rule → index "Why" column. Never `adr/` on the skill's own judgment.

## ADRs

The skill never invents, decides on, or creates an ADR by itself. Exactly two inputs yield one:

1. **WIP ADR file under `specs/`** — `specs/NNNN-slug-adr-<topic>.md` written by `sw-design-solution`; the spec's `[adr] <path>` Decision Log lines and Dependencies table point at it. Promoted once into `adr/` by `adr-promotion.md` when `accepted` and its required changes exist in the code; `docs/` is then the source of truth and the specs copy may be removed by people.
2. **Provided by the user in chat as accepted** — title + context/decision/consequences, or an explicit "record this as an ADR" for a named decision. Written from `templates/adr.md` verbatim in structure, `status: accepted`, `area` = domain | `platform` | `process`, file `adr/YYYY-MM-DD-<kebab-title>.md`, no `promoted_from` key. Not stated as accepted → tell the user to file it under `specs/` as WIP; nothing is written.

Both get the matching Decision Log line above on the feature page and a Developer › Decisions link (`adr-promotion.md` §5); both are listed by the regenerated TOC block in `adr/index.md`. Anything the skill *thinks* might deserve an ADR (new project-specific domain, domain split, a spec `[potential ADR]` left unextracted) is not written and not asked about mid-run — it is listed in the report as "ADR candidates (not created)"; the user can provide one later.

## Project guidelines

Triggered when a person states a project coding rule directly, or step 5b promotes an ADR whose Decision/Consequences change one — never on the skill's own judgment or "this looks like a rule".

1. Detect the Shopware major from `composer.json`/`composer.lock` (same derivation as `verified_against`), e.g. `6.7`.
2. Identify the target platform file by name (`architecture-`, `code-`, `qa-guidelines.md`, or a surface file `be-`/`fe-`/`admin-`/`storefront-…guidelines.md`) from what the rule is about.
3. `read_doc platform/guidelines/<version>/<file>.md` first — never write a `merge:` anchor that was not read from this call. Pick the real heading anchor(s) the rule acts on.
4. Write or edit `docs/project-wiki/guidelines/<file>.md` from `templates/guideline.md` (no version folder — project guidelines always apply to the installed Shopware version; `verified_against` records it): one `## <heading>` per anchor, `merge:` entry per section (`override`/`extend`/`waive`), `adr:` when the source is a promoted ADR. An anchor not found in the platform file is an addition — no `merge:` entry needed, the section is appended.
5. Update `docs/project-wiki/guidelines/index.md`: regenerate the block between `<!-- guidelines-toc:start -->` / `<!-- guidelines-toc:end -->` from every file under `guidelines/` except `index.md`, one row `| <file> | <one-line rule summary> |` per file, newest `last_synced` first; text outside the markers stays untouched.
6. No built-check gate — a guideline is a rule the project has decided on, not a feature to verify as built. `status`/⚠️ blocks do not apply.
7. Report line: file written/updated, anchors and modes, ADR cited (if any).

## Side pages touched per run

- `domains/<domain>/index.md` feature row (see `source-mapping.md`).
- `domains/platform/extensions-inventory.md` — a row when the feature introduces an extension not listed.
- `adr/index.md` — the `<!-- adr-toc:start -->`…`<!-- adr-toc:end -->` block is regenerated every run from all pages under `adr/` (`adr-promotion.md` §4); nothing outside the markers is touched.
- `guidelines/index.md` — the `<!-- guidelines-toc:start -->`…`<!-- guidelines-toc:end -->` block is regenerated whenever the "Project guidelines" route (above) writes or edits a file under `guidelines/`.
- `docs/project-wiki/baseline/glossary.md` — a row when the source introduces a new project term.
- Terminology on every touched page: documentation guidelines "Terminology" + the glossary's "Terms we do not use".

## Link check (end of every run)

For each touched page (promoted ADRs and the TOC block included), extract every relative target (`[..](path)` and `related:` entries, `#anchor` stripped) and resolve it with `test -e` from the page's directory, e.g. `grep -o '](\.[^)#]*' page.md | sed 's/](//'`. Templates, absolute paths, and URLs into this repo are broken by definition. Fix what you can (wrong `../` depth, wrong surface folder), drop what has no target, and list anything unresolved in the report.

## Touch discipline

Update an existing page for the same feature/surface in place; never create a second file. If its `status` contradicts the gate verdict, the gate wins (status, block, Decision Log line). Set `last_synced` only on pages touched this run. Never edit `specs/`.
