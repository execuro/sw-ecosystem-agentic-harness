---
name: sw-discover-tender
description: Analyse a client tender (RFP, RFI or RFQ) for a Shopware 6 project into one markdown sidecar, <source basename>-analysis.md. Every requirement row gets a class against the installed Shopware version (stock / config / plugin / custom), a three-point person-day estimate, one line of mechanism and proposed scope-lock assumptions the partner accepts by ticking checkboxes — in the file or on the Tender Discovery Tool page (`--editor`); the next run reconciles the ticks, dissolves answered questions and re-estimates. At Ready to submit it exports one CSV per client table with compliance, comment and effort filled in the client's columns. Scope and PD only — never costs, prices, licence fees or budgets. Never designs the solution — that's sw-design-solution.
when_to_use: Trigger phrases — "scope this RFP", "analyse the tender", "answer the RFI", "discover RFP 0001", "continue RFP 0001", "reconcile RFP 0001", "export the response for RFP 0001", "is RFP 0001 ready to submit", "open RFP 0001 in the browser", "open the tender tool", "sw-discover-tender specs/rfp-0001-x-analysis.md --editor".
argument-hint: '[tender file or folder of exports (.xlsx|.md|.txt|.csv|.pdf) | specs/rfp-NNNN-slug-analysis.md to continue] [--editor] [--batch <n|all>] [--export]'
allowed-tools: Read Write Edit Glob Grep Agent AskUserQuestion Bash(ls *) Bash(mkdir -p specs) Bash(mkdir -p specs/.rfp *) Bash(shasum -a 256 *) Bash(npx -y @execuro-sw-ecosystem/sw-tender-discovery-tool@0.1.0 *) Bash(open *) Bash(xdg-open *) Bash(tail *) Bash(grep *) Bash(printf *) mcp__ShopwareDevKnowledgeBase__list_docs mcp__ShopwareDevKnowledgeBase__grep_docs mcp__ShopwareDevKnowledgeBase__read_doc mcp__ShopwareDevKnowledgeBase__kb_status
---

# sw-discover-tender

One markdown sidecar per tender, `<source basename>-analysis.md`: class, three-point PD, mechanism and proposed assumptions per requirement row. The partner ticks, the next run reconciles. At Ready to submit: one response CSV per client table.

## Boundaries

- PD only. No costs, prices, rates, licence, hosting, PSP or CMP fees, no budget comparison. A stated budget is quoted in §1.1 as context.
- Never edit the client's file. Never read a hidden sheet or anything whose name starts with `_`; name it in §1.3 as ignored. Pass this to every agent.
- Assumption lines are written as `[ ]` only. `accepted` exists solely as the result of a human `[x]`.
- A vague row gets a client question (`CQ-n`) or a proposed assumption, never a silent guess.
- One line of mechanism per row. Design belongs to `sw-design-solution`.
- Markdown and CSV out, plus the response workbook the tender tool writes as a **copy** of the client's file. The skill owns no executable: the workbook is read and written by the tender tool's own zero-dependency reader. The client's original is never touched, no docx is written, nothing is sent.

## Inputs

| Argument | Behaviour |
| --- | --- |
| `.md` / `.txt` / `.csv` / `.pdf`, or a folder of such exports | New tender: extract, analyse, write `<basename>-analysis.md` next to the source |
| `.xlsx` | Import first, per `reference/procedure.md` step 1 ".xlsx import": `npx -y @execuro-sw-ecosystem/sw-tender-discovery-tool@0.1.0 import` proposes a mapping (install gate: `reference/editor-session.md` §0), confirmed via `--editor` or a one-line yes/no, before the normalised source and the analysis are set. A refusal (encrypted, `.xls`, `.xlsb`) is relayed verbatim and the run stops |
| `.docx` | Stop. One line: export every requirement table as CSV UTF-8 (or paste it as markdown tables, header row kept) and rerun with that file or folder |
| `*-analysis.md` | Continue: reconcile, advance, rewrite in place |
| `--export`, or "export the response for RFP NNNN" | Continue, then run step 9 if the gate holds |
| `--editor` | Hand off to `reference/editor-session.md` in this skill's directory as the very first action and stop when it returns; nothing is read, reconciled or analysed before the page is open |
| `--editor-session <url> --batch-file <file>` / `--analyze` | Editor mode (section below), spawned by the editor session |
| `--batch <n>` / `--batch all` | How many requirement rows one estimate run covers. Default 50. `all` = the whole document in a single run (no estimate groups). Stored in the frontmatter as `batch:` and reused by every later run on that analysis until the flag is given again |
| nothing | Ask for the path in one line and end |

