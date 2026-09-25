# Estimation model

A working document is in one regime at a time. Regime = `profile` when `specs/rfp-partner-profile.md` exists and parses, else `T-shirt`. The runtime applies this rule on every run; the architect never decides the regime.

## Regimes

| Regime | When | Estimation cell |
| --- | --- | --- |
| profile | a partner profile exists | The architect's base person-day estimate, one figure, before overhead and buffer. The runtime applies the profile's overhead and buffer and writes `<n> PD` (rounded to 0.25). |
| T-shirt | no profile | The architect gives a `size`; the runtime looks up the default-scale PD and writes `<SIZE> (<n> PD)` — default scale, before overhead and buffer. |

**E-1** One figure per scope item, no low/high range — the architect returns a single `size` (T-shirt) or a single base `pd` (profile) per item in its report JSON; there is no three-point estimate.

**OOTB effort.** T-shirt regime: the architect gives `size: "—"`; the runtime writes `— (0 PD)`. It also derives `— (0 PD)` when the coverage is OOTB and `size` is omitted, so an architect that forgets the field on an OOTB item is not a validation failure. Profile regime: the architect gives `pd: 0`.

## Default scale (T-shirt)

| Size | PD | What makes it this size |
| --- | --- | --- |
| — | 0 | OOTB. |
| XS | 0.5 | A setting, a snippet, a flag. |
| S | 1.5 | One configuration set, or one hook — subscriber, custom field, Flow action, Rule condition. |
| M | 4 | One feature on one surface with its own UI, or a plain ISV install and configuration. No new entity. |
| L | 10 | Administration and Storefront, or a new entity with API and UI, or an ISV integration with real mapping. |
| XL | 25 | A vertical — domain model, admin module, API, storefront, rules — or a two-way interface. |
| XXL | 50 | Too large for one scope item; flagged *not decomposed*. |

**Size-up drivers**, one size each, applied by the architect when sizing: an external counterpart the partner does not control · data migration · a hard non-functional requirement · no stock feature to stand on. Section 1's Project information table is size-up evidence, not a separate driver — high order/traffic volumes, a heavy migration or many sales channels/markets/currencies are what makes a driver apply; cite the relevant Parameter row when it is why an item is sized up.

## Not decomposed

**E-2** A scope item is *not decomposed* when its size is `XXL`, or — in the profile regime — its final Estimation figure (the architect's base `pd`, after the runtime applies overhead and a folded buffer — the only figure the working document stores) is above the profile's big calibration point (the wizard's XL anchor). It is flagged on the page, in section 2 and in the run report, and still exports with its estimate.

## Totals

**E-3** Section 2 totals by priority (the client's own priority values, verbatim) and by tab (`TABS`, one row per tab with items) always equal the sum of the section 4 Estimation cells; the runtime checks this on every `check` run and refuses to write section 2 otherwise.

**E-4** A blocked scope item (`blocked CQ-n`) counts at its fallback option's estimate, marked as such in section 2's "Blocked (at fallback)" column. A scope item with no estimate yet (`queued`, `analysing`, `failed`) is counted in "Not estimated", never as `0`.

**E-5** Every effort figure names its regime — section 2's `Regime:` line, the page, and the run report all state it; an item's Estimation cell format (T-shirt vs plain PD) already carries it.

**E-6** The client's effort column in the export gets the PD number only — no size letter, no unit text.

## Money

No amount, currency symbol or currency code appears in any file the tool writes, ever — that boundary is absolute, except section 1's Project information table, which keeps the client's or the operator's own figure verbatim (`project-information.md`), and a scope item's `cost:` reference, which carries a one-line cost consequence but no amount (`agent-briefs.md`). The words themselves (`price`, `cost`, `rate`, `fee`, `budget`, and their plurals) are narrower:

- **Allowed** in a `kb:`/`project:` reference when it is the Shopware feature, route or admin-surface name itself, quoted verbatim (e.g. a KB page literally titled "Customer-specific Prices").
- **Allowed** in a Client Response when that item's own Requirement text uses the word — mirror the client's own wording back to them; never introduce the word where the client did not use it.
- **Allowed** in a `cost:` reference — money words there are not the issue, an amount is; the amount check still applies to a `cost:` line.
- **Otherwise paraphrase**: write "customer-specific pricing", "a configured amount", "the shop's payment methods" — the `-ing`/descriptive form, not the client's word repeated as if it were the tool's own.
- Never an amount, a currency symbol (`EUR sign`, `dollar sign`, `pound sign`, `yen sign`) or an ISO code (`EUR`, `USD`, `GBP`, `CHF`), under any of the above, `cost:` included.

This applies to Client Response, Assumptions, References, proposals, item fields, section 1 prose, section 2 and section 8 Log, the run report, and a working-sheet export. The client's own verbatim Requirement text and cells, section 1's Project information table (its own verbatim-amounts rule above), section 3 Exclusions, section 6 Integrations and section 7 Glossary (client transcriptions, `sw-tender-editor`'s `context` job) are exempt from the whole rule — the client may state a budget figure; the tool never repeats it as a figure of its own. `check`'s money scan covers that tool-authored text for a currency symbol or an ISO currency code, and for a price/cost/rate/fee/budget word, applying the `kb:`/`project:`/`cost:` exemptions above and, for a proposal statement, the same Requirement-wording exemption as a Client Response; the amount check still applies everywhere, `cost:` included; it refuses with a reason on a match.

## Partner profile

`specs/rfp-partner-profile.md`, gitignored, YAML frontmatter:

```yaml
calibration: { small: <PD>, big: <PD> }
overhead: <percent>
buffer: { percent: <percent>, mode: folded | separate }
isv: [ { name: <name>, vendor: <vendor>, versions: <supported versions> } ]
assets: [ { name: <name>, covers: <what>, pdSaved: <PD> } ]
```

Created and edited in a page wizard, offered when no profile exists, skippable. The wizard shows `calibration.small` with an XS anchor and `calibration.big` with an XL anchor, so both figures mean the same thing across operators. `isv[]` carries no licence field — the money rule is a hard boundary, not a simplification. Creating or changing the profile marks every scope item for re-estimate on the next run.

Estimation formula the runtime applies (profile regime): `round0.25(pd x (1 + overhead/100) x (1 + buffer/100 if folded))`. Buffer mode `separate` states the buffer once in section 2 instead of folding it into each item.
