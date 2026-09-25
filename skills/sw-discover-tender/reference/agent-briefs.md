# Agent briefs

Three agents: `sw-tender-editor`, `sw-product-manager`, `sw-shopware-architect`. Every task below is one the named agent's own tools can perform; an agent that never writes files in tender work returns its report as its final message, and the skill saves it. `<doc>` = the working document path. `<work>` = `specs/.rfp/<slug>/`.

Every spawn of `sw-product-manager` or `sw-shopware-architect` receives the detected Shopware version, edition and plan (`context-parameters.md`, Dev Knowledge Base only), section 1's Project information table (the 18 volumes and facts feed the size-up drivers in `estimation-model.md`), and, per scope item, that item's Internal note (read-only) and its rejected proposals, with an instruction never to re-propose them. In tender work neither agent scans `vendor/`, `custom/plugins` or `composer.lock`, and neither re-detects the version from the codebase — project facts come from the Dev Knowledge Base only (`context-parameters.md`); a brief that supplies the version with its Dev Knowledge Base evidence is used as verified, never re-derived.

## `sw-tender-editor`

Tools: Read, Write, Edit — no Glob or Grep. Never asked to search; every brief names the exact file(s) to read. Never judges Requirement Coverage or Estimation. Exactly two jobs, one per spawn.

**`extract`** (procedure step 1) — input is the one named tender file — the runtime's `import-digest.md` (xlsx/csv source) or the PDF itself — plus `reference/project-information.md` for the 18 `PROJECT_INFO` keys:

> Sort the requirements at `<file>` into the tool's own tabs. Read the whole file. The row's own content decides the tab, never its topic: `TABS = Functional, Non-functional, Project & services`. Functional is anything the shop, admin or an interface must do, including a feature required by law or compliance (hazard labelling, VAT-ID validation, newsletter double opt-in, a payment method), an integration, migration or content. Non-functional is a quality attribute or operating constraint — performance, availability, scalability, security posture/access policy, accessibility conformance level, data-protection process, hosting, operations, monitoring, code quality. Project & services is how the project is delivered and supported — method, timeline, team, documentation, training, testing/acceptance, hypercare, warranty/maintenance, handover, references, commercial structure (scope and effort only). A bidder questionnaire sheet (e.g. a "Company Overview" sheet asking the partner to describe org structure, headcount or references) is Project & services, its topic the client's own sheet/block name — answered like any other row. A client "Type" column is a hint, never the decider. `topic` is the most specific grouping the client gives for that row — its own Area/Category column when present, else the block heading, else the sheet name (PDF: the section heading) — strip a leading chapter number ("1. ", "3.3 - ") and use the rest verbatim; never invented, never the tab name. Confirm, correct, or add to the digest's proposed table structure and answer columns (xlsx/csv only) — a sheet the digest called context whose cells are in fact a requirement or vendor-answer table gets its own table the digest never proposed. A row inside a declared table's range that is a heading, a note or a total, not a requirement, goes to `skip`; a row outside every declared range is never listed anywhere. Fill `projectInfo` from the tender's own context sheets or prose for the 18 keys in `project-information.md`; `source` may join several locations with "; "; state what the source gives, qualified when it is not exactly what the key asks; a key the source does not state is simply omitted. A `value` is the client's own fact, kept verbatim, a figure included (EUR 380, €120k, 160,000 EUR) — this table is the one place the money rule does not apply. A numeric compliance-legend rating column (e.g. 0-4) is not yours to fill or change — the runtime writes it at export. Return this JSON as your final message, nothing else:
>
> ```json
> {
>   "tables": [{ "sheet": "<real sheet name>", "headerRow": 1, "firstDataRow": 2, "lastDataRow": 92,
>                "tab": "Functional", "topic": null,
>                "columns": { "id": "A", "priority": "F", "requirement": "E", "topic": "B",
>                             "compliance": "J", "comment": "K", "effort": "L", "assumptions": null } }],
>   "overrides": [{ "sheet": "<sheet>", "row": 6, "tab": "Non-functional" }],
>   "skip":      [{ "sheet": "<sheet>", "row": 40, "why": "sub-heading, not a requirement" }],
>   "items":     [{ "tab": "Functional", "topic": "<PDF section heading>", "prio": "Must", "text": "<verbatim>", "id": null }],
>   "projectInfo": [{ "key": "products", "value": "<value>", "source": "<sheet> r<row>" }]
> }
> ```
>
> XLSX/CSV: use `tables`, `overrides`, `skip` and `projectInfo`; `items` is empty. A multi-block sheet gets one `tables` entry per block, `topic` = that block's heading. An `overrides` entry sets `topic` only when this row's own grouping differs from its table's `topic` — never restate the table's topic as an override. PDF: use `items` and `projectInfo`; `tables`, `overrides` and `skip` are each an empty array. For each PDF item, `text` is verbatim — never invent one the prose does not state, never merge two into one entry, never split one into two; a descriptive paragraph that states no requirement is not an item, though it may feed `projectInfo`. `prio`: infer from the prose — "must"/"shall"/"required" → Must, "should" → Should, "nice to have"/"could"/"optional" → Nice to have, empty only when the prose gives no such signal; use the document's own word for that level, its first letter capitalised, dropping a trailing qualifier such as ", if time allows". A bullet list under a lead-in sentence that states the priority: every bullet inherits the lead-in's `prio`, but its `text` is the bullet's own wording, never the lead-in's. `topic` is the PDF's section heading (strip a leading chapter number), never empty; `id` is optional (a client id stated in the prose). Do not write a file.

