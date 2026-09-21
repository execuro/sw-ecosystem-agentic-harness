# Tech spec template

Copy verbatim, fill, delete every `<!-- -->` hint. Keep section numbers and titles unchanged — `sw-implement-feature` and `sw-verify-feature` key off them (the AC-n identifiers especially, they must match the source PRD exactly).

Unknown content stays `_TBD_`. Never delete an empty section; an empty section is a signal, an invented one is a defect. Status is `In progress` or `Ready for implementation`; Confidence is the share of §7 criteria met.

---

```markdown
# TECH-SPEC-NNNN — <Feature name>

| | |
| --- | --- |
| **Status** | In progress |
| **Confidence** | NN% |
| **Created** | YYYY-MM-DD |
| **Updated** | YYYY-MM-DD |
| **Source PRD** | specs/NNNN-slug.md |
| **Supersedes** | — |

## 1. Source PRD Summary

<!-- One or two sentences recapping the PRD's Problem & Goal — orientation only, never re-litigate or restate the PRD's content in full. -->

**FR / AC coverage**

| FR | AC(s) | One-line restatement |
| --- | --- | --- |
| <!-- FR-1 --> | <!-- AC-1, AC-2 --> | <!-- do not reinterpret, just point back --> |

## 2. Architectural Decisions

_Source: `sw-shopware-architect`'s report, verified in-agent per its evidence rules (live call site + docs quote); the skill spot-checks at most two central decisions before landing here._

| Decision | Extension point | Data model & migrations | Trade-offs | Verified by |
| --- | --- | --- | --- | --- |
| <!-- one line, "what will exist" --> | <!-- event/subscriber, tag, route, decoration target --> | <!-- entity/field/migration, or "none" --> | <!-- upgrade risk, performance, coupling, testability --> | <!-- file:line citation, or "per official docs: '<sentence>'" — never a bare link, never a fixture/Test-folder class with no call site --> |

**Verified assumptions:** <!-- mechanisms confirmed by real usage + docs, one line each -->
**Unverified / at risk:** <!-- anything marked `(unverified — static citation only)` — must also appear in §6 as an open question -->

<!-- Optional, added by the Specs Editor on first request — keep the line exactly in this shape: -->
<!-- Diagram: specs/NNNN-slug-spec.architecture.excalidraw -->

## 3. Per-AC Implementation Plan

One block per acceptance criterion in the source PRD — same `AC-n` numbering, no additions, no omissions. `Depends on` reflects genuine build-order dependencies only (shared migration/entity, shared file, a contract another AC introduces) — never PRD order by default. ACs with `Depends on: none` relative to each other are the parallel groups `sw-implement-feature` hands out concurrently; each AC still runs its own failing-test-first TDD cycle and its own acceptance/e2e test immediately on implementation, never deferred to the final verification pass.

**Parallel groups:** <!-- e.g. "Group 1 (parallel): AC-1, AC-3, AC-4 — no shared entity/file. Group 2 (after Group 1): AC-2 — needs the entity AC-1 introduces." One line per group, in build order. -->

<!-- Status tag convention: an optional `[done]` / `[partly]` / `[open]` directly after `**AC-n**` (e.g. `- **AC-1** [partly] (FR-1)`) and after a part label (`- **Decision:** [done] …`); absent = open. Set by the user in the Specs Editor or by sw-implement-feature / sw-verify-feature. Preserve on every rewrite. -->

- **AC-1** (FR-1)
  - **Depends on:** <!-- other AC id(s) this cannot start before, or "none" -->
  - **Decision:** <!-- the architectural/technical decision needed to satisfy this AC specifically, referencing §2 rows by name rather than repeating them -->
  - **Implementation plan (TDD order):**
    1. <!-- failing test first -->
    2. <!-- next step -->
  - **Tests:**
    - Unit/integration: <!-- test file/class + method name, or planned name if not yet written -->
    - e2e (if user-facing): <!-- test file path + scenario description, e.g. `tests/acceptance/tests/<Plugin>/<slug>.spec.ts` "AC-n <scenario>" — repeat the path on every AC, even when it's the same file as a prior AC. sw-implement-feature writes and runs this file per-AC; sw-verify-feature only audits that it exists and passes. -->

## 4. Toolchain Conformance

Known-preferred shapes this spec's implementation plan must produce directly, so `sw-implement-feature` doesn't discover them later as a lint failure:

- <!-- e.g. "services.yaml, not services.xml" — extend this list per decision in §2 that has a known-preferred shape -->

For any decision in §2 without a known-preferred shape, note it here so `sw-implement-feature` runs its own per-AC conformance check on first implementation of that shape — do not assert a preference that hasn't been checked.

**Gate:** the feature is not done until `shopware-cli extension validate --full --exclude sw-cli` reports zero errors for the plugin. This is what `sw-verify-feature` checks at the end.

## 5. Decision Log

One line per resolved decision — architect-sourced, clarification-loop-sourced, or self-verified. No question text, no quotes, no transcript.

| # | Topic | Decision | Date | Tag |
| --- | --- | --- | --- | --- |
| D-1 | <!-- --> | <!-- --> | YYYY-MM-DD | <!-- [architect] if sourced from sw-shopware-architect, else blank --> |

## 6. Open Questions

<!-- One block per question, blank line between. Example: -->
<!--
**Q-1** One short, concrete question, one decision, no preamble.
Blocks: AC-2
- [ ] A: First option (recommended)
  - [architect] one-line reason
- [ ] B: Second option
  - [qa] against: one-line reason
-->

A question earns its place only if it changes architecture, data model, or test strategy, or is a decision still `(unverified — static citation only)`. Any open question blocks *Ready for implementation*.

Rules: one block per question, a `**Q-n**` line, `[adr]`/`[gate]` tag right after the id for the ADR Extract/Keep and readiness-override asks, optional `Blocks:` line. Options are `- [ ] <Letter>: text`, 2–4 of them, exactly one `(recommended)`. Agent notes are indented `  - [<agent>] text` under the option they judge; a note under the question line only when no option is recommended. An answer is `[x]` on one option, or an own-answer line `- [x] ✎ text`. Older specs (a legacy question table) are converted to this format automatically on the first editor-mode write.

## 7. Readiness

| # | Criterion | Met |
| --- | --- | --- |
| C-1 | Every §2 decision has an extension point and a `Verified by` citation | <!-- yes/no --> |
| C-2 | Domain model changes scoped — entities/fields/migrations named, or "none" | <!-- yes/no --> |
| C-3 | Architecture & stack decisions vetted against the installed version, or marked no impact — any `(unverified — …)` decision fails this | <!-- yes/no --> |
| C-4 | Every AC in §3 has an implementation plan and tests at the right level, every marker carries `NNNN`, plugin header filled | <!-- yes/no --> |
| C-5 | §6 empty, and no ADR `proposed` / `rejected` | <!-- yes/no --> |

Confidence = criteria met / 5, as a percentage. **Ready for implementation** at 5/5. Otherwise **In progress**.
```

---

Density over size: fill every row the feature actually has, invent none of them. A `_TBD_` row is a truthful gap; a guessed row is a defect that reaches `sw-implement-feature` as a wrong instruction.
