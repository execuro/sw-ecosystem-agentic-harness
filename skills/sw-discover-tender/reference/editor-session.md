# Editor session — `--editor`

The Tender Discovery Tool: a local live page for one analysis document. The skill session that received `--editor` runs this loop and nothing else; every content change is made by the user on the page (ticks, answers, proposed lines, notes) or by this skill in editor mode, spawned as a subagent per batch. Nothing is read, reconciled or analysed before the page is open.

**The protocol is not in this file.** Run

```
npx -y @execuro-sw-ecosystem/sw-tender-discovery-tool@latest guide
```

and follow it: it is the single source for the xlsx import, start, the batch kinds, poll, emit, redelivery and close, and every command ends with a `next_step:` line. An installed copy of any of that goes stale against a newer CLI. This file adds only what `guide` cannot know — the install gate, the row-batch setting, which opening batch to post, the subagent brief, the follow-up queueing grammar and the close report.

## 0. Install gate

The Tender Discovery Tool is an **optional add-on**: what a host installs is its skill, `sw-tender-discovery-tool`, which ships inside the npm package and is installed by `sw-setup`.

Before anything else, check whether that skill is present in this host's skills directory. Present → continue. Absent → **stop the run**. Do not fall back to non-editor mode, do not write the analysis, do not continue the procedure. Tell the user in one line: the Tender Discovery Tool is not installed; run the `sw-setup` skill to add it, or re-run without `--editor`. The `.xlsx import` step in `reference/procedure.md` uses this same gate and stops the same way.

## 1. Prepare

- `grep -q "specs/.editor" .gitignore || printf '\n/specs/.editor/\n' >> .gitignore`
- `<slug>` = file name without `-analysis.md` (or without the source extension); analysis `specs/<slug>-analysis.md`; session folder `specs/.editor/<slug>/` (gitignored).
- **Row-batch setting:** `--batch <n|all>` from the invocation, else the analysis frontmatter's `batch:`, else 50. Keep it for the whole session and pass it to every subagent. `guide` knows nothing about this.

## 2. Open the session

Follow `guide` steps 0–1: import an `.xlsx` source first when it has no confirmed mapping, then `start`, then open the printed URL in the browser and tell the user in one line.

Keep the printed `TENDER_TOOL_URL=<url>` (with its trailing slash) for the whole session — the subagent brief needs it.

**An xlsx tender's opening batch is the mapping confirmation, not `analyze`.** The page opens on the steering screen, where the user says which tabs are requirement tables, where each header sits and what each column means. Confirming writes the normalised CSVs and arrives here as a batch with `stage: import` (§4). Do not post `analyze` for an xlsx tender.

## 3. Opening batch (page first, then the agentic flow)

Read `status`, then post exactly one of:

| State | Post | Why |
| --- | --- | --- |
| analysis `missing` | `batch --kind analyze` | Steps 1–4 and the skeleton write only, handled by §4. The page renders every requirement row as `queued` within minutes; the estimate batches follow from §4a. |
| `found`, pending ticks/answers/proposals > 0 | `batch --kind reconcile` | Unreconciled from an earlier session. |
| `found`, nothing pending | nothing | The page renders the document as it is. |
| xlsx with no confirmed mapping | nothing | §2: confirming the mapping is the opening batch. |

Then poll per `guide` until `closed`: `event: batch` → §4, then poll again; `event: closed` or unreachable → §5.

## 4. Handle one batch

The batch JSON's `kind` (`analyze` | `reconcile` | `batch` | `export`) decides which case in the brief below applies; its fields are listed in `guide`. `batch_file` is absolute — open it as given, whatever your working directory is.

Spawn ONE subagent (Agent tool, `general-purpose`). Brief, verbatim structure:

```
Run the skill sw-discover-tender in editor mode.
Invoke it with the Skill tool: skill "sw-discover-tender", args "<analysis path> --editor-session <url> --batch-file <batch file>"
  (kind=analyze: args "<source path> --editor-session <url> --analyze" — first run on the source, writes <analysis path>;
   kind=reconcile: the same args as a batch — a plain continue run: reconcile the ticks and answers in the file, re-estimate, rescore;
   kind=export: args "<analysis path> --editor-session <url> --batch-file <batch file> --export").
Append the session's row-batch setting to the args when it is not the default: <--batch n | --batch all>.
If the Skill tool is not available to you, read the SKILL.md of the `sw-discover-tender` skill and follow it exactly, including its "Editor mode" section.
Rules: never ask the user a question with a structured question tool (Claude Code: `AskUserQuestion`; Codex: `request_user_input`); every gap becomes a §5 block with options; emit progress with
  npx -y @execuro-sw-ecosystem/sw-tender-discovery-tool@latest emit progress "<step>" --batch <id>
  before each procedure step and before/after each agent wave; never change a [x] or [-] except by reconciling it; keep every [ ] line whose
  Evidence / risk or Risk to says "partner"; frozen accepted/rejected lines stay byte-identical; never edit the client's file.
Context — last chat entries (newest last):
<last 10 lines of specs/.editor/<slug>/chat.jsonl, use `tail -n 10`>
The batch file's `stage` field ("estimate C1,C2", "finalize") says which part of the procedure this batch is; the skill's Editor mode section defines them.
Return, as your final message, the skill's 8-line report with its final `next:` line (plus the 3 export lines for kind=export). Nothing else.
```

When the subagent returns, post its report as the reply, per `guide`. If it fails or returns nothing usable, still post a reply (`Run failed: <one line>`) so the lock is released.

## 4a. Queue the follow-up batches

The report's last line is `next: estimate C1,C2 | C3,C4` or `next: none`. After posting the reply, post one `batch --kind batch --stage "<group>"` per group in order, then `--stage finalize` after the last one, then go back to the poll.