## Files

- **Analysis** `<source basename>-analysis.md`, next to the source. Recommended: `specs/rfp-NNNN-slug.<ext>` → `specs/rfp-NNNN-slug-analysis.md`. Committed. Structure: `reference/analysis-template.md` in this skill's directory; the nine section numbers, the four §1 subsection numbers and every title are fixed.
- **Source export** `<source dir>/<basename>/<pos>-<sheet-slug>.csv` plus `import-map.json`, written by the tender tool's `import` from the confirmed mapping. Committed; they are what the analysis reads, hashes and exports from.
- **Response** `<source basename>-response-<n>-<table-slug>.csv`, one per client table. Committed, generated, never hand-edited.
- **Work** `specs/.rfp/<slug>/`: `map-<t>.md`, `context-<t>.md`, `context.md`, `meta.md`, `params.md`, `migration.md`, `integrations.md`, `glossary.md`, `C<n>.md`, `pm-C<n>.md`, `arch-common.md`, `arch-C<n>.md`, `qa.md`, `rows-C<n>.md`, `tail-C<n>.md`, `resp-common.md`, `resp-C<n>.csv`. Gitignored.
- **Editor session** `specs/.editor/<slug>/`, written by the Tender Discovery Tool. Gitignored; never hand-edited.
- **Profile** `specs/rfp-partner-profile.md`. Missing: write the template from `estimation-model.md` with `_TBD_` and add a `high` `Q-n` to fill it. `_TBD_` overhead or buffer: PD final is stated before both, §2 says so.

## Procedure

**0. Mode.** `--editor` → `reference/editor-session.md`, per the Inputs row above, and stop there. `--editor-session` → work through `reference/procedure.md` under `reference/editor-session.md`'s *Editor mode* rules.

## Reference files

All under `reference/` in this skill's directory. Work through them, in order, for a run:

| File | When | What it decides |
| --- | --- | --- |
| `procedure.md` | every run | steps 1–9: target/source, reconcile, extract, ground truth, fan out, questions, estimate/score/write, the 8-line report, export; delegation, batch size, staged writes |
| `agent-briefs.md` | step 5 (fan out), step 9 (export) | PM, architect, QA, extract, rows, splice, response, assemble briefs; parallelism, caps, delivery rules |
| `editor-session.md` | `--editor` / `--editor-session` in the arguments | the session loop; its "Editor mode" section: batch kinds, tick grammar, notes handling, preserve rules |
| `analysis-template.md` | writing or reading the analysis file | frontmatter, the nine sections, row and status grammar |
| `context-parameters.md` | steps 4 and 6, §1.2 | the P-01…P-50 key-parameter template, estimate-driving flags, missing-parameter question stubs |
| `confidence-rubric.md` | step 7 | dimensions, bands, status rule, honesty rules |
| `estimation-model.md` | steps 2, 5, 7 | three-point, levels, assumption deltas, folding, partner-profile template |
| `client-question-rules.md` | step 6 | vague-row detectors, blocking, wording, cap, answers |
| `assumption-catalogue.md` | step 5 (architect brief) | reusable scope-lock statements by theme |
| `coverage-mapping.md` | step 5 (architect brief), step 9 | class → client token, synonyms, edition tiers |
| `response-rules.md` | step 9 (export) | the response CSV rules (`RSP-1` … `RSP-7`), verbatim for the sub agent brief |
| `editor-mode.md` | harness maintenance only | pending harness edits for this skill; not part of a run |

No scripts: the skill ships no executable. The tender tool's `import --source <file>` and `export --xlsx --source <file>` commands read and write the workbook.
