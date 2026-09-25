# Assumption catalogue

Starting points, not answers. Every Configuration, Extension, ISV or Custom item gets 1-3 proposals in the architect's report, catalogue keys first, each rewritten for the tender at hand as one client-agreeable, scope-locking sentence, in its report JSON's `proposals` (per item) or `globalProposals` (section 3) array — schema in `agent-briefs.md` — each with the `pdSaved` it would save against the item's un-assumed estimate, greater than 0 and no greater than the item's own effort. `noProposal` is for an item only when its already-accepted assumptions already cover it. The runtime's proposal store (`specs/.rfp/<slug>/proposals.json`) is the only place a proposal lives until the operator accepts it (AQ-2); a rejected proposal is never proposed again for the same item (AQ-4), matched by its normalised statement.

Keys below use the `AS-` prefix so they never collide with a scope item id, a `CQ-n`/`Q-n`, a proposal `P-n` or a log entry — none of those families ever starts with `AS-`. `pdSaved` is a typical figure for a mid-size B2B project; the architect states the real figure for the tender at hand. A statement the client's own document already makes is a section 3 Exclusion, not an assumption.

## AS-PLAT — platform and edition

| Key | Statement | pdSaved | Not when |
| --- | --- | --- | --- |
| AS-PLAT-01 | Target is the current Shopware 6.x minor at kickoff; no core modifications; all customisation in plugins, apps and the theme. | 0 (creep guard) | the client pins an older version |
| AS-PLAT-02 | One sales channel per country/language pair the client lists, one currency; further channels, languages or currencies are separately scoped. | 5 | — |
| AS-PLAT-03 | Commercial-plan features are used as shipped; changes to their UI or flows are separately scoped. | 15 | an acceptance criterion contradicts stock behaviour |

## AS-ERP — integration

| Key | Statement | pdSaved | Not when |
| --- | --- | --- | --- |
| AS-ERP-01 | The counterpart implements the far-side endpoints from an interface specification we write; we build the shop side only. | 15 | the item asks for both sides |
| AS-ERP-02 | One synchronisation pattern for all objects: queue consumers, idempotent upserts keyed by external id; no middleware or iPaaS. | 8 | the client requires an iPaaS |
| AS-ERP-03 | Customer-specific and tier pricing is imported asynchronously (full, delta or webhook as stated); no live call per page view. | 10 | the client demands a per-request live lookup |

## AS-DSGN — design and theme

| Key | Statement | pdSaved | Not when |
| --- | --- | --- | --- |
| AS-DSGN-01 | The client's own designs are delivered per page type before the sprint that builds it; one revision round included. | 10 | we own design |
| AS-DSGN-02 | The theme extends the default Storefront theme; stock components are restyled, not rebuilt. | 6 | — |

## AS-MIG — content and data migration

| Key | Statement | pdSaved | Not when |
| --- | --- | --- | --- |
| AS-MIG-01 | Content, blog and landing pages are rebuilt by the client's own team after training; we deliver example layouts only. | 10 | the client requires a full 1:1 migration |
| AS-MIG-02 | Historical orders are migrated read-only for display; no reorder from migrated lines. | 6 | reorder from migrated orders is a stated requirement |

## AS-B2B — accounts, approval, quotes

| Key | Statement | pdSaved | Not when |
| --- | --- | --- | --- |
| AS-B2B-01 | Employee roles and order-approval thresholds use B2B Components as shipped; one threshold type per company. | 20 | the plan has no B2B Components |
| AS-B2B-02 | Quotes use stock quote management; one counter-offer cycle, no negotiation thread. | 6 | the plan has no B2B Components |

## AS-SRCH — search

| Key | Statement | pdSaved | Not when |
| --- | --- | --- | --- |
| AS-SRCH-01 | Search is the stock OpenSearch/Elasticsearch integration with field boosting on the identifiers named; no machine-learned ranking, no personalisation. | 12 | — |

## AS-OPS — hosting, operations, security

| Key | Statement | pdSaved | Not when |
| --- | --- | --- | --- |
| AS-OPS-01 | Managed Shopware hosting per the profile's preferred provider; availability, backup and restore per the provider's SLA. | 6 | the client requires self-operated infrastructure |
| AS-OPS-02 | Monitoring and alerting use the provider's stack plus Shopware admin notifications; no custom dashboards. | 4 | — |

## AS-CMPL — compliance and accessibility

| Key | Statement | pdSaved | Not when |
| --- | --- | --- | --- |
| AS-CMPL-01 | Accessibility conformance covers templates and components we build; client-authored content and third-party widgets are excluded. | 6 | — |
| AS-CMPL-02 | Invoices, credit notes and e-invoices are produced by the counterpart system; the shop displays and links them. | 10 | the requirement is shop-generated fiscal documents |

## AS-PAY — payment and shipping

| Key | Statement | pdSaved | Not when |
| --- | --- | --- | --- |
| AS-PAY-01 | Cards and wallets via the official ISV plugin of the profile's preferred provider, hosted payment page; no custom PSP integration. | 5 | the client names a provider with no official plugin |
| AS-PAY-02 | Shipping methods and their pricing via stock methods and rules; no carrier API, no label printing in the shop. | 6 | labels from the shop are a stated requirement |
