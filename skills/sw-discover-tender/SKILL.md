---
name: sw-discover-tender
description: Turn a client's RFI/RFP/RFQ or project plan into confirmed Shopware scope in one working document, `specs/rfp-NNNN-slug-analysis.md`. An agent extracts every requirement into the tool's own three fixed tabs — Functional, Non-functional, Project & services — and 18-row Project information table; intake confirms itself and analysis starts automatically, corrected any time via row notes (move, skip, restore); each scope item gets a Requirement Coverage (OOTB, Configuration, Extension, ISV, Custom, or `—`), a confidence, a T-shirt-size or partner-profile effort figure, assumptions the operator accepts, and a Client Response — without an engineer. Runs on the runtime's own CLI and page (`--editor`); confirm, answer and export happen anytime, and the document reaches Ready when every scope item is confirmed. Exports as XLSX only — a surgical fit-back into the client's own workbook, or the tool's own multi-tab workbook for a CSV or PDF source. Scope and effort only — never costs, prices, licence fees or budgets. Never designs the solution — that's sw-design-solution.
when_to_use: Trigger phrases — "scope this RFP", "analyse the tender", "answer the RFI", "discover RFP 0001", "continue RFP 0001", "export the response for RFP 0001", "is RFP 0001 ready", "open RFP 0001 in the browser", "open the tender tool", "sw-discover-tender specs/rfp-0001-x-analysis.md --editor".
argument-hint: '[tender file (.xlsx|.csv|.pdf) | specs/rfp-NNNN-slug-analysis.md to continue] [--editor] [--export]'
allowed-tools: Read Write Edit Glob Grep Agent AskUserQuestion Bash(ls *) Bash(mkdir -p specs) Bash(mkdir -p specs/.rfp *) Bash(shasum -a 256 *) Bash(npx -y @execuro-sw-ecosystem/sw-tender-discovery-tool@latest *) Bash(open *) Bash(xdg-open *) Bash(tail *) Bash(grep *) Bash(printf *) mcp__ShopwareDevKnowledgeBase__list_docs mcp__ShopwareDevKnowledgeBase__grep_docs mcp__ShopwareDevKnowledgeBase__read_doc mcp__ShopwareDevKnowledgeBase__kb_status
---

# sw-discover-tender

One working document per tender: Requirement Coverage, confidence, effort, assumptions and a Client Response per scope item. The operator confirms; the next run reconciles. Export to XLSX anytime.

Requires the runtime at `sw-tender-discovery-tool` >= 0.2.0 — the working-document grammar below is a 0.2.0 contract; `sw-setup` keeps it current with `@latest`, so a project on an older runtime should re-run `sw-setup` first.

## Boundaries

- Scope and effort only. The tool never produces a figure of its own — no cost, price, rate, licence, hosting or PSP fee, no budget — `reference/estimation-model.md`'s money rule. A client's or the operator's own figure in Project information is kept verbatim; a coverage choice with a cost consequence gets a one-line `cost:` reference, no amount. Elsewhere a client-stated budget is never recorded, not even as quoted context.
- Never edit the client's file. A hidden sheet or one whose name starts with `_` is never read and never mentioned anywhere — not in section 1, not in Not taken, not in the digest.
- Assumptions are proposed by agents, accepted or rejected only by the operator. A rejected proposal is never proposed again.
- A requirement too vague to assess gets a client question (`CQ-n`), never a silent guess.
- No QA agent anywhere in the flow. Three agents only: `sw-tender-editor`, `sw-product-manager`, `sw-shopware-architect`.
- XLSX out only, via the runtime's own writer: a surgical fit-back into the client's own workbook, or a multi-tab working-sheet export for csv/pdf. The client's original is never touched, nothing is sent. No per-requirement CSV of any kind is written.

## Inputs

