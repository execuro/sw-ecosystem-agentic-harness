# Working document grammar

`specs/rfp-NNNN-slug-analysis.md`. The runtime (`lib/parse.mjs`, `lib/check.mjs`, `lib/apply.mjs`) owns this grammar; this file is what an agent or the skill reads to write prose sections and to recognise a well-formed document. Never hand-write section 2 or a section 4 row — `intake` and `check --write` do that.

## Frontmatter (YAML)

`state: In progress | Ready` — `intake: review | confirmed` (absent means `confirmed`; any other value is a parse error) — `regime: profile | T-shirt` — `source-sha256: { <file>: <hex> }` — `slug`, `client`, `tender-type` free text.

## Sections, fixed order

8 sections, headings exactly: `## 1. Context` — `## 2. Totals` — `## 3. Global assumptions and exclusions` — `## 4. Scope items` — `## 5. Questions` — `## 6. Integrations` — `## 7. Glossary` — `## 8. Log`. An empty section stays as the heading alone. Nothing is dropped for being empty. There is no Approach section: a platform, hosting, PSP or CMP recommendation lives in its scope item's Client Response, and the Shopware target lives in section 1's Project information table.

- Section 1 holds free prose meta first (source files, hashes, detected Shopware version/edition/plan with its evidence — `context-parameters.md`), then two subsections, always present in this order, each may have no rows:
  - `### Project information` — table `| Parameter | Value | Source |`, the 18 `PROJECT_INFO` rows in fixed order (`project-information.md`). Written by `intake` and edited by the operator (`info`); `sw-tender-editor` never writes this table.
  - `### Not taken from the source` — table `| Source | Text | Why |`, one row per skipped or removed row. Written by `intake`/`skip`/`restore`; `sw-tender-editor` never writes this table.
- Section 2 is runtime-generated between `<!-- totals:begin -->` and `<!-- totals:end -->` (`check --write`): a `Regime:` line, a table `By priority` and a table `By tab` (one row per `TABS` entry in order, rows with 0 items omitted), a total row, and a status line with the confirmed/reopened/failed/open-question/low-confidence/waiting-proposal counts.
- Section 3 has `### Assumptions` then `- <statement>` bullets, and `### Exclusions` then `- <statement>` bullets the client's document states. `sw-tender-editor` writes exclusions from the source; accepted global proposals land under Assumptions via `accept`/`assume`.
- Section 4 holds the scope items — see below.
- Section 5 holds client questions `CQ-n` and operator questions `Q-n` — see below.
- Section 6 holds the integrations the tender names. Written by `sw-tender-editor`'s `context` job.
- Section 7 is the Glossary: the client's terms. Written by `sw-tender-editor`'s `context` job.
- Section 8 is the run log: one line per run (cause, what changed), and any conflict between agent reports the architect resolved. Appended by `report` alone.

## Section 4 header, exact

`| ID | Prio | Requirement | Requirement Coverage | Confidence | Estimation | Client Response | Assumptions | Internal note | References | Status |` — client inputs first (ID, Prio, Requirement), then the working fields. An older document headed `Effort`, or with Requirement after the working fields, is read the same way (columns are matched by header name, not position) and rewritten in this order and heading on its next write.

One row per scope item, client order. A `|` inside a cell is escaped as `\|`. A cell list (Assumptions, References) is `- ` bullets joined by `<br>`. Every table sits under a `### <Tab> · <Topic>` heading (separator ` · `, U+00B7 with spaces) — one table per topic, same header. `Tab` is one of `TABS = Functional, Non-functional, Project & services`; `Topic` is the client's own grouping verbatim. Canonical render order: tabs in `TABS` order; within a tab, topics in client first-seen order; items in client order. A heading without ` · `, a Tab not in `TABS`, an empty Topic, or a duplicate item id anywhere in section 4 is a parse error.

| Column | Grammar |
| --- | --- |
| ID | Client id verbatim, any format. No id column: `<prefix>-<n>` — `prefix = sheetPrefix(topic)` (initials of the topic's words, ignoring `&`, `and`, `und`, `/`, punctuation; a word with digits contributes its first letter, uppercase, max 4 letters; a single-word topic uses its first 3 letters uppercase; a prefix collision elsewhere in the document appends `2`, `3`...). `n` counts from 1 in source order within that topic over every source row of the declared tables, skipped rows included, so a skip, a restore or a re-intake never renumbers; a restored item gets its old id back and its client-order position. Moving an item to another tab or topic never changes its id; the id is stable across intakes of the same file, never written into the client's file. |
| Requirement | The client's text, verbatim, never overwritten. |
| Requirement Coverage | One of `OOTB · Configuration · Extension · ISV · Custom · —`, or empty when not yet assessed. |
| Confidence | `high \| medium \| low`, or empty. |
| Estimation | T-shirt: `<SIZE> (<n> PD)`, `SIZE` in `XS S M L XL XXL`, OOTB is `— (0 PD)`. Profile: `<n> PD` rounded to 0.25, OOTB `0 PD`. Empty when not estimated. The report JSON key stays `effort`. |
| Client Response | Architect drafts, operator edits. |
| Assumptions | Accepted assumptions for this item, as bullets. |
| Internal note | Operator-written only; agents read it, never write it. |
| References | Agent-written: `kb: <KB page title or path>` — `project: <implementation or wiki page>` — `isv: <extension> · <vendor> · <supported versions> · <url>` — `cost: <one line, no amount>`. Runtime-written: `rejected: <statement>` — `failed: <reason>` — `reopened YYYY-MM-DD: <cause>` — `draft: <text>` (the architect's Client Response draft when it differs from a confirmed/reopened item's kept text). Never exported. |
| Status | `queued · analysing · estimated · blocked CQ-<n> · failed · confirmed YYYY-MM-DD · reopened`. |

## Section 5 blocks

```
### CQ-<n> · <item id>, <item id>
<question text>
- [ ] A — <option text> — effect: <scope effect>
- [ ] B — <option text> — effect: <scope effect>
Fallback: A
```

Answered: the chosen box is `[x]` and a line `Answered YYYY-MM-DD: <key>` follows `Fallback:`. Operator questions use `### Q-<n> · <item ids>`, same shape, options optional. A `CQ-n` needs at least two options.

## Side files

Not part of the working document; written under `specs/.rfp/<slug>/` or `specs/`. Grammar: `context-parameters.md` (version/edition/plan), `project-information.md` (the 18 keys), `assumption-catalogue.md` (proposal starting points), `estimation-model.md` (regimes, scale, profile file), `response-rules.md` (export), `client-question-rules.md` (CQ/Q wording). The runtime's own side files (`proposals.json`, `reestimate.json`, `last-run.json`, `import-map.json`) are documented with the runtime, not here.
