# Confidence rubric

Score each dimension 0–100 against its bands, multiply by weight, sum, round to a whole percent.

`points = score × weight / 100`

Score the PRD **as written**, not the conversation. If a decision was made in chat but is not in the file, it does not count.

## Scope & boundaries — weight 20

| Score | Band |
| --- | --- |
| 100 | §1 goal is unambiguous; §2 in-scope and out-of-scope both populated; sales channels and actors in §3 fixed |
| 70 | In-scope clear, out-of-scope thin or absent |
| 40 | Goal clear, boundaries mostly implied |
| 0 | Goal itself is `_TBD_` or the feature could mean two different things |

## Domain impact — weight 15

| Score | Band |
| --- | --- |
| 100 | Every affected concept in §4 with its change; new concepts defined |
| 70 | Main concepts listed, one or two secondary effects unresolved |
| 40 | Concepts named without stating what changes |
| 0 | §4 is `_TBD_` |

## Functional coverage — weight 25

| Score | Band |
| --- | --- |
| 100 | FRs cover the whole in-scope surface; each is a single testable sentence; nothing left as "and similar" |
| 70 | Happy path complete, secondary flows partial |
| 40 | Only the headline behaviour is specified |
| 0 | No FRs, or FRs are goals rather than behaviours |

## Acceptance criteria — weight 20

| Score | Band |
| --- | --- |
| 100 | Every non-trivial FR has Given/When/Then, externally observable, unambiguous pass/fail |
| 70 | Majority covered; a few FRs have none |
| 40 | A handful of examples rather than criteria |
| 0 | §7 is `_TBD_` |

## Edge cases & rules — weight 10

| Score | Band |
| --- | --- |
| 100 | §6 covers empty state, limits, failure, and the reversal/cancellation path; error behaviour is specified from the actor's view |
| 70 | Main rules stated, failure behaviour thin |
| 40 | Rules present, no edge cases |
| 0 | §6 is `_TBD_` |

## Consistency resolved — weight 10

| Score | Band |
| --- | --- |
| 100 | All five probes in `consistency-probes.md` run; every conflict found is resolved and logged in §12 |
| 70 | Probes run; a conflict is recorded in §11 but not yet resolved |
| 40 | Probes run only partially |
| 0 | Not run, or a known conflict is left unrecorded |

## Status

| Confidence | Open questions in §11 | Status |
| --- | --- | --- |
| ≥ 90% | none | **Ready for specification** |
| ≥ 90% | one or more | **In progress** |
| < 90% | any | **In progress** |

The open-question rule overrides the arithmetic without exception: a PRD scoring 94% with one open question stays *In progress*.

## Honesty rules

- Do not round up to cross 90%.
- Never raise a score because the user seems satisfied, is in a hurry, or asked for the PRD to be finished.
- A `(assumed)` marker caps its dimension at 70 unless the user confirms the assumption.
- `_TBD_` anywhere in §1–§8 caps that dimension at 40.
- §10 Early Tech Decisions is never scored. Recording a technical decision cannot raise confidence.
- §9 OOTB / Extend / Custom Assessment is never scored either — it is a preliminary signal, not a decision, and carries no weight in the total.
- If the total moved down since the last run, say so plainly in the report and name the cause — that goes in the report, not in §13.
- **Weakest dimension** in §13 is one sentence, max 25 words: the dimension, the one gap, what closes it. What changed this run, which rows were answered, why scores moved — none of that goes into §13; it goes into the run report.
