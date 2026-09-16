# Scope-lock assumption catalogue

Starting points, not answers. The architect proposes candidates by key (or `new`), each naming its row id or `global`; the statement is rewritten for the tender at hand and lands as a `[ ]` line: `<ROW>.a<n>` under its row, or `A-n` in §3 when no single row owns it. A statement that the RFP already makes is an exclusion `X-n` in §3 (0 PD), not an assumption.

**PD saved** is the typical reduction against the unassumed mid estimate for a mid-size B2B replatforming; the architect states the real figure per RFP. **Risk shifted to** names who carries the consequence if the assumption fails. **Not when** lists the RFP conditions under which the key must not be proposed.

## PLAT — platform and edition

| Key | Statement | PD saved | Risk → | Not when |
| --- | --- | --- | --- | --- |
| K-PLAT-01 | Target is the current Shopware 6.x minor at kickoff; no core modifications; all customisation in plugins, apps and the theme. | 0 (creep guard) | none | RFP pins an older version |
| K-PLAT-02 | "Headless-ready" means Store API discipline in all custom code; no SPA or composable frontend is delivered (`<rows>`). | 20–40 | client | RFP names a headless frontend deliverable |
| K-PLAT-03 | One sales channel per country/language pair the RFP lists, one currency; further channels, languages or currencies are change requests. | 3–8 | client | — |
| K-PLAT-04 | Commercial plan features are used as shipped; changes to their UI or flows are out of scope (`<rows>`). | 10–30 | client | an acceptance criterion contradicts stock behaviour |
| K-PLAT-05 | Minor updates within the project; the first major upgrade belongs to maintenance. | 0 (creep guard) | none | — |

## ERP — integration

| Key | Statement | PD saved | Risk → | Not when |
| --- | --- | --- | --- | --- |
| K-ERP-01 | The ERP partner implements the ERP-side endpoints from an interface specification the bidder writes; the bidder builds the shop side only (`<rows>`). | 10–20 | ERP partner | bidder is asked to deliver both sides |
| K-ERP-02 | One synchronisation pattern for all objects: queue consumers, idempotent upserts keyed by external id; no middleware or iPaaS. | 5–15 | none | RFP requires an iPaaS |
| K-ERP-03 | Sync failures: automatic retry, admin notification, admin list with manual retry; no reconciliation or diff UI. | 5–10 | client ops | — |
| K-ERP-04 | Customer-specific and tier prices are imported asynchronously (full, delta, webhook as the RFP states); no live ERP price call per page view. | 8–15 | client (staleness inside the sync window) | RFP demands per-request live prices |
| K-ERP-05 | Real-time checks (credit limit, branch stock) use exactly the timeout and fallback the RFP states; no additional fallback logic. | 0–3 | none | — |
| K-ERP-06 | Field mapping is fixed in one mapping workshop; fields absent from the ERP partner's API list on that date are change requests. | 3–5 | client | — |

## DSGN — design and theme

| Key | Statement | PD saved | Risk → | Not when |
| --- | --- | --- | --- | --- |
| K-DSGN-01 | The client's agency delivers final, approved designs per page type before the sprint that builds it; one revision round included; later changes are change requests. | 10–15 | client | bidder owns design |
| K-DSGN-02 | The theme extends the default Storefront theme; stock components are restyled, not rebuilt; breakpoints as the RFP lists, no pixel-perfect commitment beyond them. | 5–10 | client | — |
| K-DSGN-03 | Printable product sheet = browser print stylesheet; no server-side PDF generation (`<rows>`). | 3–6 | client | RFP requires a downloadable PDF with branding |
| K-DSGN-04 | The design feasibility review covers implementability in Shopware, not UX advice; at most `<n>` page templates. | 2–4 | client | — |

## MIG — content and data migration

| Key | Statement | PD saved | Risk → | Not when |
| --- | --- | --- | --- | --- |
| K-MIG-01 | Content, blog and landing pages are rebuilt by client marketing in Shopping Experiences after training; the bidder delivers `<n>` layouts and migrates `<m>` pages as examples (`<rows>`). | 8–15 | client | RFP demands 1:1 migration with acceptance |
| K-MIG-02 | The SEO redirect map is generated from the URL export the client provides; the bidder imports it and tests the list the RFP names. | 3–5 | client | — |
| K-MIG-03 | Historical orders are migrated read-only for display; no reorder from migrated lines, no document regeneration. | 5–10 | client | an acceptance criterion requires reorder from migrated orders |
| K-MIG-04 | Product documents stay in the ERP or document storage and are linked, not migrated as media (`<rows>`). | 5–10 | ERP partner | — |
| K-MIG-05 | Passwords are re-hashed on first login through a legacy encoder; no forced reset campaign; accounts inactive for more than `<n>` years are not migrated. | 1–3 | client | — |
| K-MIG-06 | Objects the RFP marks "not migrated" (reviews, vouchers, newsletter recipients) are exclusions. | 0 | none | — |
| K-MIG-07 | One migration rehearsal on staging and one production cutover; further rehearsals are change requests. | 3–8 | shared | RFP prescribes more rehearsals |

## B2B — accounts, approval, quotes

