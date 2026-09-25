# Requirement Coverage

Six values, exactly, and no others: `OOTB · Configuration · Extension · ISV · Custom · —`. Every method file, the runtime and every agent use these six and these six only.

| Value | Meaning | Must name | Estimation |
| --- | --- | --- | --- |
| OOTB | The base already does it — stock Shopware, or already delivered by the project. | The stock feature and its KB page, or the project's implementation. | `0 PD` |
| Configuration | The base has it; a consultant sets it up in the Administration — Rule Builder, Flow Builder, Shopping Experiences, settings, import profiles. No code. | The admin surface. | never `0 PD` |
| Extension | The base has the entity, service, route or UI that does most of the job; we extend it — subscriber, decorator, custom field, Flow action, CMS element, or the project's own extension. | The stock or project feature extended, with its KB page. | the delta |
| ISV | A Shopware Store extension covers it; we install, configure and integrate it. | Extension, vendor, supported Shopware versions, link. Compatible with the detected version and plan, with no licence terms or amounts attached. | integration and configuration |
| Custom | A significant part is missing from the base; we build the domain. | Nothing to extend but the DAL or the plugin system. | the whole vertical |
| `—` | Not about Shopware functionality: training, documentation, go-live support. | — | still carries effort |

Each value's basis is a References line in the Knowledge Base's own feature names: `kb: <page>` for OOTB/Configuration/Extension against the platform docs, `project: <implementation or wiki page>` when the project itself already built it, `isv: <extension> · <vendor> · <supported versions> · <url>` for ISV. A claim the Knowledge Base does not cover becomes an assumption proposal (`assumption-catalogue.md`), never a guess written straight into Requirement Coverage.

## Client-token map — decided agentically at export

The six Requirement Coverage values are mapped to the client's own compliance tokens at export, not at intake (`procedure.md` step 7, `editor-session.md` batch kind `export`). Tables are identified by their `<sheet> r<headerRow>` key, unique across the fit-back map. `tokens --suggest` prints the heuristic proposal per table key, the table's client token list, and its numeric legend when it has one; the map is decided from that input and stored with `tokens --file`, keyed the same way, for every later export of the same table.

Every one of the six values is something the partner delivers, so **never map to a negative token** — never "not offered", "not supported", "no", or "roadmap":

| Value | Pick |
| --- | --- |
| OOTB | The best "standard / yes / fully" token. |
| Configuration | The configuration-style token, or the next best after OOTB. |
| Extension | The customisation- or development-style token. |
| Custom | The customisation- or development-style token. |
| ISV | The third-party / partner / add-on-style token when the list has one; otherwise the same customisation-style token as Extension/Custom. |
| `—` | An N/A-style token when the list has one; otherwise the OOTB token — never a negative token such as "Not offered". |

A numeric legend (key → label): pick the key by what its label means, never by the number's position. No token list in the client's file: use the scale the client's instructions define, or a neutral `Yes / Partially / No`, and record the scale used and the chosen map in the confirmed import map (`tokens --file`), not in section 1.

## ISV research

Coverage is checked only against the Shopware platform documentation and the Shopware Dev Knowledge Base MCP. Exception: for ISV items the architect researches the Shopware Store and vendor pages directly (WebFetch/WebSearch) — there is no marketplace layer in the Knowledge Base yet. An ISV item names the extension, its vendor, the Shopware versions it supports, and a link; it must be compatible with the detected version and plan, and carry no licence terms or amounts — never name a fee, a cost or a rate for it (`estimation-model.md`, money rule).

## Project facts

The detected Shopware version, edition and plan, and what the project already built, come from the Dev Knowledge Base only (`context-parameters.md`). The tool never researches the project itself outside the Knowledge Base.
