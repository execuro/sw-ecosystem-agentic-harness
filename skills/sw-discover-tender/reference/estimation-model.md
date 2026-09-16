# Estimation model

## Unit

**PD** = one person-day (8 h) of one senior Shopware developer, including unit tests and code review. Excludes project management, QA, design, content, training, hosting and the ERP partner's work; those enter through overhead or as *Services* rows. If the RFP defines PD differently, the RFP's definition wins and the difference is stated in §1.

## Three-point per row

The architect returns `low / mid / high` per row:
- **low** — everything goes right, named reuse applies
- **mid** — most likely, drivers partly materialise
- **high** — every listed driver materialises

The PM never estimates. The QA agent estimates only quality, test, security-testing and accessibility rows.

## Level and buffer

| Level | Definition | Buffer |
| --- | --- | --- |
| detailed | Acceptance criteria present, or a quantified specification (volumes, limits, formats) | 0% |
| medium | Clear intent, no acceptance criteria | 10% |
| vague | Comparative or totality phrasing, undefined reference, missing counterpart or owner | 25%, and only with a `CQ-n` or a proposed assume line; blocked rows stay empty |

## Assumption lines

Every candidate is a `[ ]` line with a PD saved figure stated against mid: `<ROW>.a<n>` under its row, or `A-n` in §3 with PD saved per row (`STF-01 −5 · STF-03 −3`). A `[ ]`, `rejected` or `suspect` line changes nothing.

An `accepted` line, and only an accepted line:
1. removes its PD saved from the row's mid; low and high move proportionally
2. sets the row's class to the line's class when one is stated
3. resets the row's level to `detailed` (buffer 0%)

A `.c` or `RC-n` clarification replaces the open assumption of its rows; the rows are re-estimated by the architect (re-spawn for those rows only), never adjusted by hand.

## Folding

```
mid'     = mid − Σ PD saved (accepted lines naming the row)
PD final = mid' × (1 + buffer) × (1 + overhead_pct / 100)      → nearest 0.25
```

- **Overhead** (PM + QA %) is folded into every row and stated once in §2. If the RFP asks for PM/QA as separate lines, set overhead 0 and add *Services* rows instead.
- **Risk buffer** per profile: `folded` multiplies every row by `(1 + buffer_pct/100)` after the fold above; `separate` adds one line in §2 and leaves rows untouched. The fixed-price scope = the Must rows in PD, plus the separate buffer line when that mode is used.
- **Foundation efforts** (theme base, integration framework, environments, migration tooling) are rows in their own right when the RFP has a row for them; otherwise they attach to the row the architect named and that row's Text says so.
- **No money.** No cell, line or report figure carries a currency amount; nothing in the profile is a rate or a fee.

## Edition flip

Rows whose class changes with the plan carry the architect's alternative (plan: class low/mid/high) in the §4 Evidence / risk cell. Until the plan is decided, §2 shows both variants and the plan choice is `Q-1`. On Community, rows that stock B2B Components would cover become `custom` and typically double.

## Non-development rows

- **Commitments** (process, contract, hosting recommendation, references): 0 PD, class `commitment`.
- **Services** (training, documentation, test concept, pen-test coordination, go-live support, migration rehearsal): real PD, class `service`, shown as the *of which Services* line in §2.

## Sanity checks

- The Must total is reported in PD and never compared with the client's stated budget. A partner who wants a lower Must total gets a `Q-n` with the routes in PD: further accepted lines, phasing Should/Could, or the full scope. Never lower a number to fit.
- Sum per area first, then per priority, then the total; write the area subtotals in §2 and re-add once before writing.
- A row whose high is more than 3× its low at `medium` level is a `CQ-n` candidate even without vague phrasing.
- Rows estimated from `reuse` keep the source row's three-point unless the requirement text differs; then re-estimate.

## Partner profile

Path: `specs/rfp-partner-profile.md`. Read every run. Missing: write the template below with `_TBD_` everywhere and add a `high` `Q-n` asking for overhead, buffer and the platform preferences. `_TBD_` overhead or buffer means PD final is stated before both, said in §2, and caps *Estimate basis* at 70.

```markdown
# RFP partner profile

| | |
| --- | --- |
| **Partner** | <name> |
| **Updated** | YYYY-MM-DD |

Effort and platform defaults only. The partner converts PD to an offer outside the skill.

## 1. Overhead
- **PM + QA overhead:** <n>% <!-- combined, folded into every row -->

## 2. Risk buffer
- **Buffer:** <n>% · mode `folded` | `separate`

## 3. Preferred platforms
| Item | Preference | Note |
| --- | --- | --- |
| Shopware plan | <Rise · Evolve · Beyond, or "per RFP"> | |
| Hosting | <provider> | <!-- region, managed / PaaS --> |
| PSP | <provider> | |
| CMP | <product> | |
| Store plugins commonly used | <names> | |

## 4. Compliance scale when the RFP has none
`Stock | Config | Plugin | Custom | Not offered`

## 5. Reusable assets
| Asset | Covers | PD saved | Ownership / licence |
| --- | --- | --- | --- |
| <own plugin> | <rows/themes> | <n> | |

## 6. Standard exclusions and delivery defaults
- Warranty <n> months · maintenance offer <scope summary>
- Always excluded: <list>

## 7. Response language
`auto` <!-- follows the RFP --> | en | de
```