| Key | Statement | PD saved | Risk → | Not when |
| --- | --- | --- | --- | --- |
| K-B2B-01 | Employee roles, order approval and budgets use B2B Components as shipped; one threshold type per company (`<rows>`). | 15–30 | client | Community plan chosen |
| K-B2B-02 | Quotes use stock quote management; one counter-offer cycle, no negotiation thread. | 5–10 | client | Community plan chosen |
| K-B2B-03 | Quick order = manual multi-row entry plus paste/CSV `sku;qty`; XLSX upload only if stock supports it. | 3–6 | client | RFP acceptance names XLSX |
| K-B2B-04 | One company hierarchy level (company → employees); cost centres are a list attribute, not organisational units. | 5–15 | client | RFP names multi-level units |
| K-B2B-05 | Order on behalf uses the stock imitate-customer capability; audit = order flag plus admin log, no separate report. | 2–5 | client | — |
| K-B2B-06 | Registration approval happens in the shop admin; the ERP writes back the customer number; approval never happens in the ERP. | 3–6 | client process | RFP requires approval in the ERP |

## SRCH — search

| Key | Statement | PD saved | Risk → | Not when |
| --- | --- | --- | --- | --- |
| K-SRCH-01 | Search = stock OpenSearch/Elasticsearch integration with field boosting on the identifiers the RFP names; no machine-learned ranking, no personalisation (`<rows>`). | 10–20 | client | — |
| K-SRCH-02 | Synonyms and stop words are maintained by the client in the admin; the bidder migrates the existing list once. | 2–4 | client | — |
| K-SRCH-03 | "As good as `<competitor>`" is replaced by measurable acceptance: exact-match identifier search opens the product, prefix suggestions, typo tolerance of one edit. | makes the row estimable | client | client rejects the acceptance in `CQ-n` |

## OPS — hosting, operations, security

| Key | Statement | PD saved | Risk → | Not when |
| --- | --- | --- | --- | --- |
| K-OPS-01 | Managed Shopware hosting from `<profile.hosting>`; availability, backup and restore per the provider's SLA; the bidder is not liable for infrastructure SLAs (`<rows>`). | 5–10 | provider | RFP requires bidder-operated infrastructure |
| K-OPS-02 | The penetration test is commissioned and paid by the client; findings are fixed within the warranty as the RFP states; one retest cycle. | 0 | client | — |
| K-OPS-03 | CI/CD on the client's repository with the bidder's standard pipeline (lint, static analysis, tests, build, deploy); further gates are change requests. | 3–5 | none | — |
| K-OPS-04 | Monitoring and alerting = provider stack plus Shopware admin notifications; no custom dashboards. | 3–6 | client ops | — |
| K-OPS-05 | One load test before go-live against the RFP's stated profile; tuning limited to configuration (cache, workers, indexes). | 2–5 | shared | — |

## CMPL — compliance and accessibility

| Key | Statement | PD saved | Risk → | Not when |
| --- | --- | --- | --- | --- |
| K-CMPL-01 | Accessibility conformance covers templates and components the bidder builds; client-authored content, third-party widgets and manufacturer PDFs are excluded (`<rows>`). | 5–10 | client | — |
| K-CMPL-02 | Consent management = `<profile.cmp>` stock plugin; no custom consent UI; tag configuration by client marketing. | 2–4 | client | — |
| K-CMPL-03 | Invoices, credit notes and e-invoices are produced by the ERP; the shop displays and links them and never generates fiscal documents (`<rows>`). | 8–15 | ERP partner | RFP wants shop-generated invoices |
| K-CMPL-04 | Legal texts are supplied by the client in every language; the bidder places them. | 1–2 | client | — |
| K-CMPL-05 | Data-subject requests use stock export and anonymisation; no custom workflow UI. | 2–4 | client | — |

## PAY / SHP — payment and shipping

| Key | Statement | PD saved | Risk → | Not when |
| --- | --- | --- | --- | --- |
| K-PAY-01 | Payment on account = stock payment method with rule-based availability from synced ERP flags; payment terms shown from a synced text field. | 2–4 | none | — |
| K-PAY-02 | Cards and wallets via the official plugin of `<profile.psp>` with a hosted payment page; no custom PSP integration. | 3–8 | PSP | RFP names a PSP without an official plugin |
| K-SHP-01 | Shipping methods and prices via stock methods and rules from the client's shipping table; no carrier API, no label printing in the shop. | 5–10 | none | RFP requires labels from the shop |
| K-SHP-02 | Branch pickup = shipping method plus an availability text from a synced branch-stock field; no reservation or transfer logic in the shop. | 3–6 | client | — |

## PROJ — project

| Key | Statement | PD saved | Risk → | Not when |
| --- | --- | --- | --- | --- |
| K-PROJ-01 | The client names one product owner with decision authority and a two-working-day answer SLA; decisions past the SLA are scheduled at the bidder's discretion. | 0 (schedule) | client | — |
| K-PROJ-02 | Acceptance per sprint against the RFP's acceptance criteria; anything outside an RFP row or an accepted assumption is a change request outside the fixed-price scope. | 0 (creep guard) | none | — |
| K-PROJ-03 | Training, documentation and handover as the RFP lists, delivered once and recorded; repeats are billable. | 0 | client | — |
| K-PROJ-04 | The environments the RFP names; additional environments via the provider at the client's expense. | 1–2 | client | — |
