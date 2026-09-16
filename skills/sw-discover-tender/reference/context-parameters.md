# Context parameters — what we expect a tender to state

The fixed template behind §1.2 *Key parameters*. Every row below is written into the
analysis on the skeleton write, in this order, with its `#` and `Parameter` verbatim
from this file — a tender that states nothing still produces the full table. The
`Value` cell is the client's own words, never rounded, never converted, never inferred
from another parameter. Where the source is silent the cell reads `_not provided_`.

These are the figures that move an estimate: catalog and price-row counts drive import,
sync and migration effort; order and traffic figures drive performance, hosting and load
testing; customer and role counts drive the B2B model; media volume drives the migration
window. A number the tender never stated and nobody asked for is the most expensive kind
of gap, because it surfaces after the fixed price is signed.

## Grammar

| Column | Rule |
| --- | --- |
| `#` | `P-01` … `P-50`, fixed by this file. Never renumbered, never reordered, never dropped. |
| `Parameter` | verbatim from this file. |
| `Value` | the client's words, with their own unit and qualifier (`~6,000`, `approx. 850`, `38 GB`), or `_not provided_`. Several source statements: join with ` · `. |
| `Source` | `<source-map #> <sheet or section> <row or cell label>`, e.g. `2 Company & Context · Volumes/Products`. `—` when `_not provided_`. |
| `Drives` | copied from this file — what the figure changes in the estimate. |
| `Status` | `stated` · `_not provided_` · `_not provided_ ⚠ CQ-n` · `conflicting` (two source statements disagree — always also a `CQ-n`). |

A parameter marked **drv** below is estimate-driving: when its Status is `_not provided_`
it MUST raise a `CQ-n` (SKILL.md step 6, `client-question-rules.md`) and the Status cell
names that question. A non-**drv** gap is recorded and left alone — it is context, not a
blocker. `conflicting` always raises a `CQ-n` regardless of **drv**.

Never derive one parameter from another (25,000 SKUs in 6,000 parents does not license
writing `~4 variants per parent` into P-02), and never carry a figure over from a
different tender.

## The template

| # | Parameter | Group | Drives | drv |
| --- | --- | --- | --- | --- |
| P-01 | Sellable SKUs / variants | Catalog | import, indexing, migration, search | drv |
| P-02 | Parent products | Catalog | catalog modelling, PDP work | drv |
| P-03 | Categories | Catalog | navigation, migration, SEO | drv |
| P-04 | Technical attributes / properties (and values) | Catalog | property model, filters, ERP mapping | drv |
| P-05 | Product images (count and storage volume) | Catalog | media migration, CDN, cutover window | drv |
| P-06 | Product documents (datasheets, certificates) | Catalog | media or ERP-link decision, migration | drv |
| P-07 | Hazardous / regulated product share | Catalog | compliance fields, shipping rules | |
| P-08 | Packaging units, MOQ, order increments | Catalog | cart and pricing logic | |
| P-09 | Languages / translations | Catalog | snippets, content, ERP language feeds | drv |
| P-10 | Sales channels and domains | Catalog | channel config, theme, caching | drv |
| P-11 | Customer groups / price lists | Pricing | pricing model, ERP sync | drv |
| P-12 | Customer-specific price rows | Pricing | price sync volume, performance | drv |
| P-13 | Tier / scale price coverage | Pricing | pricing rules, import | |
| P-14 | Net / gross display rule | Pricing | storefront pricing, tax config | |
| P-15 | Currencies | Pricing | currency config, rounding | |
| P-16 | Countries / VAT and delivery scope | Pricing | tax, shipping, legal texts | |
| P-17 | Companies / accounts | Customers | B2B model, migration | drv |
| P-18 | Contacts / users | Customers | login migration, roles | drv |
| P-19 | Addresses | Customers | migration, address model | |
| P-20 | B2B roles, budgets, approval workflows | Customers | B2B Components vs plugin vs custom | drv |
| P-21 | Punch-out / procurement accounts | Customers | OCI / cXML scope | drv |
| P-22 | Orders per day (average) | Orders & traffic | sizing, queue and worker design | drv |
| P-23 | Orders per day (peak) | Orders & traffic | load test target, hosting | drv |
| P-24 | Average order value | Orders & traffic | context only, never priced | |
| P-25 | Lines per order | Orders & traffic | cart performance, ERP payload | |
| P-26 | Order history to migrate (orders and lines) | Orders & traffic | migration volume and window | drv |
| P-27 | Sessions per month | Orders & traffic | caching, hosting | drv |
| P-28 | Peak concurrent users | Orders & traffic | load test target, hosting | drv |
| P-29 | Device split | Orders & traffic | responsive and mobile scope | |
| P-30 | CMS / shop pages | Content & media | Shopping Experiences rebuild | |
| P-31 | Blog posts | Content & media | blog scope, migration | |
| P-32 | Landing pages | Content & media | rebuild effort | |
| P-33 | Indexed SEO URLs / redirects | Content & media | redirect map, SEO risk | drv |
| P-34 | Leading system (ERP) and version | Systems | integration pattern, ownership | drv |
| P-35 | ERP protocol and API surface | Systems | connector effort, real-time feasibility | drv |
| P-36 | PIM | Systems | catalog ownership | |
| P-37 | CRM | Systems | interface scope | |
| P-38 | Marketing / newsletter systems | Systems | interface scope | |
| P-39 | PSP and payment methods | Systems | payment scope, PCI posture | drv |
| P-40 | CMP / consent and analytics | Systems | consent scope, tracking | |
| P-41 | Search / indexing infrastructure | Systems | OpenSearch, relevance work | |
| P-42 | SSO / identity provider | Systems | admin and customer login scope | |
| P-43 | Source platform and version | Migration | migration tooling, effort | drv |
| P-44 | Migration objects and volumes | Migration | see §1.2 Migration inventory | drv |
| P-45 | Cutover model and freeze window | Migration | go-live plan, risk | drv |
| P-46 | Hosting model, region and certification | Commercial & timeline | hosting recommendation, operations | |
| P-47 | Shopware edition / plan expectation | Commercial & timeline | plan decision, class ladder | drv |
| P-48 | Budget as stated (verbatim, context only) | Commercial & timeline | recorded, never compared, never priced | |
| P-49 | Questions-until / proposal due dates | Commercial & timeline | question deadline, run planning | |
| P-50 | Award, kickoff and go-live dates | Commercial & timeline | plan feasibility, phasing | drv |

