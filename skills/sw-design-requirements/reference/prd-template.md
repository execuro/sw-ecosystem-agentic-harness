# PRD template

Copy verbatim, fill, delete every `<!-- -->` hint. Keep section numbers and titles unchanged — later tooling and the rubric key off them.

Unknown content stays `_TBD_`. Never delete an empty section; an empty section is a signal, an invented one is a defect.

---

```markdown
# PRD-NNNN — <Feature name>

| | |
| --- | --- |
| **Status** | In progress |
| **Confidence** | 0% |
| **Created** | YYYY-MM-DD |
| **Updated** | YYYY-MM-DD |
| **Source** | chat \| path/to/brief.md |
| **Supersedes** | — |

## 1. Problem & Goal

<!-- 2–4 sentences. Who is blocked or losing value today, and what changes for them. No solution. -->

**Success looks like:** <!-- one sentence, observable from the outside -->

## 2. Scope

**In scope**
- <!-- bullet per capability -->

**Out of scope**
- <!-- bullet per explicitly excluded thing, with a 3–6 word reason -->

## 3. Actors & Sales-Channel Scope

| Actor | Where | Notes |
| --- | --- | --- |
| <!-- Guest / Registered customer / B2B buyer / Merchant admin / External system --> | <!-- Storefront / Store API / Admin / Background --> | <!-- customer group, role, country restriction --> |

**Sales channels:** <!-- which, or "all" -->
**Languages / currencies / countries:** <!-- or "inherits project default" -->

## 4. Domain Impact

Business-level only — what concepts change, not how they are stored.

| Concept | Change | Why |
| --- | --- | --- |
| <!-- Order --> | <!-- gains a customer-chosen delivery date --> | <!-- FR-3 --> |

**New concepts:** <!-- name + one-line definition, or "none" -->

<!-- Optional, added by the Specs Editor on first request — keep the line exactly in this shape: -->
<!-- Diagram: specs/NNNN-slug.domain.excalidraw -->

## 5. Functional Requirements

One testable sentence each. Present tense, active voice.

<!-- Status tag convention (FR, BR, AC): an optional `[done]` / `[partly]` / `[open]` directly after the bold id, e.g. `- **FR-1** [done] …`; absent = open. Set by the user in the Specs Editor or by sw-implement-feature / sw-verify-feature. Preserve it on every rewrite. -->

- **FR-1** <!-- The storefront shows … -->
- **FR-2**

## 6. Business Rules & Edge Cases

- **BR-1** <!-- condition → required outcome -->

**Edge cases**
- <!-- empty state, limit reached, concurrent change, cancelled/refunded, deleted reference, unsupported currency … -->

**Error behaviour visible to the actor**
- <!-- what they see when it fails -->

## 7. Acceptance Criteria

Given/When/Then, one block per FR that needs it. Externally observable only.

- **AC-1** (FR-1)
  - **Given** …
  - **When** …
  - **Then** …

## 8. Data & Integrations

| Data | Source of truth | Direction | Business expectation |
| --- | --- | --- | --- |
| <!-- Stock levels --> | <!-- ERP --> | <!-- ERP → Shop --> | <!-- accurate within 15 min --> |

**Existing data:** <!-- what happens to records created before this ships, or "none" -->
**Personal data / compliance:** <!-- GDPR, invoices, legal texts, or "none" -->

## 9. OOTB / Extend / Custom Assessment (preliminary)

_Preliminary signal, not a decision. Estimates the most likely delivery path per requirement, to surface complexity early. The binding classification is made in the tech spec (`sw-design-solution`)._

| FR | Customer ask | Estimate | Why | Source |
| --- | --- | --- | --- | --- |
| <!-- FR-3 --> | <!-- one line --> | <!-- OOTB \| Extend \| Custom --> | <!-- what is missing or differs from stock Shopware / an existing project plugin, in business terms only — never an implementation approach --> | <!-- sw-product-manager verdict (Shopware vX, doc/vendor evidence) or existing-plugin scan --> |

Leave a row `_TBD_` rather than guessing without a `sw-product-manager` verdict or a plugin-scan finding behind it.

## 10. Early Tech Decisions / Limitations

Decisions the business or team has already fixed. Recorded, not evaluated. Not requirements. No effect on confidence.

- `[decision]` <!-- statement --> — set by <!-- who -->, <!-- date -->
- `[constraint]` <!-- statement --> — set by <!-- who -->, <!-- date -->
- `[architect]` <!-- one-line verdict, only if sw-shopware-architect was consulted --> — <!-- date -->

## 11. Open Questions

<!-- One block per question, blank line between. Example: -->
<!--
**Q-1** One short, concrete question — no preamble, no restated context.
Blocks: FR-4, AC-2
- [ ] A: First option (recommended)
  - [pm] one-line reason
- [ ] B: Second option
- [ ] C: Third option — options stay blank until an editor-mode run touching this question fills them
-->

Every question here is a gap that changes domain modelling, functional behaviour, or acceptance criteria — nothing smaller is written down. Any open question blocks *Ready for specification*.

Rules: one block per question, a `**Q-n**` line, optional `[adr]`/`[gate]` tag right after the id (decision cards in the Specs Editor), optional `Blocks:` line. Options are `- [ ] <Letter>: text`, 2–4 of them, exactly one `(recommended)`. Agent notes are indented `  - [<agent>] text` under the option they judge; a note under the question line only when no option is recommended. An answer is `[x]` on one option, or an own-answer line `- [x] ✎ text`. Older PRDs (a legacy question table) are converted to this format automatically on the first editor-mode write.

## 12. Clarification Log

One line per resolved decision. No question text, no quotes, no transcript.

| # | Topic | Decision | Date |
| --- | --- | --- | --- |
| C-1 | <!-- --> | <!-- --> | YYYY-MM-DD |

## 13. Confidence Breakdown

| Dimension | Weight | Score | Points |
| --- | --- | --- | --- |
| Scope & boundaries | 20 | 0 | 0.0 |
| Domain impact | 15 | 0 | 0.0 |
| Functional coverage | 25 | 0 | 0.0 |
| Acceptance criteria | 20 | 0 | 0.0 |
| Edge cases & rules | 10 | 0 | 0.0 |
| Consistency resolved | 10 | 0 | 0.0 |
| **Total** | **100** | | **0%** |

**Weakest dimension:** <!-- <dimension name> — one sentence (max 25 words): the single gap holding it down and what closes it. Never a run summary; that belongs in the report. -->
```

---

Leanness here means density, not size. A PRD is as long as the feature needs: fill every row the feature actually has and drop none to hit a target. See `splitting-guidelines.md` for when one PRD should have been two.
