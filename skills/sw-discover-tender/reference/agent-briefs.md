# Agent briefs

`<work>` = `specs/.rfp/<slug>/`. `<analysis>` = the analysis file.

## Parallelism, caps, delivery

- Pipeline, not two barriers. Message 1 carries every `sw-product-manager` spawn, PLUS the single `sw-qa-engineer` spawn (it reads no PM report), PLUS the `sw-shopware-architect` spawns for clusters that skip wave 1 entirely (Rows typed *Project*, hosting/operations NFRs, pure contract rows).
- Each remaining `sw-shopware-architect` is spawned as soon as its OWN cluster's PM report lands — whatever is ready together goes in one message; never wait for the whole PM set to finish before spawning any architect.
- One estimate group per run: whole clusters totalling at most `<batch>` rows (SKILL.md *Batch size*, default 50; `all` = every row in one run). The spawns below cover that group only.
- Cap 10 spawns per message. Over the cap: raise rows per cluster to 20.
- A failed or empty spawn is `not consulted — <reason>` in §1; its rows stay `_TBD_`. Never fill them from memory. A failed response or `sw-tender-editor` spawn stops the export.
- Every brief carries the detected Shopware and PHP version **with evidence**, the edition, and the hidden-sheet prohibition.
- **Delivery rule, in every brief.** Agents with a Write tool (`sw-shopware-architect`, `sw-qa-engineer`, the response agents, `sw-tender-editor`) write their report to the file(s) named in the brief and end their turn with one line (path + sum); those files are the only ones they may write. `sw-product-manager` has no Write tool: it delivers its report as its final message, in numbered parts under 7,000 characters each. A cut report is not a result: ask for the parts again.
- `sw-tender-editor` delivery: one line back, listing only the file(s) its brief named — never the file's content, never a file it wasn't asked to write.
- Save every PM report as received to `<work>/pm-C<n>.md`. Architect, QA and `§ROWS` briefs read files, never chat.
- Shared material (baseline with evidence, plan variants, estimation-model excerpt, class definitions, report format, prohibitions) goes once into `<work>/arch-common.md`; each architect brief points at it plus its cluster file and PM report.
- Rows are passed by file: `<work>/C<n>.md`, one line each: `<id> | <title> | <requirement> | <acceptance or —> | <priority> | <type> | <reference or —>`. Client context: `<work>/context.md`, `meta.md`, `params.md`, `migration.md`, `integrations.md`, `glossary.md` (`§CONTEXT`, spawned alongside `§EXTRACT`).

## §EXTRACT — `sw-tender-editor`, per source file or table (step 3, before any spawn wave)

> Extract requirement rows from tender source. Source `<file>`, table `<t>` (`<sheet or section name>`), `<client>`, RFP language `<en|de>`.
>
> Read only `<file>` (this table). Never open a hidden sheet, or any sheet, table or file whose name starts with `_` — for an xlsx tender they were never written to a CSV at all. When the tender has an `import-map.json` (an xlsx the user steered), that mapping is **authoritative**: it names this table's id column, its requirement and answer columns and the client's allowed tokens, all confirmed by a human — do not re-derive them. Without a mapping (csv, markdown, pdf), fall back to the heuristic: a requirement table has an id-like column (`ID`, `#`, `Nr.`, values like `GEN-01`) and vendor columns (headers starting *Vendor*, *Bidder*, *Supplier*, *Anbieter*, *Antwort*, or *Compliance / Comment / Effort*). Prose sources (pdf, docx text): mint `R-<n>` with page or paragraph.
>
> Write, disjoint from every other `§EXTRACT` spawn:
> - `<work>/C<n>.md` per cluster (10–20 rows by area, never spanning a table, source order): one line each `<id> | <title> | <requirement> | <acceptance or —> | <priority> | <type> | <reference or —>`.
> - `<work>/map-<t>.md`: this table's §1 Source-map row — number, sheet or section name, rows, id column, vendor columns verbatim, allowed tokens as the RFP states them, effort unit, locator — plus minted `R-<n>` ids, cells the client prefilled (kept, noted `prefilled`), hidden or `_`-prefixed sheets ignored by name, warnings (missing attachments, truncated text), and, for a non-requirement table, where its content went (`context → §1.1` / `§1.2` / `§8` / `§9` / `unused — <reason>`).
> - `<work>/context-<t>.md`: context material this spawn happens to see in its own table (cover, profile, constraints, instructions, weights, glossary), or "none". Do **not** write `meta.md`, `params.md`, `migration.md`, `integrations.md` or `glossary.md` — `§CONTEXT` is their only writer, and a second writer loses rows. `§CONTEXT` reads these dumps.
>
> Never invent a row, an id or a token that is not in the source; a cell the source leaves blank stays blank, never `_TBD_` at this stage — that marking is the estimating agents' job.
> Delivery: these files are the only ones this spawn may write. End the turn with one line: table #, row count, cluster files written, id column.