Dates in P-49 and P-50 are also written into §1.1 Meta; §1.2 keeps them so the
parameter table is complete on its own. They are the same values, quoted the same way.

## Question stubs for a missing **drv** parameter

`client-question-rules.md` governs the wording; these are the decisions to offer. Ask
for the figure, never for a design.

| # | Question | Options to offer |
| --- | --- | --- |
| P-01 · P-02 · P-03 · P-04 | catalog size | brackets that change the class, e.g. `< 5,000 SKUs` · `5,000–50,000` · `> 50,000`, plus `Other:` |
| P-05 · P-06 | media count and storage volume | brackets in files and GB |
| P-09 | which languages, and who supplies the translations | `client supplies` · `bidder translates UI only` · `bidder translates all` |
| P-10 | how many sales channels and domains | `one` · `one per country` · `Other:` |
| P-11 · P-12 · P-13 | how prices are structured and how many customer-specific rows | brackets |
| P-17 · P-18 · P-20 · P-21 | company/contact counts, and which B2B roles and approval rules apply | the role model options |
| P-22 · P-23 · P-26 · P-27 · P-28 | order and traffic figures, and how much history must be migrated | brackets; `no history` · `2 years` · `5 years` · `all` |
| P-33 | indexed URLs and whether a redirect map is required | `redirect map required` · `not required` |
| P-34 · P-35 | leading system, its version and the API it offers | `documented REST/OData` · `file exchange only` · `to be built by the client's partner` |
| P-39 | PSP and payment methods in scope | the method list |
| P-43 · P-44 · P-45 | source platform, migration objects and the cutover model | `big-bang` · `phased` · `Other:` |
| P-47 | which edition/plan the client expects to licence | `Community` · `Rise` · `Evolve` · `Beyond` · `bidder recommends` |
| P-50 | the go-live date and whether it is fixed | `fixed` · `target` · `Other:` |

One question may cover a whole group of missing parameters in that table (one `CQ-n`
for "catalog size", not four); every parameter it covers names it in its Status cell.
The cap in SKILL.md step 6 applies to these questions like any other.
