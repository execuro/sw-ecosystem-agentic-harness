# Gap checklist (Shopware 6)

Scan the drafted PRD against this list. A probe is worth asking **only** when the brief leaves it genuinely open *and* the two plausible answers produce different requirements. Most probes will not apply to most PRDs — skip them silently.

Never turn a probe into a technical question. "Which customer groups get the discount?" is a requirement. "Should this use the Rule Builder or a subscriber?" is not.

## A. Actors & context — almost always worth checking

- Guests, logged-in customers, or both? Does it need an account?
- Which customer groups? Net or gross price display — does that change behaviour?
- B2B involved — a company/business buyer, not just an individual? If yes, see §B.
- Which sales channels — Storefront, headless via Store API, Admin only?
- Multi-language / multi-currency / multi-country in play? Does behaviour differ per country?
- Does a merchant admin configure this, or is it fixed?

## B. B2B — only when §A flagged a business/company buyer

Shopware's B2B Components is a distinct Commercial capability set, Evolve plan or higher (never Rise or Community — see §I). A brief that says "B2B" rarely means all of it; scope which parts apply.

- Which capabilities does the brief actually need — employee roles, order approval, budgets, quotes, organisation units, catalogue restrictions per unit, negotiated pricing, quick order, shopping lists, sales agent login — or a subset?
- One employee role covers ordering, or do roles need to differ (who can order, who can approve, who manages other employees)?
- Does every order need approval, or only ones crossing a threshold (amount, weight, shipping cost, method)? What happens to an order while it's pending?
- Spending limits — company-wide, per department, or per employee? What reset cadence (weekly/monthly/quarterly/yearly) matches the client's actual procurement cycle?
- Quotes — customer-initiated only, or can the merchant send one proactively? What happens when a quote expires unanswered?
- Does the company need more than one organisational level (e.g. region > branch > team), and do units need separate addresses or payment methods?
- Does every unit see the same product catalogue, or does visibility need to differ per unit?
- Negotiated/individual pricing — per unit, per customer tag, or both? Does it override or stack with existing customer-group/tiered pricing?
- Quick order — manual number+quantity entry enough, or is bulk CSV upload required, and in what format?
- Shopping lists (reorder templates) — customer-managed only, or does the merchant's team need to build/edit them on a customer's behalf?
- Third-party sales agents placing orders on a customer's behalf — needed, or out of scope?

## C. Catalog & pricing

- Which product kinds: standard, variants, digital/downloadable, custom-configurable, bundles, free-gift?
- Variant-level or parent-level behaviour?
- Which price wins when several could apply — list, tiered/advanced, customer-group, promotion, manual — and does it stack with existing promotions/vouchers?
- Stock relevance: reserve, block, or ignore availability? Behaviour when out of stock, on clearance, or on restock delay?
- Does the rule apply per line item, per cart, or per customer over time?

## D. Cart, checkout & order

- Cart stage, order stage, or both? What happens to a cart already holding the old behaviour?
- Effect on totals, taxes, shipping costs, surcharges?
- Constrained to specific payment or shipping methods?
- Which order-state transitions matter — cancellation, return, refund?
- Recorded on the order for later reference — invoice, document, confirmation?

## E. Content, storefront & communication

- New page, new URL, or change to an existing one? SEO-relevant?
- Editable via Shopping Experiences (CMS) by merchants, or hard-coded by developers?
- Which notifications fire, to whom, and on what event?
- Any new or changed content — email, page copy — the merchant must be able to edit or translate?

## F. Admin & permissions

- Does a merchant need a new list, detail view, or setting — or is an existing module extended?
- Which roles may see and which may change it?
- Bulk actions, import/export, or CSV needed?

## G. Data & integrations

- Who owns the data — Shopware or an external system (ERP, PIM, CRM, WMS)?
- Direction and business freshness expectation (real time, hourly, nightly)?
- What happens when the external system is unavailable — block, queue, degrade?
- Existing records: migrated, backfilled, or left as-is?
- Personal data, consent, retention, invoice or tax implications?

## H. Acceptance & failure

- For each FR: what observable outcome makes it done?
- What does the actor see when it fails, is not permitted, or hits a limit?
- Empty state and first-run behaviour?
- Any threshold, limit, or timing the business has actually stated? (Never invent one.)

## I. Licence tier — a business availability question, not a technical one

Several capabilities are Shopware **Commercial** (Rise / Evolve / Beyond), not open-source Community. If the brief assumes one, confirm the plan covers it or that the PRD requires building it.

Commercial-only: B2B Components — Evolve or higher, never Rise or Community (see §B) — Subscriptions (Beyond only), Multi-Inventory (Evolve/Beyond), Advanced Search, Returns Management, Content Generator, Text/Image AI, Spatial Commerce, Custom Products (Rise, and a separate feature from B2B Components despite the naming similarity).

Individual/negotiated pricing within B2B Components has conflicting tier documentation (Evolve vs. Beyond) — confirm directly against the client's Commercial contract before writing acceptance criteria that assume it.

Ask as: *"This relies on Shopware's B2B order-approval feature, which needs the Evolve plan or higher. Does the project have that plan, or must this be built from scratch?"* — the answer changes scope and requirements, so it is high-impact.

## Ask or don't

There is no impact grading. A gap is either worth a question or it is not:

| | Handling |
| --- | --- |
| Changes domain modelling, functional behaviour, or acceptance criteria — answering it moves confidence toward 90% | Ask it, or write it as a §11 row. It blocks *Ready for specification* while open. |
| Everything else — wording, ordering, cosmetics, inferable defaults, details the requirements do not turn on | Never ask, never write a row. Assume and mark `(assumed)`, or leave it out. |

Test before writing any question: *if answered both ways, would the PRD's requirements differ?* No → it is not a question.
