# Coverage mapping

## Internal classes

| Class | Meaning |
| --- | --- |
| `stock` | Covered by the installed core or the recommended plan without development |
| `config` | Covered by configuration (rules, flows, settings, CMS layouts) — configuration effort only |
| `plugin` | Covered by a named store extension; licence source stated; integration effort only |
| `custom` | Development required |
| `commitment` | No development — a process, contract or recommendation the partner commits to |
| `service` | No development — a service with real effort (training, documentation, test concept, go-live support) |
| `not-offered` | The partner declines the row — a partner decision, never uncertainty |
| `blocked` | No defensible estimate until a blocking `CQ-n` is answered |

## Token rule

Use the column's allowed list **verbatim** — never translate, never add a token. Applied at export (`RSP-3` in `response-rules.md`); "comment" below means the response comment (`RSP-4`). Map by meaning:

| Class | Token |
| --- | --- |
| `stock` | the token the RFP defines as covered without development (`Stock`, `Standard`, `OOTB`, `Yes`) |
| `config` | the configuration token if the list has one, else the `stock` token; comment states `configuration only` |
| `plugin` | the plugin/extension token; comment names the extension and its licence source |
| `custom` | the development token |
| `commitment` / `service` | the token the RFP defines as "no development"; else a neutral token (`Yes`, `Compliant`, `Erfüllt`); else the configuration token. Comment always `No development — commitment` or `Service effort, no development` |
| `blocked` | the class the row would most likely be; effort empty; comment `Effort stated after clarification of <topic>` |
| `not-offered` | the decline token — only on a partner decision logged as `C-n` in §7 (profile exclusion, declined Could row). Never for a Must row without an answered `Q-n`, never for uncertainty |

Three-scale lists (`Yes / Partial / No`, `Fully / Partially / Not compliant`): `stock`, `config`, `plugin` without development → *Yes*; `custom` or `plugin` with development → *Partial*, comment carries the class; `not-offered` → *No*.

**No token list**: use the scale the RFP's instructions define; else the profile's compliance scale; state the scale used in the §1.3 Source map and as an `X-n` line in §3.

## Synonyms

| Class | EN | DE |
| --- | --- | --- |
| `stock` | Stock, Standard, OOTB, Out of the box, Core | Standard, Im Standard, Enthalten |
| `config` | Config, Configuration | Konfiguration |
| `plugin` | Plugin, Extension, App, Store plugin | Plugin, Erweiterung, App |
| `custom` | Custom, Development, Customisation | Individualentwicklung, Anpassung, Entwicklung |
| `not-offered` | Not offered, No, Not available | Nicht angeboten, Nein, Nicht verfügbar |

## Edition tiers — indicative, never evidence

Starting hypothesis, taken from this harness's PRD checklist (`sw-design-requirements/reference/prd-confidence-checklist.md` §I). The PM verifies every cell the response relies on, every run, against `platform/func/commercial-features/*` and docs.shopware.com for the detected version. Conflicting tier documentation exists for some B2B capabilities — when the PM reports `conflict`, the row is a `CQ-n` against the client's contract, not a guess.

| Capability | Community | Rise | Evolve | Beyond | Verify at |
| --- | --- | --- | --- | --- | --- |
| B2B Components (employees, roles, quick order, shopping lists) | — | — | ✓ | ✓ | `platform/func/commercial-features/b2b-components*` |
| B2B order approval, budgets | — | — | verify | ✓ | same |
| B2B quote management | — | — | verify | ✓ | same |
| Sales agent / order on behalf (imitate customer is core) | core: imitate only | core | verify | ✓ | same |
| Custom Products | — | ✓ | ✓ | ✓ | `platform/func/commercial-features/custom-products*` |
| Advanced Search | — | verify | ✓ | ✓ | `platform/func/commercial-features/advanced-search*` |
| Multi-Inventory | — | — | ✓ | ✓ | `platform/func/commercial-features/multi-inventory*` |
| Subscriptions | — | — | — | ✓ | `platform/func/commercial-features/subscriptions*` |
| Returns Management | — | verify | ✓ | ✓ | `platform/func/commercial-features/returns*` |
| Admin SSO / 2FA | 2FA via plugin | verify | verify | verify | `platform/func/settings/*`, docs |
| Flow Builder premium actions (delay, webhooks) | delay: verify | verify | ✓ | ✓ | `platform/func/settings/flow*` |

**Community rule.** With Community as the recommended plan, every row that B2B Components would cover becomes `custom` and typically doubles; the architect returns the alternative and §2 shows both variants until the plan is decided.