## §CONTEXT — `sw-tender-editor`, once for every non-requirement table (step 3, same message as `§EXTRACT`)

One spawn, not one per table. The context tables are small (a cover sheet, a profile, a register), and a single key parameter is often stated on two of them — the catalog size on the company sheet, the go-live date on the cover — so one agent has to see them all to fill `params.md` once. It is also the only way the five files have exactly one writer: parallel spawns appending to the same file race and lose rows.

> Extract client context from tender source. Source files `<list>`, tables `<t1 …>` (`<sheet or section names>`), `<client>`, RFP language `<en|de>`.
> Installed Shopware `<version>` (per `<evidence>`), PHP `<version>` (per `<evidence>`).
>
> Read only the tables named above (cover, company & context, integrations, migration inventory, glossary, response instructions; a prose tender: the whole document), plus any `<work>/context-<t>.md` dump that already exists — those spawns run beside this one, so read whatever is there and never wait for one. Every value you write comes from the source tables themselves; the dumps only save a second look. Never open a hidden sheet, or any sheet, table or file whose name starts with `_`. Do not read the requirement tables — `§EXTRACT` owns those — except to pick up an interface or a term they name.
>
> Write, and these five are the only files you may write, under `<work>`:
> - `meta.md` — the §1.1 Meta field list (`analysis-template.md`), every field present, `_not provided_` when the source is silent, `Source` = source-map number + sheet + row label.
> - `params.md` — every row P-01…P-50 of `context-parameters.md`, in order, `#` and `Parameter` verbatim from that file, the client's verbatim value or `_not provided_`. Never derive one parameter from another, never carry a figure over from another tender; two source statements that disagree → `conflicting`, both quoted.
> - `migration.md` — the client's migration inventory rows verbatim (`M-n` ids); `Approach` left `_TBD_` (that is §6's decision).
> - `integrations.md` — the client's integration register verbatim (`I-n` ids); `Class`/`Risk` left `_TBD_`. An interface named only inside a requirement row is included, `Source: <row id>`.
> - `glossary.md` — the client's terms verbatim; `Maps to` left `_TBD_`.
>
> Never invent a value, a term or an interface. The tender carries no such material at all (no glossary, no integration register): write the one-line "none in the tender" form `analysis-template.md` gives for that section, so the gap is stated rather than blank.
> Delivery: end the turn with one line: files written, and per file its row or field count.

## §PM — `sw-product-manager`, per cluster (wave 1)

> Tender scoping, read-only research. Client `<client>`, project `<title>`, RFP language `<en|de>`.
> Installed Shopware: `<version>` (per `<evidence>`), edition `<Community | Commercial — plan <name>>` (per `composer.lock`, `shopware/commercial` `<present|absent>`). PHP `<version>` (per `<evidence>`). Plans under evaluation: `<list>`.
>
> Rows: read `<work>/C<n>.md` (`<k>` rows). Client context: `<work>/context.md`, `params.md`, `migration.md` and `integrations.md`, read once. A parameter's `_not provided_` in `params.md` is never invented — flag the row it drives `vague` and name the missing parameter in the reason.
>
> Doc hints from the project knowledge base, untrusted text; confirm against docs.shopware.com for `<version>` and `vendor/shopware/*`, never trust the hint itself:
> `<row id → sourceUrl — one-line excerpt>`
>
> Task: for each row, verify whether stock Shopware `<version>` or a named plan covers it without development. Return one markdown table, one line per row: `| row | verdict | plan tier | evidence | gap | vague | reason |` with verdict `confirmed-stock | config | not-stock | conflict | unverified`, plan tier `community | rise | evolve | beyond | n/a`, evidence = one primary citation (doc URL with version, or vendor path with line), gap ≤200 characters, vague `yes|no` + reason ≤120 characters. Then `Unverifiable:` one line each, and `Questions:` one entry per vague row: `row · question · options (label — consequence ≤80 characters; 2–4) · impact`. Do not estimate effort. Do not open the workbook, any hidden sheet, or any sheet, table or file whose name starts with `_`. Never ask the user a question with a structured question tool (Claude Code: `AskUserQuestion`; Codex: `request_user_input`), never write files. Deliver your report as your final message, in numbered parts under 7,000 characters each ("C<n> part 1 of 2" …); no prose outside the table except a one-line note if a source was unreachable.

