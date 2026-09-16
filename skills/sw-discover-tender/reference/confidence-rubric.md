# Confidence rubric

Score each dimension 0–100 against its bands, multiply by weight, sum, round to a whole percent. `points = score × weight / 100`. Score the document as written; a verdict given in chat does not count.

## Coverage evidence — weight 20

| Score | Band |
| --- | --- |
| 100 | Every Must `req` line's class rests on a PM verdict or a mechanism cited to `vendor/` or a KB page; ≤5% of rows `unverified` |
| 70 | ≤15% `unverified`; Should/Could rows partly evidenced |
| 40 | The PM wave was partly not consulted, or >15% `unverified` |
| 0 | Classes set from memory |

## Estimate basis — weight 20

| Score | Band |
| --- | --- |
| 100 | Every estimated row has low/mid/high, a level and drivers; foundation efforts attached to named rows |
| 70 | ≤10% of estimated rows lack a three-point |
| 40 | The architect was not consulted for at least one cluster |
| 0 | PD figures without agent input |

## Scope lock — weight 20

Counts `accepted` lines only. `[ ]`, an unreconciled `[x]`, `rejected` and `suspect` count as nothing.

| Score | Band |
| --- | --- |
| 100 | ≥80% of Must PD sits on rows that are `detailed` or covered by an accepted line; every vague Must row has a `CQ-n` |
| 70 | 60–80% of Must PD locked; every vague Must row has a `CQ-n` |
| 40 | <60% locked, or a vague Must row without a `CQ-n` |
| 0 | No accepted line and no client question |

## Platform decision — weight 15

| Score | Band |
| --- | --- |
| 100 | Plan, hosting, PSP and CMP decided in §6, each with a reason naming the rows it serves and a source (profile, PM tier, architect alternative); the plan's PD delta stated |
| 70 | One §6 platform item `_TBD_` or open in a `Q-n` |
| 40 | Two or more `_TBD_` or open, or the plan undecided |
| 0 | Profile missing, or the §6 platform table empty |

## Integration & migration — weight 15

| Score | Band |
| --- | --- |
| 100 | Every interface and migration object the RFP names is in §6 with pattern and owner split; §8 and §1.2 are complete for every estimate-driving parameter and migration volume |
| 70 | Main interfaces covered; secondary ones or the owner split missing; §8/§1.2 mostly complete |
| 40 | Approach lines missing for named interfaces, or an estimate-driving §1.2 parameter or a §1.2 migration volume is missing without a `CQ-n` |
| 0 | §6 interface and migration tables `_TBD_` |

## Consistency — weight 10

| Score | Band |
| --- | --- |
| 100 | All probes run (plugins, prior analyses, PRDs, partner assets, RFP-internal); every conflict resolved or logged as `K-n` in §7 |
| 70 | Probes run; a `K-n` unresolved |
| 40 | Probes run only partially |
| 0 | A known conflict unrecorded |

## Status

| Confidence | Open `high` `Q-n` | Blocking `CQ-n` on a Must row | `suspect` lines | Unreconciled ticks | Status |
| --- | --- | --- | --- | --- | --- |
| > 90 | none | none | none | none | **Ready to submit** |
| > 90 | any of the four present | | | | **Review** |
| 80–90 | | | | | **Review** |
| < 80 | | | | | **Draft** |

The four conditions override the arithmetic. §2 *Weakest dimension* names every blocker by id.

## Honesty rules

- Do not round up to cross 80 or 90.
- Never raise a score because the deadline is close or the user wants the response finished.
- A row with an open non-blocking question (`estimated, CQ-n`) caps *Scope lock* at 70 for the share of Must PD it carries, unless the assumption its estimate rests on is `accepted`.
- `_TBD_` anywhere in §6 caps that dimension at 40.
- `_TBD_` overhead or buffer in the profile caps *Estimate basis* at 70; §2 states that PD is given before both.
- `reuse: rfp-NNNN <ID>` is evidence only if the source row carried a verdict, not a guess.
- If the total moved down since the last run, the report says so and names the cause.
