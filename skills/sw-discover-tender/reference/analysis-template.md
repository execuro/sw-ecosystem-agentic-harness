# Analysis template

Copy verbatim, fill, delete every `<!-- -->` hint. The document is written in stages (SKILL.md *Staged writes*): the first write carries §1 complete — including §1.1 Meta, §1.2 Company & context, §8 Integrations and §9 Glossary, which need no estimate — plus every source row as a `queued` `req` line, with §2/§3/§5/§6/§7 `_TBD_`. Every later write must leave all nine sections and the four §1 subsections in place and parseable — a live page re-renders on each one. Section numbers, subsection numbers and titles are fixed; the rubric, reconciliation, the editor's tabs and the export key off them. Unknown content stays `_TBD_`; a parameter the tender does not state is `_not provided_`; an empty section is a signal, an invented one is a defect. Every assumption line is written as `[ ]`.

The nine sections mirror the client's own document where it has one: §1.1 Meta and §1.2 Company & context, §4 grouped by source table, §8 Integrations and §9 Glossary are the tender's material; §2, §3, §5, §6 and §7 are ours.

---

```markdown
---
rfp: RFP-NNNN
kind: rfp                      # rfp | rfi | rfq
client: <name>
source:
  - {file: <name as given>, size: <bytes>, sha256: <hex>}
shopware: <version> <edition> (<evidence>); PHP <version> (<evidence>)
status: Draft                  # Draft | Review | Ready to submit
batch: 50                      # requirement rows per estimate run; all = one run for the whole document
confidence: 0
updated: YYYY-MM-DD
counts:
  rows: 0
  assumptions: {proposed: 0, accepted: 0, rejected: 0, suspect: 0}
  questions: {client: 0, blocking: 0, partner: 0, high: 0}
  clarifications: 0
export: {date: null, files: [], source_sha256: null, stale: false}
---

# RFP-NNNN — <Client> — <Project>

## 1. Context

### 1.1 Meta

Every field below is present. The tender is silent: `_not provided_`. Values are the client's words, dates as the client wrote them (their time zone kept).

| Field | Value | Source |
| --- | --- | --- |
| RFP reference | <!-- HIB-RFP-2026-03 --> | <!-- 1 Cover · RFP reference --> |
| Kind | <!-- rfp / rfi / rfq, as the document calls itself --> | |
| Issuing company | | |
| Address | | |
| Contact | <!-- name, role, address as given --> | |
| Technical contact | | |
| Date of issue | | |
| Questions until | <!-- with the answer-distribution rule if stated --> | |
| Proposal due | | |
| Vendor presentations | | |
| Contract award | | |
| Kickoff | | |
| Go-live | <!-- and whether it is fixed or a target, if stated --> | |
| Response instructions | <!-- which columns to fill, which documents to submit, page limits --> | |
| Compliance tokens | <!-- the client's own token list verbatim, or "none stated; scale: …" --> | |
| Effort unit | <!-- PD / hours / none stated --> | |
| Evaluation weights | | |
| Deliverables | | |
| Confidentiality | | |
| Attachments | <!-- listed by name; note which are referenced but not supplied --> | |
| Out of scope per RFP | <!-- the client's own exclusions; each also an X-n in §3 --> | |
| Budget as stated | <!-- verbatim, or "none stated". Context only: never compared, never priced --> | |

### 1.2 Company & context

**Profile.** <!-- business, customers, markets, sales organisation — the client's own summary in two or three lines -->

**Current landscape.** <!-- shop platform and version, ERP, other systems, today's integration — one line each -->

**Pain points and goals.** <!-- what the client says is broken, and the goals/KPIs they state -->

**Constraints.** <!-- what the client fixes: leading system, who designs, cutover model, out of scope. Budget stays in §1.1 -->

**Key parameters.** The fixed template is `reference/context-parameters.md` in this skill's directory: every row P-01…P-50 is present, in order, whether or not the tender states it. Never derived from another row, never carried over from another tender.

| # | Parameter | Value | Source | Drives | Status |
| --- | --- | --- | --- | --- | --- |
| P-01 | Sellable SKUs / variants | <!-- 25,000 --> | <!-- 2 Company & Context · Volumes/Products --> | import, indexing, migration, search | stated |
| P-12 | Customer-specific price rows | _not provided_ | — | price sync volume, performance | _not provided_ ⚠ CQ-7 |

**Migration inventory.** The client's own inventory, verbatim; the approach column is ours. Volumes live here and are cited, never restated, by §6.

| # | Object | Source | Volume | Must migrate | Approach | Rows | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M-1 | <!-- products and variants --> | <!-- SW5 database + ERP --> | <!-- 25,000 SKUs / 6,000 parents --> | <!-- Yes / No / Partly / Should, client's word --> | <!-- ours, one line; "_TBD_" until §6 decides --> | <!-- MIG-01, INT-01 --> | |

No inventory in the tender: one line `No migration inventory in the tender` and, when the tender asks for a migration at all, a `CQ-n` per P-44.

### 1.3 Source map

| # | Table (sheet / section) | Rows | Id column | Vendor columns (client's words) | Tokens | Effort unit | Locator |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | <!-- 2 Requirements --> | <!-- 91 --> | ID | <!-- every vendor column verbatim; cost columns listed, never filled --> | <!-- Stock, Config, Plugin, Custom, Not offered — or "none stated; scale: …" --> | PD | <!-- rows 2–92 / page 4–9 --> |

Every table in the source appears here exactly once, including the ones that carry no requirement row: its `Rows` count stands, its Id column is `—`, and its Vendor columns cell says where its content went — `context → §1.1`, `context → §1.2`, `context → §8`, `context → §9`, or `unused — <reason>`. A table is never silently dropped.

Minted IDs: <!-- R-1..R-n for prose sources with page or paragraph, or "none" --> · Prefilled vendor cells: <!-- none | rows … (kept) --> · Ignored: <!-- hidden or _-prefixed sheets by name, or "none" --> · Warnings: <!-- missing attachments, truncated text, or "none" -->

### 1.4 Ground truth

Shopware <!-- version, edition, evidence --> · Project plugins <!-- name: covers, or "none" --> · Partner assets <!-- from the profile, or "none" --> · Prior analyses reused <!-- rfp-NNNN <ID> → row, or "none" --> · KB pages <!-- one line --> · Agents <!-- PM clusters …; architect clusters …; QA yes|no; not consulted — <reason> -->

## 2. Summary

| Scope | PD |
| --- | --- |
| Must (fixed-price scope) | |
| Should | |
| Could | |
| of which Services | |
| **Total** | |

By area: <!-- area: PD, … — must add up to the priority totals --> · Foundation efforts: <!-- name → row (PD) --> · Overhead / buffer: <!-- n% folded · buffer n% separate · level buffers 0/10/25%, or "_TBD_ — PD stated before overhead and buffer" --> · Plan variants: <!-- Evolve: Must n · Community: Must n, or "single variant" --> · Blocking rows: <!-- ids, or "none" -->

| Dimension | Weight | Score | Points |
| --- | --- | --- | --- |
| Coverage evidence | 20 | 0 | 0.0 |
| Estimate basis | 20 | 0 | 0.0 |
| Scope lock | 20 | 0 | 0.0 |
| Platform decision | 15 | 0 | 0.0 |
| Integration & migration | 15 | 0 | 0.0 |
| Consistency | 10 | 0 | 0.0 |
| **Total** | **100** | | **0%** |

Weakest dimension: <!-- name — what raises it; every status blocker by id -->

## 3. Global assumptions

Lines no single row owns. Same status grammar as §4.

| ID | Kind | Rows | Statement | PD saved | Risk to | Status |
| --- | --- | --- | --- | --- | --- | --- |
| A-1 | assume | <!-- GEN-06, STF-01..STF-10 --> | <!-- rewritten for this tender --> | <!-- per row: STF-01 −5 · STF-03 −3 --> | client | [ ] |
| X-1 | exclude | <!-- GEN-04 --> | <!-- what the RFP itself excludes, restated --> | | | rfp |
| RC-1 | clarify | <!-- rows --> | <!-- decision --> | | client, CQ-5 | YYYY-MM-DD |

## 4. Requirement analysis

| ID | Kind | Prio | Class | L/M/H | Lvl | PD | Text | Evidence / risk | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STF-03 | req | Must | custom | 12/16/22 | vague | 17.5 | <!-- mechanism, one line; "Includes foundation: <name> (n PD)" --> | <!-- pm: not-stock (…); arch: vendor path / KB page; unverified; reuse: rfp-NNNN ID --> | estimated, CQ-3 |
| STF-03.a1 | assume | | | | | −5 | <!-- statement --> | risk to client | [ ] |
| STF-03.a2 | assume | | config | | | −2 | <!-- statement --> | risk to client | accepted YYYY-MM-DD |
| STF-03.c1 | clarify | | | | | | <!-- decision --> | client, CQ-3 | YYYY-MM-DD |

Kinds: `req` one per source row · `assume` `<ROW>.a<n>` · `clarify` `<ROW>.c<n>`. Req status: `queued` (extracted, not yet estimated — PD and L/M/H empty) · `analysing` (its agents are running) · `estimated` · `estimated, CQ-n` (estimated, with an open question named; the estimate's condition is a `[ ]` assumption line under the row) · `blocked, CQ-n` or `blocked, Q-n` (PD empty; a partner question blocks the same way) · `prefilled`. There is no `provisional` status: a row is either estimated — under stated assumptions and, where needed, an open question — or blocked. A finished run leaves no `queued` or `analysing` row. Assume status: `[ ]` · `[x]` · `[-]` · `accepted YYYY-MM-DD` · `rejected YYYY-MM-DD` · `[ ] suspect`. Class on an assume line = the class the row takes once accepted. Lvl `detailed | medium | vague`.

## 5. Open questions

### CQ-1 · <!-- rows --> · blocking: <!-- yes | no -->
<!-- question, RFP language, one decision -->
- [ ] A — <!-- option: effect on scope in plain words -->
- [ ] B — <!-- option -->
- [ ] Other:
Until answered we assume <!-- option, or "no effort stated" -->.

### Q-1 · <!-- high | medium | low --> · <!-- rows or § -->
<!-- question the partner can answer -->
- [ ] A — <!-- option (recommended): consequence in PD -->
- [ ] B — <!-- option -->
- [ ] Other:
Until answered we assume <!-- option -->.

Not sent — cap: <!-- row ids, or "none" -->

## 6. Approach

| Item | Decision | Reason (rows served, source) | Alternative · PD delta |
| --- | --- | --- | --- |
| Plan | <!-- Community / Rise / Evolve / Beyond --> | | <!-- Community: +n PD --> |
| Hosting | | | |
| PSP | | | |
| CMP | | | |

| Interface | Pattern | Owner split | Risk |
| --- | --- | --- | --- |
| <!-- ERP → shop master data --> | <!-- queue consumers, idempotent upserts --> | <!-- bidder: shop side; ERP partner: API pages --> | <!-- one line --> |

| Migration object | Approach | Volume | Tool | Reuse |
| --- | --- | --- | --- | --- |
| <!-- products --> | | | | |

## 7. Log

Append-only. Never a transcript.

| ID | Date | Topic | Decision |
| --- | --- | --- | --- |
| C-1 | YYYY-MM-DD | <!-- accepted / rejected / answered / suspect / exported / partner decision --> | <!-- one line, ids named --> |
| K-1 | YYYY-MM-DD | <!-- PM vs architect on B2B-03 --> | <!-- resolved: … / → Q-n --> |

## 8. Integrations

The client's integration register, verbatim; `Class` and `Risk` are ours. One line per interface the tender names, in source order. §6's Interface table decides the pattern and the owner split and cites these numbers instead of repeating them.

| # | System | Direction | Objects | Frequency | Protocol | Counterpart owner | Rows | Class | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| I-1 | <!-- Microsoft Dynamics 365 Business Central --> | <!-- ERP → shop, client's arrow kept --> | <!-- products, prices, stock --> | <!-- nightly full, 15-min delta --> | <!-- OData v4 REST --> | <!-- client's ERP partner --> | <!-- INT-01, CAT-01..CAT-10 --> | <!-- stock / config / plugin / custom / service, or _TBD_ before the estimate --> | <!-- one line, or "—" --> |

No integration table in the tender: one line `No integration register in the tender`, and every interface named inside a requirement row still gets a line here, `Source: <row id>` in Notes-position of the `#` cell. This section is never exported; it is not a response table.