Group sizes come from the session's row-batch setting (§1), so the `next:` line already names them — post exactly those groups. Post them all at once: the queue is FIFO and unbounded, so a batch the user sends meanwhile simply takes its turn, and every group releases the lock when it ends, which is when the ticks made during it are applied. Never post a group whose rows are no longer `queued`. `next: none` → nothing to queue.

## 5. Close

On `closed` (or when the server is unreachable): read `specs/.editor/<slug>/session.json` and report five lines:
- analysis path (and the source it answers)
- batches processed this session
- status · confidence · pending ticks (from `status` before the close if reachable, else the frontmatter)
- path of the chat log (`specs/.editor/<slug>/chat.jsonl`)
- how to resume: re-run the same command with `--editor`; ticks live in the file, chat and unsent notes are restored

## Notes

- Order of operations is fixed: server → xlsx import (when applicable) → browser → opening batch → loop. If you find yourself reconciling or analysing before the page is open, stop and go back to §2.
- The page writes only what a human would type: `[x]` / `[-]` / `[ ]` in a Status cell, `- [x]` on a question option, `Other: <text>`, new `[ ]` assumption lines marked `partner`, and `X-n` exclusion lines in §3. Everything else in the file is written by this skill in editor mode.
- A batch may arrive while rows are still `queued`: that is normal. The user works on the rows already estimated while the rest are still being worked out.
- Everything under `specs/.editor/` is session state and gitignored; the analysis file next to the source is tracked.

## Editor mode — the skill's own run when spawned by this session

Invoked by the editor session (`reference/editor-session.md` in this skill's directory, this file) as a subagent: `<analysis path> --editor-session <url> --batch-file <batch.json>`, `<source path> --editor-session <url> --analyze` (first run), or `… --batch-file <batch.json> --export`. `--batch-file` is the session's batch descriptor; `--batch <n|all>` is the row-count setting and means the same here as anywhere. Same procedure (`reference/procedure.md`), same boundaries, same reconciliation, plus:

- **Batch kinds.** The batch file's `kind` and `stage` decide the work; a batch is short by design, so the lock is released often and the user's ticks land between batches.

| kind · stage | Work |
| --- | --- |
| `analyze` | Steps 1–4 and the **skeleton write only**. Do not estimate. End with `next: estimate <groups>` so the session can queue the rest. Under `--batch all` this batch runs steps 1–8 for every row instead and ends with `next: none`. |
| `batch` · `stage: import` | The user confirmed what is in the client's workbook. Read `import-map.json` (the batch's `importMap` names it): its `tables` are §1.3 Source map — number, sheet name, rows, id column, vendor columns and allowed tokens, all confirmed by a human. Then continue exactly as `analyze`: steps 1–4 and the skeleton write only. |
| `batch` · `stage: estimate C3,C4` | Step 5 for those clusters only (pipelined per cluster), then `§ROWS` and `§SPLICE`. No totals. `next:` names the groups still left. |
| `batch` · `stage: finalize` | Step 7 and step 8: §2, score, §3, §5, §6, §7, frontmatter. |
| `batch` (notes, chat) | A continue run briefed by the notes and chat in the batch file. |
| `reconcile` | Step 2 first (every `[x]` → `accepted <date>`, `[-]` → `rejected <date>`, ticked options → `.c` lines / `RC-n` and the block dissolved, rows recomputed, §2 rescored, one `C-n` per decision), then steps 4–7 for the rows it touched. |
| `export` | Reconcile, then step 9. |

- **Tick grammar from the page.** The box is matched at the start of the Status cell: `[x] suspect` and `[-] suspect` are a human decision on a suspect line; the suffix is dropped on reconcile. A `[ ]` line whose Evidence / risk says `risk to <x>; partner` (§4) or whose Risk to says `<x> (partner)` (§3) was written by the partner on the page: keep it, estimate its effect like any candidate, never delete or reword it.
- **Notes.** `comment` notes carry `block`, `blockKind`, `path` (section breadcrumb), `line`–`endLine`, `md` (the block's source line), `quote`, `hash` and sometimes `selection` (the exact text the user highlighted). Open the file at that range under that path, confirm the text matches `md`, fall back to searching for `quote` when lines shifted. By `blockKind`: `req` → the note questions the class, mechanism or estimate: re-spawn the architect for that row only and rewrite the `req` line; `assume` / `global` → rewrite the statement as a new `[ ]` line (a frozen line is never edited; a proposed line may be replaced in place), or adjust `PD saved` when the note is about the figure; `clarify` → the decision text; `question` → reword or re-option the block (keep its id); `section` / `paragraph` / `row` → that text. `free` notes and `chat` are the briefing for the run. No PD figure ever comes from the page: a note asking for a different number is an architect question, not a hand edit.
- **A note on a row still `queued` or `analysing`** is not an immediate re-spawn: carry it into that row's own estimate batch and answer it there.
- **Preserve on every write.** Frozen `accepted <date>` / `rejected <date>` lines byte-identical; every `[x]` / `[-]` untouched except by reconciling it; partner-proposed `[ ]` lines; `X-n` exclusions the page added; §1.1, §1.2, §8, §9 and the nine section headings; the frontmatter block. Rewrite lines in place, never regenerate from the template. Every write must leave the document parseable — the page re-renders on each one.
- **Progress.** `npx -y @execuro-sw-ecosystem/sw-tender-discovery-tool@latest emit progress "<step>" --batch <id>` before each procedure step and before and after each spawn wave; the page shows it. Row status carries the rest: `queued` → `analysing` → `estimated`.
- **Report.** The 8-line report of step 8 with its `next:` line (plus the 3 export lines); the editor posts it to the page. Never paste the document into the report.
