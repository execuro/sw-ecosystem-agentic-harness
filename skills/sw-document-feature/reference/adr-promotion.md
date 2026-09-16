# ADR promotion

ADR files under `specs/*-adr-*.md` (written by `sw-design-solution`) are **WIP** — proposed, rejected, or accepted but not yet built. `docs/project-wiki/adr/` is the single source of truth and holds **only accepted ADRs whose required changes exist in the code**. This procedure promotes a WIP ADR into `docs/` exactly once; afterwards people may remove the `specs/` copy and everything references `docs/`. Runs on every run that passes the built-check gate (never after a Stop), over **all** WIP files, not only the current feature's. Never writes to `specs/`, never overwrites a docs ADR.

## 1. Discover

- Glob `specs/*-adr-*.md`; skip files without an `id:` key (report them).
- Every `[adr] <path>` line in the spec being documented must resolve to one of those files **or** to a docs ADR with the same `id`. Neither → report `dangling [adr] links: <path>`.
- Glob `docs/project-wiki/adr/*.md` (not `index.md`) and index them by `id` — a WIP file whose `id` is already there is **already promoted**: skip, docs wins; if the specs file still exists report `promoted, specs copy can be removed: <path>`.

## 2. Decide per WIP file

| Condition | Outcome | Report bucket |
|---|---|---|
| `status` ≠ `accepted` | not promoted | `WIP ADRs: <id> (<status>)` |
| `accepted`, required changes not found | not promoted | `accepted, awaiting implementation: <id>` |
| `accepted`, required changes found (or none needed) | **promote** (§3) | `promoted: <id>` |

Built-check for an ADR: its Decision / Consequences sections name the required changes (runtime component, package, service, config key, convention). Search for them as in `built-check.md` — `custom/`, `composer.json`/`composer.lock`/`vendor/`, config — and keep the one-line evidence for the report. An ADR that needs no code (`area: process`, convention-only, or the ADR says so) counts as built.

## 3. Promote (create once)

Target: `docs/project-wiki/adr/<date>-<kebab-topic>.md` — `date` = WIP `date`, `kebab-topic` = the part of `id` after `ADR-NNNN-`. Link depth: from `adr/` a spec link is `../../../specs/…`; from `domains/<d>/<surface>/` an ADR link is `../../../adr/…` and a WIP link `../../../../../specs/…` (five levels to the repo root).

| WIP field / part | Docs ADR |
|---|---|
| `title`, `date`, `area`, `tags`, `authors`, `status` (= `accepted`) | Same keys (wiki ADR schema) |
| — | `nav_order` (next free slot under `adr/index.md`), `parent: Decision records` (added, not carried from the WIP file — WIP files under `specs/` have no nav front matter) |
| `id`, `prd`, `spec`, `owner` | Same keys, verbatim |
| its path, run date | `promoted_from: specs/NNNN-slug-adr-<topic>.md`, `promoted: YYYY-MM-DD` |
| `decision_needed_by`, HTML comment, `<…>` placeholders | Dropped (`_TBD_` is kept) |
| H1 | Verbatim, followed by one line `Promoted from specs/… on YYYY-MM-DD.` |
| `**Status:** … **Spec:** […]` meta line | Carried over; spec link rewritten to `../../../specs/…` |
| Context, Decision, Options considered, Consequences, Alignment (incl. decision-log table) | Carried over, same headings and order; condensed only where the documentation guidelines forbid (no code listings) |

Nothing else is added. Later status changes (`superseded`, `deprecated`) are made by people editing the docs ADR; the skill never touches an existing docs ADR.

## 4. Table of contents (`docs/project-wiki/adr/index.md`)

Keep the Liquid loop, where the wiki uses the Jekyll flavor, and everything outside the markers untouched. Rewrite the block between `<!-- adr-toc:start -->` and `<!-- adr-toc:end -->` every run (if missing, insert them directly under the `## Table of contents` heading, creating it after the Liquid block when absent) from all pages under `adr/` except `index.md`:

1. Summary line `N ADRs — accepted x · superseded y · deprecated z`; with zero ADRs the block contains only `0 ADRs`.
2. One `#### <area>` per area in canonical order — the domain slugs from `domain-guidelines.md` (catalogues, checkout, orders, customers, content, marketing, sales-channels, automation, settings, integrations), then `platform`, then `process`, unknown areas last alphabetically — each `| Date | ID | Title | Status | Feature |`, newest first by frontmatter `date`. Feature = `[NNNN-slug-spec](../../../specs/NNNN-slug-spec.md)`, or `—` when that path no longer exists.

The line after the block, `WIP ADRs live in specs/*-adr-*.md until accepted and built.`, is hand-maintained and stays. Example:

```
<!-- adr-toc:start -->
1 ADRs — accepted 1 · superseded 0 · deprecated 0

#### checkout
| Date | ID | Title | Status | Feature |
|---|---|---|---|---|
| 2026-08-12 | ADR-0005-net-prices | [Net prices per sales channel](2026-08-12-net-prices.md) | accepted | [0005-b2b-pricing-spec](../../../specs/0005-b2b-pricing-spec.md) |
<!-- adr-toc:end -->
```

## 5. Feature pages and edge cases

- Developer › Decisions: promoted → `[ADR-id](../../../adr/<file>.md)`; still WIP → `[ADR-id](../../../../../specs/<file>) (WIP, <status>)`.
- Page Decision Log: `YYYY-MM-DD — ADR <id> promoted from <specs path>` (only on the run that promotes).
- Two WIP files with the same `id` → promote neither, report the collision. `id` without `ADR-NNNN-` prefix → whole `id` kebab-cased as topic, report it.
- A docs ADR without `promoted_from` (user-provided, hand-written) is listed in the TOC like any other.
- Link check (SKILL step 6) covers every promoted page and the TOC block.