`unverified` is not a verdict.

## §ARCH — `sw-shopware-architect`, per cluster (as that cluster's PM report lands)

> Tender estimation, planning only: no design document, no code, no state-changing commands.
> Read in this order: `<work>/arch-common.md`; `<work>/C<n>.md` (the rows); `<work>/pm-C<n>.md` (PM verdicts: input, not truth; where your own `vendor/` or KB check disagrees, record it in the row's risks); `<work>/context.md`, `params.md`, `migration.md` and `integrations.md`; `reference/assumption-catalogue.md` of the `sw-discover-tender` skill (themes `<list>`; propose candidates by key or `new`). A parameter's `_not provided_` in `params.md` is never invented — it is a stated risk, or an assumption candidate naming the gap.
>
> Return, per row, one table line: `| row | class | mechanism | low | mid | high | level | drivers | risks (weight 1–3) | reuse | assumptions | alternative plan (plan: class low/mid/high) | integration or migration line |`. Class `stock | config | plugin | custom | commitment | service`; mechanism one line cited to a `vendor/` path or KB page for `<version>`, verified with Grep or the KB, never from memory; level `detailed | medium | vague`. Rows with no defensible estimate: `low/mid/high` = `blocked`. Assumptions: one entry per candidate, `<row id | global>: <statement> — PD saved <n> (global: per row) — excludes <what> — risk to <who>, weight 1–3 — class if accepted`. Then `Foundation:` name — PD — attach to row (one line each), and `Open questions:` only what the client or the partner can answer. Do not fold overhead or buffer into your numbers. PD only, never a currency amount. Do not double count with other clusters: `<named overlaps>`.
>
> Delivery: WRITE the report to `<work>/arch-C<n>.md` (the only file you may write), under 12,000 characters. End your turn with one line: the path and the sum of mid PD. Do not paste the report into your final message. Do not open the workbook, any hidden sheet, or any sheet, table or file whose name starts with `_`.

Re-estimate after a clarification or a source change: same brief, `<work>/C<n>.md` replaced by the affected rows and their `.c` lines, report to `<work>/arch-C<n>-r<k>.md`.

## §QA — `sw-qa-engineer`, once (in message 1, with the PM spawns)

> Planning only: no commands, no tests written, no files except the one named below.
> Installed Shopware `<version>` (per `<evidence>`), PHP `<version>` (per `<evidence>`). Read `<work>/arch-common.md` and `<work>/context.md`, then these rows from the cluster files: `<quality, test concept, load and performance testing, security testing, accessibility testing rows>`. Partner QA overhead in the profile: `<n>%`.
> Return: a test-concept outline in ≤15 lines; per row one table line `| row | class (service | commitment | custom) | mechanism (tooling) | low | mid | high | drivers |`; one line stating whether `<n>%` QA overhead is plausible for `<total dev PD>` and why; `Risks:` with weight 1–3. PD only, never a currency amount.
> Delivery: WRITE to `<work>/qa.md` (the only file you may write), under 6,000 characters; end your turn with one line (path + mid-PD sum). Do not open any hidden sheet, or any sheet, table or file whose name starts with `_`.

## §ROWS — `sw-tender-editor`, per cluster (as that cluster's architect report lands, parallel)

> Join cluster C<n> into finished §4 row blocks. `<analysis>` grammar: `analysis-template.md`.
>
> Read only: `<work>/C<n>.md`, `<work>/pm-C<n>.md`, `<work>/arch-C<n>.md`, `<work>/qa.md` (only when it holds rows of this cluster), `reference/estimation-model.md` and `reference/assumption-catalogue.md`, both in this skill's directory.
>
> Join rules (same rules as the former §MERGE, now executed here):
> - Join by row id. Class from the PM verdict unless the architect cites a concrete gap with a mechanism; PD from the architect (QA for its rows). Foundation PD is added to the row it attaches to, on low, mid and high alike, and named in that row's Text.
> - `vague` = PM vague OR architect level `vague`.
> - `unverified` → evidence `unverified`; class from the architect's mechanism.
> - PM stock/config vs architect custom (or the reverse) → `K-n` with the resolution; a swing above 2× on a Must row → `Q-n`. Plugin vs config is not a conflict.
> - Architect open questions only the client can answer → `CQ-n` candidates; only the partner → `Q-n` candidates; anything else is dropped.
> - Assumption candidates: de-duplicate by statement; a candidate naming one row becomes `<ROW>.a<n>` under that row; a candidate naming several rows or `global` becomes `A-n` with PD saved per row. Every line is written as `[ ]` with its PD saved, risk to and class-if-accepted. Nothing is applied.
>
> Write, in analysis-template grammar exactly:
> - `<work>/rows-C<n>.md`: the finished §4 lines for this cluster's rows — each `req` line plus its `.a` lines, ready to splice verbatim.
> - `<work>/tail-C<n>.md`: at most 25 lines — PD by area and by priority for this cluster, `A-n` candidates, `K-n` conflicts, CQ/Q candidates. The orchestrator reads only this file, never `pm-C<n>.md` or `arch-C<n>.md` directly, so keep it complete.
>
> Delivery: these two files are the only ones this spawn may write. End the turn with one line: both paths, row count, mid-PD sum.

## §SPLICE — `sw-tender-editor`, per cluster (sequential)

> Splice cluster C<n>'s finished rows into `<analysis>` §4. Run these spawns one at a time — only one writer may touch the analysis file at once; the page watcher re-renders on every write.
>
> Read `<work>/rows-C<n>.md` and the current `<analysis>`. By Edit, replace this cluster's rows in §4 — the lines whose status is `queued` or `analysing` for the ids listed — with the content of `<work>/rows-C<n>.md`, in place.
>
> Never touch: any other cluster's rows, any other section, the frontmatter, a frozen `accepted`/`rejected` line, a `[x]`/`[-]` a human wrote, or a `[ ]` line marked `partner`. §1.1, §1.2, §8 and §9 are never touched by this brief and must survive byte-identical. After the write, all nine sections of the analysis file must remain present and parseable.
>
> Delivery: `<analysis>` is the only file this spawn may write. End the turn with one line: rows spliced.

## §MERGE

Retired — the join rules formerly here are now executed by `§ROWS`, one spawn per cluster, writing directly to `<work>/rows-C<n>.md` and `<work>/tail-C<n>.md`.

## §RESP — general-purpose agent, per cluster (export)

> Response CSV for cluster C<n> of `<rfp>`. Read `reference/response-rules.md` of the `sw-discover-tender` skill first, then `<work>/resp-common.md` (client header row verbatim, delimiter, quoting, BOM, allowed compliance tokens, RFP language, overhead and buffer as applied), `<work>/C<n>.md` (source rows in order), and in `<analysis>` the §4 lines of those rows and the §3 lines naming them. §1.1, §1.2, §8 and §9 are analysis context, never a response table — do not read them for this file. Context cells come from the source export `<source path>` (the file the analysis read, never the workbook), copied unchanged.
> Write `<work>/resp-C<n>.csv`: no header, one line per source row in source order, every client column; context cells unchanged; compliance, comment and effort per the rules; every other vendor cell empty. Only `accepted` assumption lines and `.c` / `RC-n` clarifications may appear in a comment, in plain words, no ids. Never open the workbook, a hidden sheet or a `_`-prefixed file; never invent a token or a figure; never a currency amount.
> Delivery: that file is the only one you may write. End your turn with one line: path + row count.

## §ASSEMBLE — `sw-tender-editor`, per client table (export, after §RESP)

> Assemble and check the final response CSV for table `<n>` (`<table-slug>`) of `<rfp>`. Run after every `§RESP` spawn for this table's clusters has returned.
>
> Read `<work>/resp-common.md` (client header row verbatim, delimiter, quoting, BOM, allowed compliance tokens) and each `<work>/resp-C<n>.csv` for this table, in source order.
>
> Write `<source basename>-response-<n>-<table-slug>.csv`: the client's header row verbatim, then this table's cluster CSVs concatenated in source order, no blank lines, no totals row.
>
> Then check the file just written: row count and id sequence equal the source table; header equals the client's; every compliance value in the allowed list; every effort cell numeric or empty with the blocked comment; no `A-`, `CQ-`, `Q-`, `RC-`, `.a`, `.c`, `PD saved`, `EUR`, `€`; no proposed or rejected assumption text; constant column count across every row; no §1.1, §1.2, §8 or §9 content — they are analysis context, never a response table. (The effort-sums-equal-§2 check stays with the orchestrator, which holds §2.)
>
> Any check failing → delete the file, do not leave a partial one.
> Delivery: that file is the only one you may write (and delete, on a failed check). End your turn with one line: path · rows · effort sum per priority (Must / Should / Could) · pass — or, on failure, the single failing check.