**`context`** (after intake, and again whenever the architect's report or an operator answer changes them):

> Detected Shopware `<version>` `<edition>` plan `<plan>`, per `<evidence>`. Write into `<doc>`: section 1's meta prose (not the Project information or Not taken tables — the runtime writes those), the detected version/edition/plan above; section 3's `### Exclusions` bullets, one per exclusion the client's own document states; section 6 Integrations the tender names, from the source document and the PM's markdown reports; section 7 Glossary of the client's terms. There is no Approach section — a platform, hosting, PSP or CMP decision belongs in a scope item's Client Response, never here. Never touch section 2, a section 4 row, a section 5 block, section 8 Log, section 1's Project information or Not taken tables, or section 3's `### Assumptions` bullets — the runtime writes all of those (section 8 is appended by the runtime's `report` command). Never invent a term, an integration or an exclusion the source does not state; when a section has no material, leave it as the heading alone — write nothing under it. End your turn with one line: which sections you wrote.

## `sw-product-manager`

A shared agent (also used outside tenders); its tools include the Dev Knowledge Base MCP (`kb_status`, `list_docs`, `grep_docs`, `read_doc`), `WebFetch`, `Read`, `Grep` and read-only `Bash`. Never writes the working document, and never writes any file in tender work.

> Check scope item(s) `<ids>` against the Dev Knowledge Base MCP (platform and project). Installed Shopware `<version>` `<edition>` plan `<plan>`, per `<evidence>` (`context-parameters.md`). Per item, Internal note (read-only, never write it): `<note or "none">`; rejected proposals, never propose again: `<list or "none">`.
>
> For each item: report the stock feature that covers it, or state plainly that nothing in the platform or the project covers it; cite the Knowledge Base page or the project's own implementation. Flag an item too vague to assess and draft one client question for it (question text, 2-4 options with their scope effect, a fallback) — the architect turns this into the section 5 block. Never estimate effort, never set Requirement Coverage — the architect decides the final value; where the architect's own check disagrees with this report, that is expected and the architect records it, not this agent.
>
> Never ask the user a question with a structured question tool (Claude Code: `AskUserQuestion`; Codex: `request_user_input`). Return your report as free-form markdown, your final message.

## `sw-shopware-architect`

A shared agent (also used outside tenders); its tools include the Dev Knowledge Base MCP, `Read`, `Grep`, `Glob`, read-only `Bash`, and `WebFetch`/`WebSearch` for ISV research. Never writes the working document, and never writes a file in tender work — the skill saves its report and runs `apply`.

> Assess and estimate scope item(s) `<ids>` of `<doc>`. Installed Shopware `<version>` `<edition>` plan `<plan>`, per `<evidence>`. Regime: `<profile|T-shirt>`. PM report: `<pm-report.md>` — input, not truth: you decide the final Requirement Coverage. Where your own Dev Knowledge Base or Store research overrides the PM's reading, say so inside that item's References, in the `kb:` (or `project:`/`isv:`) entry that names your basis: `kb: <page> — PM reported <x>`. Per item, Internal note (read-only, never write it): `<note or "none">`; rejected proposals, never propose again: `<list or "none">`.
>
> **Re-estimate of a confirmed or reopened item** (the item is already `confirmed`/`reopened`; this run was triggered by an answered question, an accepted assumption or a profile change, not a first assessment): current values — coverage `<current coverage>`, effort `<current size|pd>`, Client Response `<current text>`. Return these fields verbatim unless the new input materially changes the coverage, the effort or the substance of the response — a re-estimate is not an invitation to reword; a cosmetic-only change reopens the item for nothing.
>
> For each item set: Requirement Coverage (`coverage-mapping.md`'s six values, no others), Confidence (`high|medium|low`), a Client Response draft, References, and Estimation — a `size` in the T-shirt regime or a base `pd` (before overhead and buffer) in the profile regime (`estimation-model.md`), under the report's `effort` key. References entries you may write: `kb: <KB page title or path>` · `project: <implementation or wiki page>` · `isv: <extension> · <vendor> · <supported versions> · <url>` · `cost: <one line>` — no other prefix. `cost:` is at most one per item, set only when the coverage choice carries a cost consequence (a licence, a subscription, a paid ISV, a hosting tier); one line, no amount — the amount check still applies to it, though money words are allowed there; it is never exported and never reopens an item. ISV coverage: research the Shopware Store and vendor pages directly; name the extension, its vendor, the Shopware versions it supports and a link, and confirm it is compatible with `<version>`/`<plan>` and carries no licence terms or amounts — name that plainly, never the word itself; a licence consequence goes in that item's `cost:` line. A figure the client's own document states is context you read, never repeat. Propose 1-3 scope-locking assumptions per item (`assumption-catalogue.md` keys first, else a new statement), each a one-sentence, client-agreeable statement that fixes scope and reduces effort, with the `pdSaved` it would save — a positive number no greater than the item's own effort; a proposal statement gets the same Requirement-wording exemption as the Client Response for `price`/`cost`/`rate`/`fee`/`budget`. Every Configuration, Extension, ISV or Custom item needs 1-3 such proposals; `noProposal` is only for an item whose already-accepted assumptions already cover it, set to the one-line reason — OOTB and `—` items need neither; `apply` refuses a report that leaves such an item with neither, or a proposal with no `pdSaved`, a non-positive one, or one above the item's effort. Raise a client question for an item too vague to assess (`client-question-rules.md`), with a fallback. Money rule (`estimation-model.md`): never an amount or a currency symbol/code, ever. A KB feature or route name containing a money word may be quoted verbatim in a reference; in the Client Response use `price`/`cost`/`rate`/`fee`/`budget` only when that item's own Requirement text already uses it, otherwise paraphrase ("customer-specific pricing", not "customer-specific price").
>
> Return this JSON as your final message, nothing else — no prose, no file writes:
>
> ```json
> {
>   "cause": "<why this run happened, e.g. 'analyze group 1' or 'CQ-3 answered B'>",
>   "items": [
>     {
>       "id": "<item id>",
>       "coverage": "OOTB | Configuration | Extension | ISV | Custom | —",
>       "confidence": "high | medium | low",
>       "size": "—|XS|S|M|L|XL|XXL",         // T-shirt regime only; "—" for OOTB
>       "pd": 9.5,                            // profile regime only — base PD before overhead/buffer; 0 for OOTB
>       "clientResponse": "<text>",
>       "references": ["kb: ...", "project: ...", "isv: <ext> · <vendor> · <versions> · <url>", "cost: <one line, no amount>"],
>       "proposals": [ { "statement": "<text>", "pdSaved": 4 } ],
>       "noProposal": null | "<reason>",       // only when accepted assumptions already cover the item; required when "proposals" is empty and coverage is not OOTB or "—"
>       "blockedBy": "CQ-3" | "new:0" | null,  // "new:<i>" = index into this report's own "questions" array
>       "failed": null | "<reason>"
>     }
>   ],
>   "globalProposals": [ { "statement": "<text>", "pdSaved": 6 } ],
>   "questions": [
>     {
>       "items": ["<item id>"],
>       "question": "<text>",
>       "options": [ { "key": "A", "text": "<text>", "effect": "<scope effect>" } ],
>       "fallback": "A"
>     }
>   ]
> }
> ```

## Delivery rules

- Cap 10 spawns in one message; a failed or empty spawn leaves the item `failed` with a `failed: <reason>` reference, never filled from memory.
- `sw-product-manager` and `sw-shopware-architect` never write a file in tender work; the skill is the only writer of the working document, and only through `apply`, `check --write`, and `sw-tender-editor`'s `context` job.
- Codex and Copilot adapters mirror each agent one-to-one — see the plugin's `agents/` generation.
