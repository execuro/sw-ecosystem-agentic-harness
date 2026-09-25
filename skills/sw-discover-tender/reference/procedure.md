# Procedure — the seven steps

Three agents only: `sw-tender-editor`, `sw-product-manager`, `sw-shopware-architect`. No QA agent anywhere in this flow — QA effort sits inside the profile's overhead percentage (AG-5). No general-purpose agent writes a response file of any kind. Every deterministic step below is a runtime CLI call (`npx -y @execuro-sw-ecosystem/sw-tender-discovery-tool@latest <command>`); an agent's only output is its report, saved by the skill and applied with `apply`.

Steps 2-6 repeat until the document is *Ready* (every scope item confirmed). One flow for RFI, RFP, RFQ and project plans alike; a greenfield tender, a tender on an existing project and an internal planning exercise all run the same steps.

## 1. Intake

- **XLSX/CSV**: `import --source <file>` writes `specs/.editor/<base>/import-snapshot.json`, `import-map.proposed.json` and `import-digest.md` — a heuristic proposal of each table's header/data range and columns, no operator step. In an `--editor` session, `emit progress "Reading N sheets…" --batch <id>` before spawning; spawn `sw-tender-editor` for its `extract` job on `import-digest.md` (the one named file it reads); it confirms or corrects the proposed table structure and answer columns, sorts every row into a tab and topic, and returns the extraction JSON (schema in `agent-briefs.md`). Save it to `specs/.rfp/<slug>/extraction.json`, `emit progress "Extracted N items — building working document" --batch <id>`, then run `intake <doc> --source <file> --extraction <json>` — this writes the committed fit-back map (`import-map.json`) for an xlsx source.
- **PDF**: in an `--editor` session, `emit progress "Reading the source…" --batch <id>` before spawning; spawn `sw-tender-editor` for its `extract` job on the PDF directly; it returns `items`/`projectInfo` only (no `tables`), per the same schema. Save the extraction JSON, `emit progress "Extracted N items — building working document" --batch <id>`, then run `intake <doc> --source <pdf> --extraction <json>`.
- Either way, `intake` builds section 4 by tab and topic, fills section 1's Project information and Not taken tables, sets every new scope item `queued`, then confirms itself (`intake: confirmed`) and queues the opening analysis chunk automatically — no operator step in between. Then spawn `sw-tender-editor` for its `context` job to write section 1's meta (detected version/edition/plan per `context-parameters.md`, source files and hashes) and section 3's `### Exclusions` from anything the client's document already states.
- **Operator corrections, at any time**: on the page, the Overview tab shows a Not-taken banner whenever there are Not-taken rows or unused sheets (item counts per tab, the rows with Restore, unused sheets, per-table answer targets); the operator may `move`, `skip` or `restore` an item and edit Project information (`info`) any time, through a queued row note — skipping a confirmed item is refused ("unconfirm first"). Without the page: relay the same actions from chat. A document still at `intake: review` (an old one, from before this behaviour) is confirmed first: show the extraction summary in chat and run `intake-confirm <doc>` only on the user's explicit go-ahead — that alone starts the analysis; a `notes` batch on such a document re-runs `extract` and `intake` with the notes folded in.
- Re-intake of a new file version (the same or a newer file, any time): re-run `extract` and `intake` as above. A known id (matched by id across the whole document, not per tab) keeps its current tab, topic and every answer field — a text change sets `reopened` (L-5), keeping Assumptions. A new id is `queued`, placed per the extraction. An id that is gone gets a `removed from <file>` reference. A Project information value whose Source is `operator` is kept; the rest are overwritten. Operator skips are kept while their source row still exists. Every re-intake confirms itself again and queues analysis for whatever needs it.

## 2. Assess — in chunks, page order

Intake confirming itself starts this automatically; there is no Analyze button or step to invoke separately, and re-estimate work (an answered question, an accepted assumption, a profile change) queues into the same chunking. Work through every item that needs it — `queued`, `reopened`, or marked in `reestimate.json` — about 15 at a time, in page order: tabs in `TABS` order, topics in client first-seen order, items in client order within a topic (the same order as section 4, `analysis-template.md` SI-4), so the top of the first tab fills first. Split a chunk into groups of about 5 and spawn, per group, in parallel (cap 10 spawns per message, `agent-briefs.md`):
- `sw-product-manager` — checks it against the Dev Knowledge Base MCP (platform and project); reports the stock feature or its absence, and drafts a client question when the item is vague. Free-form markdown, returned as its result (it never writes a file in tender work). The skill passes this report to the architect; only the architect's report is machine-applied.
- `sw-shopware-architect` — reads the PM report, sets Requirement Coverage, Confidence, the Client Response draft and References, and for ISV items researches the Shopware Store and vendor pages directly.

`apply` each group's architect report as soon as it returns (below) — the document updates live, one group at a time, rather than waiting for the whole chunk. Once every group in the chunk is applied, take the next chunk of about 15 items needing work and repeat; stop when none are left, then go to "Run close".

Every spawn receives the detected version/edition/plan, section 1's Project information table, and, per item in the group, that item's own Internal note (read-only) and its own rejected proposals, with an instruction never to re-propose them (`context-parameters.md` "Passed to every agent").

## 3. Propose