## 9. Glossary

The client's terms, verbatim, in the client's order. `Maps to` is ours: the Shopware or partner vocabulary the term corresponds to, and the row ids that use it — this is the mapping the Tender Discovery Tool shows on the requirement rows.

| Term | Meaning | Maps to |
| --- | --- | --- |
| <!-- PU / Packaging unit --> | <!-- the client's definition, verbatim --> | <!-- purchase unit / `purchaseUnit`, `referenceUnit` · CAT-07, CHK-02 --> |

A term the client defines but nothing in Shopware matches: `Maps to` = `no equivalent — <one line>`. A term we cannot map yet: `_TBD_`. Never invent a definition, never correct the client's. No glossary in the tender: one line `No glossary in the tender`. This section is never exported; it is not a response table.
```

---

Status grammar:

```
[ ]  proposed  --human--> [x] | [-]  --next run--> accepted YYYY-MM-DD (frozen, PD applied, row recomputed, C-n)
                                                   rejected YYYY-MM-DD (row at full scope, C-n)
source sha256 changed   --next run-->  affected accepted lines become [ ] suspect (C-n)
question option ticked  --next run-->  .c line under each row named, or RC-n in §3; the block dissolves (C-n)
```

Every source row has one `req` line; none is dropped to shorten the file. A `_TBD_` cell is a truthful gap; a guessed one reaches the client as a wrong number. `_not provided_` in §1.2 is the same promise about the tender: it says the client never stated the figure, not that the figure is zero or unknown to us.

Export (SKILL.md step 9) reads §1.3, §2 and §4 only. §1.1, §1.2, §8 and §9 are analysis context and are never written into a response CSV.
