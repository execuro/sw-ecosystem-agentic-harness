# Source mapping

How each input lands on the wiki. Condense, never quote; one fact lives in one place.

## PRD (`specs/NNNN-slug.md`, sections as in sw-design-requirements)

| PRD section | Goes to |
|---|---|
| Meta table (Status, Confidence) | Nothing — a PRD's readiness is not a feature status |
| §1 Problem & Goal, "Success looks like" | Domain index feature row → **Why** (one sentence). The feature page's intro prose links there |
| §2 Scope (in/out) | Business user section (in scope); *Domain notes* or Gotchas for explicit out-of-scope that a reader would expect |
| §3 Actors & Sales-Channel scope | Decides the **surfaces**: Merchant admin → administration; Guest/Registered/B2B → storefront; External system/Background → surface that triggers it. Sales Channel/language limits → Business user section |
| §4 Domain Impact, new concepts | Developer › Where (entities) and *Domain notes* in the domain index; new concept names → glossary row |
| §5 FR-n | Business user section, grouped by workflow, not listed one-per-FR |
| §6 BR-n, edge cases, error behaviour | Business user (visible behaviour) + Gotchas (surprising rules); a significant BR → Why column, never an ADR unless the user provides one |
| §7 AC-n | Not restated. Cited by id in Status (`AC-1..AC-n pass` or failing list) and in the NOT BUILT block |
| §8 Data & Integrations | Developer › Where / Config; direction and source of truth → *Domain notes* |
| §9 Early tech decisions `[decision]` `[constraint]` `[architect]` | Developer › Decisions, never `adr/` (the PRD skill extracts no ADRs) |
| §10 Q-n open questions | Report line "open questions" + Gotchas as `_TBD_` if they affect documented behaviour. Never resolved by the skill |
| §11 C-n clarification log | Already anchored in the PRD; use the decision, not the log |
| §12 Confidence | Nothing |

## Tech spec (`specs/NNNN-slug-spec.md`, written by sw-design-solution)

| Spec section | Goes to |
|---|---|
| Per-AC architectural decision | Developer › Where / Extension points (paths, entities, routes, events, components) |
| Per-AC implementation plan | Developer › Where only as *paths that exist*; steps are never listed |
| Per-AC tests / e2e scenarios | Cited in Status evidence; test paths in Debug/observe if they are the fastest way to reproduce |
| Decision Log (incl. `[architect]`, `(unverified …)`) | Developer › Decisions; unverified ones stay marked `(unverified)`. A line `[adr] <path>` → Developer › Decisions link to the promoted docs ADR, or to the WIP file marked `(WIP, <status>)` (below); `[potential ADR]` lines → report "ADR candidates (not created)" |
| Dependencies table (`| ADR | Status | Blocks readiness |`) | Nothing beyond the `[adr]` links; status is read from the ADR file, not this table |
| Toolchain conformance notes | Gotchas (one line) |
| Open Questions | Report + Gotchas `_TBD_` |
| Readiness / status | Nothing |

Which surface owns what: entities, migrations, admin modules, Admin API → administration page; Storefront controllers, Twig, Store API, JS plugins → storefront page; the other page links.

## ADR marker (the only spec input that yields an ADR)

A spec Decision Log line `[adr] <path>` (written by sw-design-solution when the user chose *Extract as ADR*) points at `specs/NNNN-slug-adr-<topic>.md`; that **file** is the WIP ADR — the line carries no detail of its own. It becomes a docs ADR only by promotion per `adr-promotion.md` (`accepted` and its required changes found in the code; created once, never overwritten). An `[adr]` path that resolves neither to a WIP file nor to a docs ADR by `id` → report "dangling [adr] links", no page. Lines without `[adr]` never become ADRs, however far-reaching; `[potential ADR]` lines go to the report as "ADR candidates (not created)". Promotion covers every `specs/*-adr-*.md`, not only those the current spec links.

## Verification report (`sw-verify-feature`, in chat)

```
AC-n | pass / not pass / partly | evidence | note
Static analysis | pass / fail / not run | …
DEFECT-n …
```

- All `pass` + code found → `status: built`; Status: "`built` — verified YYYY-MM-DD (AC-1..AC-n pass)".
- Any `not pass`/`partly` → `partially-built`; ⚠️ PARTIALLY BUILT block lists those ACs with the note; `DEFECT-n` summarised in Gotchas without file:line dumps.
- `Static analysis | fail` → one Gotchas line; it does not change AC status.
- Use the report's date as the verification date; `last_synced` is still today.

## Chat mode (no PRD/spec)

Extract from the discussion, in this order, and mark anything not stated as `_TBD_`:

1. **What** — the capability in one sentence per surface → the page's intro prose.
2. **Why** — the business goal → domain index Why column. If absent, ask once (a structured question tool if you have one — Claude Code: `AskUserQuestion`; Codex: `request_user_input` — free text is fine) and anchor it.
3. **AC-like statements** — "must", "should", "when X then Y", Given/When/Then → cite as `AC-a`, `AC-b` (letters, to signal they are chat-derived) in Status; do not invent numbers.
4. **Names** for the built-check — extension, entities, routes, keys.
5. **Decisions** the user stated → Developer › Decisions with `(from chat, YYYY-MM-DD)`. Only an ADR the user explicitly provides or asks to record ("record this as an ADR") → `adr/` per `page-rules.md` "ADRs".

Frontmatter: `prd: null`, `spec: null`. A verification report pasted in chat still counts (above). If the gate finds nothing on disk, the status after enforce is `not-built`, and the NOT BUILT block says "no PRD, spec, or code in this repo".

## Domain index row

`| Feature | Why | [page](administration/<slug>.md) or — | [page](storefront/<slug>.md) or — |`

Four columns, no spec and no status. The wiki is the durable record and `specs/` is working material that goes away once a feature is documented, so the source paths live only in the feature page's `spec`/`prd` front matter. A documented feature is a built feature by default, so the overview does not repeat a status that is `built` on every row — the exception is carried where a reader meets it: the page's own `status` front matter and its ⚠️ block, written when the user enforced documentation of something not built.
