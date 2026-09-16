---
title: Documentation guidelines
nav_order: 1
parent: Guidelines
tags: [guidelines, documentation]
last_synced: {{DATE}}
verified_against: Shopware {{SHOPWARE_VERSION}}
type: reference
purpose: Reader-facing rules every page under docs/project-wiki/ follows.
scope: Structure, frontmatter, status vocabulary, terminology. Skill internals live in the sw-document-feature skill.
resync: Update when a page type, frontmatter field, or status value changes; record structural changes as an ADR with area process.
---

# Documentation guidelines

The rules every page here follows, whether a person or the `sw-document-feature` skill wrote it.
This file has no Shopware platform counterpart — it is project-only and served as is, never merged.

## Page shape

Every page opens with its title, then one or two sentences of plain prose saying what the page is
for. Maintenance metadata (scope, last synced, verified against, how to re-sync) sits in a single
italic line at the *bottom* of the page, not above the content. Breadcrumbs and the sidebar are
rendered by the theme from the navigation front matter — never write them into the page body.

Keep pages short: one topic per page, no paragraph longer than about four lines, prefer a table or
bullets to prose. If a section would only contain a placeholder, leave it out until there is
something true to write.

## Folders and surfaces

One page per surface: `domains/<domain>/administration/<feature>.md` and
`.../storefront/<feature>.md`, same slug on both halves, never merged. The *why* lives only in the
domain index feature table; pages link to `../index.md#features`. `domains/platform/` is the
cross-cutting domain, and has no surfaces.

## Page types

| Type | Path | Template (in the `sw-document-feature` skill) |
|---|---|---|
| Feature page | `domains/<domain>/<surface>/<feature>.md` | `reference/templates/feature-page.md` |
| Domain index | `domains/<domain>/index.md` | `reference/templates/domain-index.md` |
| Platform page | `domains/platform/<topic>.md` | no template — breadcrumb, prose intro, content sections, footer line |
| ADR | `adr/YYYY-MM-DD-title.md` | `reference/templates/adr.md` |
| Guideline | `guidelines/<file>.md` (no version folder — applies to the installed Shopware version) | `reference/templates/guideline.md` |

## Frontmatter

- All pages: `title`, `nav_order`, `tags[]` (plus `parent`/`grand_parent` when nested); durable pages also `type` (index|project|platform|domain|reference), `purpose`, `scope`, `resync`, `last_synced` (YYYY-MM-DD), `verified_against` (`Shopware <X.Y.Z>`).
- Feature pages: `domain`, `surface` (administration|storefront), `feature` (slug), `status`, `extension` (name in `custom/`, composer package, or null), `spec`, `prd` (path or null), `related[]`.
- ADRs: `title`, `date`, `area` (domain slug | platform | process), `tags[]`, `authors[]`, `status` (accepted|superseded|deprecated — `proposed`/`rejected` exist only in WIP files under `specs/`); exempt from `last_synced`/`verified_against`. Pages promoted from `specs/*-adr-*.md` additionally carry `id`, `prd`, `spec`, `owner`, `promoted_from` (the specs path), `promoted` (date); status changes after promotion are made here by people.
- Guideline files: `title`, `nav_order`, `parent: Guidelines`, `tags[]`, `last_synced`, `verified_against` (per above), plus optional `merge` (map of platform section anchor → `override`\|`extend`\|`waive`) and optional `adr` (list of `adr/<date>-<topic>.md` paths). No `grand_parent`, no `versions` — a guideline file is never nested deeper than `Guidelines`, and it applies to the one installed Shopware version recorded in `verified_against`.

Merge modes, applied per `##` heading anchor against the matching platform guideline file:

| Mode | Effect |
|---|---|
| `override` | Replaces the platform section in place. |
| `extend` | Inserted directly before the platform section; both apply, project section first. |
| `waive` | Replaces the platform section; the project body states the reason and starts with `WAIVED:`. |
| (anchor not in the platform file) | An addition, appended after the last platform section. |
| (anchor matches a platform section, no declared mode) | Treated as `override` and flagged. |

A `*-guidelines.md` file with no platform counterpart — like this one — is a project-only file, served as is; `merge` does not apply to it.

## Status

- Feature: `built` (code present, all ACs verified pass) · `partially-built` (code present, verification missing or failing) · `planned` (PRD/spec only) · `not-built` (nothing in the repo) · `deprecated` (removed or replaced).
- Pages not `built` carry a ⚠️ status block in *Status*, directly after the intro prose.

## Reference code, don't restate it

No code listings, class lists, or Twig markup. A *Developer* section contains exactly: where it lives (extension, paths, entities), extension points used, key decisions and why, configuration, how to debug/observe, gotchas. An append-only `## Decision Log` may follow *Related*.

## Where decisions go

Feature-level technical decisions → the *Developer › Decisions* bullets of the feature page. Business rules → the "Why" column of the domain index feature table. `adr/` (with `area:`, tag `business` for business rules) is the single source of truth for accepted and built decisions: WIP ADRs are drafted by `sw-design-solution` into `specs/*-adr-*.md` on a person's confirmation and promoted here once accepted and implemented, or provided by a person as accepted; ADRs are never generated by tooling. An accepted ADR that changes a coding rule → edit the project guideline file it applies to (`guidelines/<file>.md`, served as `guidelines/<version>/<file>.md`), citing the ADR in its `adr:` frontmatter key — never restated only in the ADR.

## Wiki mechanics

- Folder landing pages are `index.md`; relative links only, never absolute repo paths as links.
- Navigation front matter drives the sidebar: `nav_order` on every page, plus `parent` and
  `grand_parent` for pages nested under a section (three levels at most), and `nav_exclude: true` for
  a page that should stay out of the menu. `title` is the label shown in the sidebar, so it is kept
  short and unique — `parent` references match it exactly.
- No page carries a `layout` key: the layout is applied site-wide from `_config.yml` (`defaults:`),
  so pages stay readable as plain Markdown with or without a build.
- Durable pages carry `last_synced`/`verified_against`; older than 90 days or behind the installed
  Shopware version means stale. `adr/index.md` keeps a generated table of contents (between
  `<!-- adr-toc:start -->` / `<!-- adr-toc:end -->`, rewritten by the skill) next to its Liquid loop
  on wikis using the Jekyll flavor; text outside the markers is hand-maintained.

## Terminology

Terminology is Shopware's — see the [glossary](../baseline/glossary.md), including "terms we do not use".

---

*Scope: structure, front matter, status vocabulary and terminology — skill internals live in
the `sw-document-feature` skill (`reference/page-rules.md` governs how it fills pages). · Last
synced: {{DATE}} · Verified against Shopware {{SHOPWARE_VERSION}} · Re-sync: update when a page type, front
matter field or status value changes; record structural changes as an ADR with `area: process`.*
