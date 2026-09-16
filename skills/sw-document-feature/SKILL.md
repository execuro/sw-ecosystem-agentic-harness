---
name: sw-document-feature
description: Document one Shopware project feature into the LLM-wiki under docs/project-wiki/ — one feature page per surface (administration/ and/or storefront/), the "why" row in the domain index, ADR pages only promoted from the WIP ADR files sw-design-solution extracted into specs/ once they are accepted and built (with an organised table of contents) or provided by the user (never invented). Sources are a PRD (specs/NNNN-slug.md), its tech spec (specs/NNNN-slug-spec.md), or the current chat. Runs a mandatory built-check gate first — pages for functionality that does not exist in custom/ or vendor/ are written only after the user explicitly enforces it, and then carry the ⚠️ NOT BUILT block. Never restates code; references paths, extension points, decisions, config. Not for writing PRDs or specs — that's sw-design-requirements / sw-design-solution.
when_to_use: Trigger phrases — "document this feature", "write the wiki page for spec 0007", "document PRD specs/0003-…", "add docs for <feature>", "update the wiki for <feature>", "put this in the project wiki", "record this as a project coding rule", "override/waive this guideline for our project".
argument-hint: [path to PRD or spec | empty = use chat] [--setup]
allowed-tools: Read Glob Grep Bash Write Edit Agent AskUserQuestion mcp__ShopwareDevKnowledgeBase__list_docs mcp__ShopwareDevKnowledgeBase__grep_docs mcp__ShopwareDevKnowledgeBase__read_doc mcp__ShopwareDevKnowledgeBase__kb_status
---

# sw-document-feature

Turn one feature — from its PRD/spec or from the chat — into wiki pages under `docs/project-wiki/`. The wiki's own rules win over anything here: read `docs/project-wiki/guidelines/documentation-guidelines.md` before writing and fill pages from the templates in `reference/templates/` in this skill's directory (the single source of page shapes).

## Hard rules

- **Gate before ink.** Nothing under `docs/project-wiki/` is created or edited before step 3 has produced its evidence table and a verdict, per the mandatory gate defined in `reference/built-check.md`.
- **Never restate code.** Class listings, method signatures, DI wiring, Twig markup are pointed to by path, not reproduced. At most a one-line snippet if unavoidable.
- **One surface per page.** `administration/<feature>.md` and `storefront/<feature>.md` only; never `admin/`, `backend/`, `api/`, never a page without a surface. The "why" lives once, in the domain index feature row.
- **User answers are anchored, never quoted.** Rewrite them into the page's own voice and add one line to the page's *Decision Log* (see `reference/page-rules.md`).
- **ADRs are never invented.** `docs/project-wiki/adr/` is the single source of truth and holds only accepted + built ADRs — promoted once from the WIP files `specs/NNNN-slug-adr-<topic>.md` written by `sw-design-solution` (the spec's `[adr] <path>` lines point at them; procedure in `reference/adr-promotion.md`), or provided by the user in chat as accepted (title + context/decision/consequences; anything not accepted is sent to `specs/` as WIP). Never from "precedent", significance, or its own judgment; never written to `specs/`; an existing docs ADR is never overwritten. Everything else goes to Developer › Decisions or the index "Why" column; `[potential ADR]` items are only listed in the report under "ADR candidates (not created)" — no question mid-run unless the user asked about ADRs.
- **Never paste a page body into chat.** The final report is at most six lines.

## Inputs

| Argument | Behaviour |
| --- | --- |
| `specs/NNNN-slug.md` (PRD) | Read it; locate the spec `specs/NNNN-*-spec.md` by number, then slug |
| `specs/NNNN-slug-spec.md` (spec) | Read it; locate the PRD `specs/NNNN-slug.md` (same number, slug without `-spec`) |
| Both paths | Read both |
| Nothing | **Chat mode** — the current discussion is the source; `prd: null`, `spec: null` |
| `--setup` (alone or with a path) | **Setup only** — run step 0, report its table, stop. Nothing is documented. The `sw-setup` Project wiki row invokes this flag as its fix |
| A path that does not exist | Say so, `ls specs/`, and ask with a structured question tool if you have one (Claude Code: `AskUserQuestion`; Codex: `request_user_input`) offering the nearest match (by number or slug) or chat mode. Never guess a file, never silently fall back to chat |

If a counterpart is missing, say so in one line and continue with what exists. In chat mode extract what/why/AC-like statements from the discussion per `reference/source-mapping.md`; ask the user for the feature name in one sentence only if it cannot be inferred.

## Procedure

### 0. Set up the wiki — only when it is missing or `--setup` was passed

Enter `reference/setup-wiki.md` in this skill's directory when the run carries `--setup`, **or** when `docs/project-wiki/` does not exist. It asks its own questions, delegates writing to one sub-agent, and returns the created/kept table. With `--setup` the run stops there; otherwise it continues at step 1.

Wiki present and no `--setup` → skip this step; no structure work happens on a documentation run.


### 1-7. Run the documentation steps

Follow `reference/procedure.md` in this skill's directory: resolve inputs, find the
counterpart, the mandatory built-check gate, domain and surface mapping, writing the
pages, ADR promotion, project guidelines, the link check and the report.

## Reference files

All under `reference/` in this skill's directory:

- `procedure.md` — steps 1-7 of a documentation run, in order
- `built-check.md` — the gate: where to search, evidence-table format, verdict rules, the override
- `page-rules.md` — condensed wiki rules, terminology, Business vs Developer content, Decision Log
- `source-mapping.md` — PRD / spec / verification report / chat → page sections
- `domain-guidelines.md` — canonical domains, feature→domain and surface assignment, `platform` boundaries, splitting
- `adr-promotion.md` — step 5b: discovery of `specs/*-adr-*.md`, accepted + built test, WIP→docs field mapping, TOC block format
- `templates/feature-page.md`, `templates/domain-index.md`, `templates/adr.md`, `templates/guideline.md` — the page shapes to fill (`adr.md` only for user-provided ADRs; `guideline.md` only for the guideline route, `page-rules.md` "Project guidelines")
- `setup-wiki.md` — step 0, entered only on `--setup` or a missing wiki: triggers, the setup questions, manifest, detect/init/repair, the sub-agent brief, drift check
- `scaffold/` — the generic wiki skeleton (16 files for Jekyll, 15 for Vanilla — see `scaffold/vanilla/`) that setup copies from

Wiki sources of truth for rules (do not copy them into this skill): `docs/project-wiki/guidelines/documentation-guidelines.md`, `docs/project-wiki/baseline/glossary.md`.