The same `sw-shopware-architect` spawn also proposes 1-3 scope-locking assumptions per item (catalogue entries in `assumption-catalogue.md` first, else a new statement, checked against the item's rejected proposals), each a one-sentence, client-agreeable statement with a `pdSaved` greater than 0 and no greater than the item's own effort, and raises client questions for scope items too vague to assess (`client-question-rules.md` AQ-5), in the same report JSON. Every Configuration, Extension, ISV or Custom item returns 1-3 such proposals; a `noProposal: "<reason>"` is valid only when the item's already-accepted assumptions already cover it; OOTB and `—` items are exempt. `apply` refuses a report that leaves such an item with neither, or a proposal with no `pdSaved`, a non-positive one, or one above the item's effort.

## 4. Estimate

The architect sets each item's Estimation in the same report, under the JSON key `effort`: a `size` (T-shirt regime) or a base `pd` (profile regime) per `estimation-model.md`. The architect never applies overhead or buffer — the runtime does, on `apply`.

## Applying an architect report

The architect's result is the report JSON, schema in `agent-briefs.md`. The skill saves it under `specs/.rfp/<slug>/reports/` and runs `apply <doc> --report <json>`. The runtime validates it (the six coverage values, sizes, confidence, reference prefixes, at least two options with an existing fallback key, 1-3 proposals or a `noProposal` valid only when accepted assumptions already cover it, on every non-OOTB item), formats the Estimation cell per regime, stores proposals in the proposal store (rejected-memory applies), opens or keeps `blocked CQ-n` items, and reopens a confirmed item whose Requirement Coverage, Estimation or Client Response actually changed (L-3) — writing the cause into References. An item that fails gets `failed` status and a `failed:` reference; its other fields are kept. When the source document or a PM report names an integration not yet in section 6, spawn `sw-tender-editor`'s `context` job again to refresh it — the architect's own report carries no section 6 prose. A platform, hosting, PSP or CMP decision belongs in that item's Client Response, not in a context section.

## 5. Confirm

The operator accepts or rejects proposals (`accept`/`reject <doc> <P-n>`) — accepting a numeric-PD item's proposal lowers its Effort by `pdSaved` at once, floored, with a later re-estimate refining the figure — edits Client Response and Internal note (`patch <doc> <id> --response <t> --note <t>`), and confirms items (`confirm <doc> <id>...` or `--all-unconfirmed`). Confirming rejects the item's untouched proposals (L-2). The operator's own edits to Client Response or Internal note never reopen a confirmed item (L-4). Confidence never blocks confirmation. A blocked or a failed item can be confirmed; a failed one needs an operator-written Client Response first (L-6).

## 6. Answer

The operator records the client's chosen option (`answer <doc> <CQ-n> <key>`); the runtime marks the affected items for re-estimate and reopens a confirmed one only when the next `apply` actually changes it (L-3).

## Re-estimate (items marked in `reestimate.json`)

A confirmed or reopened item marked for re-estimate is spawned to the architect with its current Requirement Coverage, Estimation and Client Response as brief input (`agent-briefs.md`'s "Re-estimate of a confirmed or reopened item"). The architect returns those fields verbatim unless the new input materially changes them — no cosmetic rewording. `apply` still only reopens on an actual change (L-3), so a verbatim re-estimate leaves a confirmed item confirmed. Re-estimate work joins the same page-order chunking as step 2, whether raised by an answer, an accepted assumption or a profile change.

## Run close — every run

Every chunk, whatever step it did, ends with `check <doc> --write` (grammar, the six values, reference prefixes, the money scan, section 2 totals equality — refuses with reasons on failure). `report <doc>` refuses to run while `check` fails, because it appends to section 8 and section 8 must only ever record a run that left the document valid. On a `check` failure: fix what the reasons name (a malformed row, a money-word hit, a totals mismatch) and re-run `check --write`; when the cause is an item the last `apply` got wrong, re-apply a corrected report for that item, then `check --write` again. Only once `check --write` passes, run `report <doc>` — it prints the P-9 run report (state, confirmed of total, failed, open client questions, not decomposed, low confidence, estimation by priority with regime, waiting proposals, what changed including reopened items), appends the run to section 8, and writes `last-run.json`. Section 8 is written by `report` and by `export` alone — no other step, and no agent, ever appends to it. The skill posts the P-9 report to chat, once per chunk.

## 7. Export

`export <doc>` — available anytime (X-1); unconfirmed items export with empty answer cells. XLSX source: a surgical copy of the client's workbook (X-2 to X-4). CSV/PDF source: a working-sheet XLSX built from the sections (X-5), no token map needed. Every export writes the next `<base>-response-v<n>.xlsx`, never overwriting an existing file, and appends its own section 8 Log line naming `v<n>`, the file, confirmed count and what changed since the last export (X-9). See `response-rules.md`.

**XLSX source, plain mode "export …" or an `export` batch (`editor-session.md`):** when a table lacks its coverage-to-client-token map, decide it before exporting:

1. `tokens <doc> --suggest` — prints, per table (identified by its `<sheet> r<headerRow>` key), the heuristic proposal, the client's compliance token list, and its numeric legend if any.
2. Decide the six-value → client-token map per table from that output and `coverage-mapping.md`'s rule (never a negative token; `—` to an N/A-style token or the OOTB one; a numeric legend picked by label meaning).
3. `tokens <doc> --file <json>` with the map, keyed by `<sheet> r<headerRow>`, then `export <doc>`. If the runtime refuses a value (unknown token, negative token), adjust that value and retry once; a second refusal is posted to chat verbatim instead of retried again.
4. Post the exported file path and the chosen map (per table key, its six value → token lines) in chat.
