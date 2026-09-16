---
title: Domains
has_children: true
nav_order: 4
type: index
purpose: Map of business domains and their features on each surface.
scope: All domains under docs/project-wiki/domains/. Feature rows are summaries; detail lives on the feature pages.
last_synced: {{DATE}}
verified_against: Shopware {{SHOPWARE_VERSION}}
resync: sw-document-feature updates the feature columns; check rows against each domain index.
tags: [index, domains]
---

# Domains

Feature documentation is grouped by business domain. Pick a domain, then the surface the user acts
on — Administration for the merchant, Storefront for the shopper.

<!-- sw-document-feature adds a row when it creates a domain. Only domains that have a directory appear here. -->

| Domain | Purpose | Administration | Storefront |
|---|---|---|---|
| [Platform](platform/index.md) | Cross-cutting infrastructure, extensions, configuration, observability | — | — |

Each feature carries its own status on the domain page it belongs to.

## Canonical domains

Domains are created on demand from this list — never invent a slug outside it without an ADR
(`area: process`). A domain only appears in the table above once it has a directory here. Guidance:
`reference/domain-guidelines.md` in the `sw-document-feature` skill.

| Slug | Domain | Covers |
|---|---|---|
| `catalogues` | Catalogues | Products, variants, categories, properties, manufacturers, Dynamic product groups, availability |
| `checkout` | Checkout | Cart, shipping and payment selection, order placement |
| `orders` | Orders | Post-checkout order lifecycle, documents, returns, states |
| `customers` | Customers | Accounts, registration, Customer groups, addresses, B2B roles |
| `content` | Content | Shopping Experiences layouts, media, SEO, snippets/translations |
| `marketing` | Marketing | Promotions, newsletters, product reviews, cross-selling |
| `sales-channels` | Sales Channels | Sales Channel setup, domains, languages, currencies, countries, taxes |
| `automation` | Automation | Flow Builder flows, Rule Builder rules, scheduled tasks, mail templates |
| `settings` | Settings | System settings and merchant configuration that no other domain owns |
| `integrations` | Integrations | ERP/PIM/payment/shipping connectors, imports/exports, webhooks |
| `platform` | Platform | Cross-cutting infrastructure (no features, no surfaces) |

## Adding a domain

Create `domains/<slug>/index.md` from `reference/templates/domain-index.md` in the `sw-document-feature` skill, add a row above and in the [wiki home](../index.md) domain table.

---

*Scope: domain level only — feature detail lives on the feature pages. · Last synced: {{DATE}} ·
Verified against Shopware {{SHOPWARE_VERSION}} · Re-sync: reconcile with each `domains/<domain>/index.md` feature
table.*