| Argument | Behaviour |
| --- | --- |
| `.xlsx` / `.csv` | Import first (`reference/procedure.md` step 1): `npx -y @execuro-sw-ecosystem/sw-tender-discovery-tool@latest import --source <file>` writes `import-digest.md` (install gate: `reference/editor-session.md` §0). `sw-tender-editor` runs its `extract` job on the digest and returns the extraction JSON; the skill saves it and runs `intake <doc> --source <file> --extraction <json>`. Every source runs the same extract-then-intake flow — xlsx, csv and pdf alike. A refusal (encrypted, `.xls`, `.xlsb`) is relayed verbatim and the run stops. |
| `.pdf` | New tender: `sw-tender-editor` runs its `extract` job on the PDF directly; the skill saves the JSON and runs `intake <doc> --source <pdf> --extraction <json>`. |
| `.docx` or another format | Stop. One line: export the requirement table as CSV/xlsx or the prose as PDF, and rerun with that file. |
| `*-analysis.md` | Intake already confirmed itself and queued analysis: work the chunks until none are left (`reference/procedure.md` step 2), then `check --write`, `report`. An old document still at `intake: review` needs `intake-confirm` first, on the operator's go; no separate Analyze step ever exists. |
| `--export`, or "export the response for RFP NNNN" | Continue, then `export`. |
| `--editor` | Hand off to `reference/editor-session.md` as the very first action and stop when it returns; nothing is read or assessed before the page is open. |
| `--editor-session <url> --batch-file <file>` / `--intake` | Editor mode, spawned by the editor session (`reference/editor-session.md`). |
| nothing | Ask for the path in one line and end. |

## Files

- **Working document** `specs/rfp-NNNN-slug-analysis.md`, next to the source. Committed. Grammar: `reference/analysis-template.md` — 8 fixed sections, section 4 header, cell lists, frontmatter.
- **Fit-back map** (xlsx sources only) `<srcdir>/<base>/import-map.json`, written by `intake`. Committed. No per-table CSVs are written.
- **Response** `<source basename>-response-v<n>.xlsx` (never overwritten). Committed, generated, never hand-edited.
- **Work** `specs/.rfp/<slug>/`: `extraction.json` (the `extract` job's result), `proposals.json`, `reestimate.json`, `last-run.json`, `reports/*.json` (saved architect reports before `apply`). Gitignored.
- **Editor session** `specs/.editor/<slug>/`: `import-snapshot.json`, `import-map.proposed.json`, `import-digest.md`, written by the Tender Discovery Tool. Gitignored.
- **Partner profile** `specs/rfp-partner-profile.md`. Missing: the page offers the wizard (skippable); without it the document runs in T-shirt regime (`reference/estimation-model.md`).

## Reference files

All under `reference/` in this skill's directory:

| File | When | What it decides |
| --- | --- | --- |
| `procedure.md` | every run | the seven steps: intake (extract + intake), assess, propose, estimate, confirm, answer, export; the three agents, applying a report, the run close |
| `agent-briefs.md` | steps 2-4 | one brief per agent, its tools, its delivery |
| `editor-session.md` | `--editor` / `--editor-session` in the arguments | the session loop, batch kinds, the subagent brief, close report |
| `analysis-template.md` | writing or reading the working document | frontmatter, the 8 sections, section 4 grammar, section 5 blocks |
| `project-information.md` | step 1, section 1 | the 18 Project information keys, what each captures, which estimate it informs |
| `context-parameters.md` | steps 1-2, section 1 | version/edition/plan detection from the Dev Knowledge Base only, what every agent receives |
| `coverage-mapping.md` | step 2 | the six Requirement Coverage values, the client-token map, ISV research |
| `estimation-model.md` | steps 3-4 | the two regimes, default scale, size-up drivers, not-decomposed rule, totals, money rule, the profile file |
| `client-question-rules.md` | step 3, step 6 | when a scope item gets a `CQ-n`, wording, answering |
| `assumption-catalogue.md` | step 3 (architect brief) | reusable assumption statements by key, with the effort each saves |
| `response-rules.md` | step 7 (export) | X-1…X-7, what the runtime's `export` writes |

The skill ships no executable of its own: the runtime's `import`, `intake`, `intake-confirm`, `move`, `skip`, `restore`, `info`, `apply`, `confirm`/`accept`/`reject`/`assume`/`unassume`/`answer`/`patch`/`profile`, `check`, `report` and `export` commands read and write the working document and the workbook.
