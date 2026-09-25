# Project information

Section 1's `### Project information` table, 18 fixed rows, `PROJECT_INFO` (runtime constant, `parse.mjs`), in this order. `sw-tender-editor`'s `extract` job fills `projectInfo` for as many keys as the source states; `intake` writes the table, a missing key becomes `not stated` with an empty Source; the operator edits a Value directly (`info <doc> <key> "<value>"`, Source becomes `operator`).

| Key | Capture | Feeds |
| --- | --- | --- |
| `business-model` | B2B, B2C, marketplace, wholesale, or a mix, in the client's own words. | which agent-brief facts and assumption keys apply (e.g. `AS-B2B-*`). |
| `markets` | Countries or regions the shop serves. | sales-channel and localisation size-up. |
| `languages` | Storefront/admin languages required. | content-migration and localisation size-up. |
| `currencies` | Currencies the shop must price and sell in. | pricing and checkout size-up. |
| `sales-channels` | Storefront, marketplace, B2B portal, POS — however many the client runs or wants. | `AS-PLAT-02`-style channel assumptions; size-up. |
| `customers` | Customer types and groups (retail, trade, tiered). | pricing/access-rule size-up. |
| `products` | SKU count and catalogue shape (simple vs. variants). | catalogue and search size-up. |
| `catalogue-structure` | Category depth, attribute/property count. | Shopping Experiences and filtering size-up. |
| `media` | Image/asset volume and where it lives today. | migration size-up. |
| `catalogue-updates` | How often the catalogue changes and which system leads it. | integration and sync-pattern assumptions (`AS-ERP-*`). |
| `price-model` | List, tiered, negotiated, contract pricing — structure, and a figure if the client or operator states one. | pricing-engine and B2B size-up. |
| `orders` | Orders per day, average and peak. | performance and hosting size-up. |
| `traffic` | Visitors/peak concurrency. | performance and hosting size-up (`AS-OPS-*`). |
| `current-platform` | The platform being replaced or extended, if any. | migration scope and data-mapping size-up. |
| `leading-systems` | ERP / PIM / CRM the shop must integrate with. | integration size-up (`AS-ERP-*`). |
| `data-migration` | What data must move (orders, customers, content, media). | `AS-MIG-*` assumptions; size-up. |
| `go-live` | Target go-live date or window. | timeline and Project & services sizing. |
| `shopware` | The tender's own stated target Shopware version / edition / plan — Source is where the tender states it, never the Dev Knowledge Base. | `AS-PLAT-*` assumptions; compared against `context-parameters.md`'s Dev KB detection of an existing project — a difference raises a `Q-n`. |

Rules:
- **Value**: free text, or `not stated` — never invented, never guessed from another tender.
- **Source**: `<sheet> r<row>` (xlsx/csv), `PDF p<page>` or `PDF §<heading>`, `operator` (an `info` edit), or empty; several locations may be joined with "; " (`<sheet> r<row>; <sheet> r<row>`).
- **Amounts**: a Value is the client's or the operator's own fact, kept verbatim, a figure included (EUR 380, €120k, 160,000 EUR) — `check`'s money scan does not cover this table. Elsewhere the tool writes no money of its own (`estimation-model.md`'s money rule); this table only ever repeats what the source or the operator already stated, never invents or computes a figure.
- **Value qualification**: state what the source gives; qualify a Value that is not exactly what the key asks (e.g. "up to 10 orders a day per buyer — no shop total stated") rather than computing or inventing the missing figure.
- A missing, unknown or out-of-order Parameter row is a parse error naming the row.
