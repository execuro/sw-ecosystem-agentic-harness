---
name: sw-implement-feature
description: Implement a feature from its technical spec (specs/NNNN-slug-spec.md, written by sw-design-solution) following TDD — tests first per acceptance criterion, then the implementation, fixing until every relevant test passes (including that AC's own acceptance/e2e test, run immediately, not deferred), running Shopware's own shopware-cli fixers/static-analysis per AC to conform to Shopware's coding standards as code is written rather than after the fact. Builds ACs group by group per the spec's Parallel groups/Depends on data, fanning out independent ACs to concurrent agent spawns instead of one at a time. Runs sw-verify-feature as its final step to produce a full verification report. Use when asked to implement, build, or code a feature/epic from an existing tech spec.
when_to_use: Trigger phrases — "implement spec 0007", "build this feature", "code the epic-1 spec", "implement the tech spec".
argument-hint: '[specs/NNNN-slug-spec.md]'
allowed-tools: Read Write Edit Glob Grep Bash Agent mcp__ShopwareDevKnowledgeBase__list_docs mcp__ShopwareDevKnowledgeBase__grep_docs mcp__ShopwareDevKnowledgeBase__read_doc mcp__ShopwareDevKnowledgeBase__kb_status
---

# sw-implement-feature

Implement one feature from its technical spec, under TDD, then hand off to full verification.

## Inputs

| Argument | Behaviour |
| --- | --- |
| Path to `specs/NNNN-slug-spec.md` | Implement this spec |
| Path to `specs/NNNN-slug.md` (a PRD, no spec) | Tell the user to run `sw-design-solution` first — do not improvise a spec |
| Nothing | Ask the user for the spec path |

## Procedure

### 0. Pre-check

Invoke `sw-setup` once. Rows an AC's tests need — vendor/ (PHPUnit); Acceptance-test project, Playwright browsers, ATS env (e2e); Plugin tests (target plugin) — must be ticked; unticked → stop, tell the user to run `/sw-setup`. Never mark an AC `partly` for a missing environment.

**Shopware version — detect once, before spawning anything, never assume:** `vendor/shopware/core/composer.json` `version` → `composer.lock` → `composer.json` constraint ("unconfirmed"); PHP from the project runtime (`compose.yaml`, `.ddev/config.yaml`, `Dockerfile`), not the host. State it with evidence in every Agent-tool brief below — implementer spawns, architect escalation, QA e2e runs — so no sub-agent has to re-derive it; a version with no evidence must still be passed on as unconfirmed (e.g. constraint-only), never treated as certain. Unknown → ask the user.


Then work through the three reference files in this skill's directory, in order:

| File | When | What it decides |
| --- | --- | --- |
| `reference/build-order.md` | before spawning anything | the spec's §3 Parallel groups, the fallback for specs without dependency data, the proven-approach guard, and when to stop a group |
| `reference/delegation.md` | once the build order is known | which agent owns each AC, what every brief must contain, the KB docs rule, and the architect escalation path |
| `reference/ac-loop.md` | once per acceptance criterion | steps 1-5 — test first, implement, conform, confirm (including running that AC's e2e now), scope check — plus the rules on multi-interface ACs, deviating from the spec, and migrations |

You orchestrate; you do not write feature code yourself.

## Completion check

Once every AC in the spec has been implemented:

1. Verify that every AC has relevant code and a passing test — unit/integration and, where applicable, its e2e scenario already run per-AC in step 4 above — walk the spec's AC list explicitly, do not assume.
2. If any test is not passing, fix the implementation and re-check. Do not report completion with known failing tests.
3. Once all relevant tests pass, run the **`sw-verify-feature`** skill against the same spec path, as the final step of this flow — since every AC's tests (including e2e) already ran during implementation, this is a full-feature audit and cross-check, not the first execution of any test, and it still produces the authoritative pass/not pass/partly report per AC.

**Status tags.** After an AC's own tests pass, you may mark it in the spec by inserting `[done]` (or `[partly]` when only part of the plan landed) directly after its bold id — `- **AC-2** [done] (FR-3)` — and the same on the matching `- **FR-n**` / `- **AC-n**` line of the PRD. Edit that line only; touch nothing else in either document. The Specs Editor and `sw-verify-feature` read and preserve these tags.

## Report

After `sw-verify-feature` completes, relay its report to the user. Do not produce a second, separate summary — `sw-verify-feature`'s report is the source of truth for completion status.
