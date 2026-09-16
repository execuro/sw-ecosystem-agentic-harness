# Domain guidelines

How the wiki is cut into domains, how a feature is assigned to one, and how surfaces are assigned. The canonical slug list also lives in the scaffolded `docs/project-wiki/domains/index.md`; this file explains it.

## Canonical domains (Shopware-aligned)

| Slug | Domain | Administration modules it maps to | Storefront pages / Store API it maps to |
|---|---|---|---|
| `catalogues` | Catalogues | Catalogues → Products, Categories, Properties, Manufacturers, Dynamic product groups, Product reviews (moderation) | Product detail, listing/search/navigation, product availability, variants |
| `checkout` | Checkout | Settings → Shipping, Payment (method setup), Rule Builder conditions used at checkout | Cart, checkout confirm/finish, shipping/payment selection, `store-api/checkout/*` |
| `orders` | Orders | Orders → Overview, order detail, documents, state machine | Account → Orders, order detail, returns, `store-api/order*` |
| `customers` | Customers | Customers → Overview, Customer groups, addresses, B2B/employee roles | Registration, login, account pages, addresses, `store-api/account/*` |
| `content` | Content | Content → Shopping Experiences, Media, Landing pages, SEO, Snippets | CMS-rendered pages, landing pages, SEO URLs, snippets/translations |
| `marketing` | Marketing | Marketing → Promotions, Newsletter, Product reviews, Cross-selling | Promotion codes, newsletter forms, reviews, cross-selling sliders |
| `sales-channels` | Sales Channels | Sales Channels → domains, languages, currencies, countries; Settings → Tax | Channel-specific behaviour (currency/language/country switches, tax display) |
| `automation` | Automation | Settings → Flow Builder, Rule Builder (rule management), Scheduled tasks, Mail templates | — (effects show up in other domains; page only if the shopper sees a dedicated surface) |
| `settings` | Settings | Settings → System, Shop settings not owned by another domain | — |
| `integrations` | Integrations | Settings → Integrations, Import/Export, Webhooks, external system connectors | External-system driven behaviour visible to the shopper (e.g. live stock, external payment redirect) |
| `platform` | Platform | — | — (see below) |

Domains exist on disk only once a feature needs them (setup, in `setup-wiki.md`, scaffolds only `platform`). Create a domain from `reference/templates/domain-index.md` in this skill's directory, then add its row to `domains/index.md` and to the domain map in `docs/project-wiki/index.md` (`| [Domain](domains/<domain>/index.md) | Purpose |`).

## Assigning a feature to a domain

First rule that matches wins:

1. The source names an extension listed in `domains/platform/extensions-inventory.md` with one owning domain → that domain. (An extension shared by two domains falls through.)
2. The PRD §4 Domain Impact / spec entities name a Shopware concept or custom entity owned by one domain (table above; glossary "owned by" notes) → that domain.
3. The actor's main workflow in PRD §3 maps to one Administration module or Storefront page in the table → that domain.
4. Still two candidates → ask with a structured question tool if you have one (Claude Code: `AskUserQuestion`; Codex: `request_user_input`) with both, then a Decision Log line on the page.

Rule of thumb for the tie-breakers: the domain that owns the **data written** wins over the one that only reads it (a return request writes order state → Orders, even though the shopper starts it from the account area).

## The `platform` domain

Contains only cross-cutting infrastructure: extensions inventory, customization guidelines, configuration layers, logging, debugging, environments and deployment. It has no surfaces and no feature pages.

Must **not** go there: anything a merchant or shopper can see or configure per feature (that is a feature page in a business domain), feature-specific config keys (they go in `configuration.md` *as a row*, but the explanation lives on the feature page), feature decisions (Developer › Decisions on the feature page; `adr/` only when marked `[adr]` or user-provided), and Shopware core behaviour (link the docs).

## Project-specific domains

Add one only when a bounded context does not fit the canonical list — a distinct business capability with its own data, its own actors, and its own vocabulary (e.g. a rental workflow, a B2B quotation process, a marketplace vendor portal). Rules:

- Name it with the Shopware term if one exists (`Quotations` if Shopware Commercial names it so); otherwise the business term from the glossary, singular or plural as the business says it.
- Slug: kebab-case, no version numbers, no vendor or plugin names, no abbreviations (`quotations`, not `b2b-quote-mgmt`).
- Ownership: exactly one owning extension recorded in the extensions inventory; the domain index states what belongs to neighbouring domains.
- A departure from the canonical list needs an ADR (`area: process`) provided by the user or marked `[adr]` in the spec. The skill never writes it on its own: it creates the domain, and reports the missing ADR under "ADR candidates (not created)".

## Assigning surfaces

- Merchant acts in the Administration (module, settings, ACL) → `administration/`.
- Shopper (guest, registered, B2B buyer) acts in the Storefront or via the Store API → `storefront/`.
- External system or background job → the surface whose flow it serves: Store API calls and storefront-visible effects → `storefront/`; Admin API, imports, scheduled tasks, mail → `administration/`. State this in the page's Developer section.
- Both actors → two pages, same slug. Ownership of shared parts: entities, migrations, admin modules, Admin API → `administration/`; Storefront controllers, Twig blocks, JS plugins, Store API → `storefront/`; the other half links.
- Never a page without a surface, never a third surface (`api/`, `backend/`, `headless/`). A headless-only project still uses `storefront/` for Store API-facing behaviour.

## When a domain gets split

Split when its index table needs a second vocabulary to stay readable, when two extensions own disjoint halves of it, or when features in it never link to each other. Move the pages, keep the slugs, add a redirect row (`deprecated` status with a link) in the old index for one release. The split needs an ADR (`area: process`) provided by the user or marked `[adr]` in the spec; the skill does not write one itself — it proceeds and reports the missing ADR as a candidate. Never split on page count alone.
