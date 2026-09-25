# Editor session — `--editor`

The Tender Discovery Tool: a local live page for one working document. The skill session that received `--editor` runs this loop and nothing else; nothing is read, intaken or assessed before the page is open.

**The protocol is not in this file.** Run

```
npx -y @execuro-sw-ecosystem/sw-tender-discovery-tool@latest guide
```

and follow it: the xlsx import, start, poll, emit, redelivery and close, and every command's `next_step:` line. This file adds only what `guide` cannot know: the install gate, which batch kinds this skill runs, the subagent brief, and the close report.

## 0. Install gate

The Tender Discovery Tool is an optional add-on: what a host installs is its own skill, `sw-tender-discovery-tool`, shipped inside the npm package and installed by `sw-setup`. Before anything else, check whether that skill is present in this host's skills directory. Present — continue. Absent — stop the run. Do not fall back to non-editor mode. Tell the user in one line: the Tender Discovery Tool is not installed; run the `sw-setup` skill to add it, or re-run without `--editor`.

## 1. Prepare

`<slug>` = the source file name without its extension. Working document `specs/rfp-<slug>-analysis.md`. Session state under `specs/.editor/<slug>/`, gitignored.

## 2. Open the session

Follow `guide` steps 0-1: import an xlsx source first when it has not yet been extracted and intaken, then `start`, then open the printed URL and tell the user in one line. `start` on a source with no working document yet queues the opening `intake` batch itself — extraction plus intake — the moment the page opens; nothing here has to send it. It arrives at the first `poll` in this session, same as any other batch; there is no mapping screen.

## 3. Page actions are not batches

Move an item, skip an item, restore an item, edit a Project information value, answer a client question, edit a profile input, patch a Client Response or an Internal note, and export are all handled by the runtime's own commands directly (`move`/`skip`/`restore`/`info`/`confirm`/`unconfirm`/`assume`/`unassume`/`answer`/`patch`/`profile`/`export`); the page calls them without spawning this skill (`confirm` and `unconfirm` save at once even while this session's run holds the lock, so `apply` sees a confirmed row as confirmed), except when export needs a token map first — see the `export` batch kind below. Accepting or rejecting a proposal instead queues a decision alongside notes; the server applies it through the same `accept`/`reject` commands the moment a `notes` batch is sent — before this skill ever sees the batch (see the `notes` row below) — never re-applied by this session. Move, skip and restore work at any time, through a row note — skipping a confirmed item is refused ("unconfirm first"), and the operator's own `unconfirm` (a second click on the row's confirm tick, no dialog) reopens the item so a skip or another correction can follow. Intake queues the opening `analyze` batch itself once it confirms, and an `accept`/`answer`/`profile` change queues a `reestimate` batch the same way — this session never has to send either. `intake-confirm` stays only for an old document still at `intake: review`, and this session runs it on the operator's go before any of the above. This session only spawns a subagent for the five batch kinds below.

## 4. Batch kinds

| kind | Work |
| --- | --- |
| `intake` | Extraction (`procedure.md` step 1): `sw-tender-editor`'s `extract` job on the digest or the PDF, then `intake`. Writes section 1's Project information and Not taken tables and every new item `queued`, then confirms itself (`intake: confirmed`) and queues the opening `analyze` batch. |
| `analyze` | Assess exactly the batch's `items` (about 15 ids, in page order — `procedure.md` step 2): split into groups of about 5, spawn PM→architect pairs in parallel per group (cap 10 spawns per message), `apply` each report as it returns. Refused while `intake: review` (an old document not yet confirmed). Intake confirming itself, and any re-estimate work while confirmed, queues this automatically — nothing here sends it. The server chains batches on its own: when this one finishes it queues the next chunk of items still needing work, releasing the lock in between so a page action lands before the next chunk starts; the chain ends when no work is left. |
| `reestimate` | The items named in `reestimate.json` (or all, on `item: "*"`): re-run steps 2-4 for those items only. |
| `notes` | Queued annotations and/or chat. A note on a scope row reading "move to <tab>" or "skip: <why>" is applied with `move`/`skip` directly, at any time, not folded into re-assessment — skip on a confirmed item is refused ("unconfirm first"). Any queued accept/reject decision on a suggested assumption has already landed by the time this batch is sent (the server applies it while enqueueing the batch) — treat it as done, never re-apply it from the batch payload. Any other note, while `intake: confirmed`: no item is re-assessed and the run records why an annotation was or was not applied. While `intake: review` (an old document), the remaining notes are folded into a re-run of `extract` and `intake`. |
| `export` | The page's Export enqueues this when an XLSX table still lacks its coverage-to-client-token map: `tokens --suggest`, decide the map per table key `<sheet> r<headerRow>` (`coverage-mapping.md`), `tokens --file`, then `export` (`procedure.md` step 7). Post the output path and the chosen map (per table, six lines) in chat; on a refused token, adjust and retry once, else post the reason. |

Every batch, of every kind, ends with `check <doc> --write` then `report <doc>`, whose output is posted to the page as the reply (`procedure.md` "Run close").

## 5. Handle one batch

Spawn ONE subagent (Agent tool, `general-purpose`). Brief, verbatim structure:

```
Run the skill sw-discover-tender in editor mode.
Invoke it with the Skill tool: skill "sw-discover-tender", args "<doc path> --editor-session <url> --batch-file <batch file>"
  (kind=intake: args "<source path> --editor-session <url> --intake" — first run on the source).
If the Skill tool is not available to you, read the SKILL.md of the `sw-discover-tender` skill and follow it exactly.
Rules: never ask the user a question with a structured question tool (Claude Code: `AskUserQuestion`; Codex: `request_user_input`); every gap becomes a section 5 block with options; emit progress with
  npx -y @execuro-sw-ecosystem/sw-tender-discovery-tool@latest emit progress "<step>" --batch <id>
  before each procedure step and before/after each agent spawn; never write into a confirmed item's Client Response or Internal note except through `patch`; never edit the client's file.
Context — last chat entries (newest last):
<last 10 lines of specs/.editor/<slug>/chat.jsonl, use `tail -n 10`>
Return, as your final message, the run report from `report <doc>`. Nothing else.
```

When the subagent returns, post its report as the reply. If it fails or returns nothing usable, still post a reply (`Run failed: <one line>`) so the lock is released.

## 6. Close

The page going quiet (closed tab, reload, laptop sleep) does not end the session right away: `guide` step 7's close grace holds it open for reconnect first, so keep polling through `idle` and only stop on `closed`.

On `closed` (or when the server is unreachable): read `specs/.editor/<slug>/session.json` and report:
- document path and the source it answers
- batches processed this session
- state, and confirmed-of-total from the last `report`
- path of the chat log (`specs/.editor/<slug>/chat.jsonl`)
- how to resume: re-run the same command with `--editor`

## Notes

- Order of operations is fixed: server -> xlsx import (when applicable) -> browser -> opening batch -> loop.
- Everything under `specs/.editor/` and `specs/.rfp/<slug>/` is session state and gitignored; the working document next to the source is tracked.
