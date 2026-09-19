# Editor mode

Invoked as `<path> --editor-session <url> --batch <batch.json>` — one note batch from the page. Continue mode, same procedure, boundary, anchoring/logging rules, plus:

- **Scoped to the batch.** Never a full pass on open. Step 2 only for concepts/PRDs/plugins the notes touch; edit only named blocks plus whatever answers invalidate; re-score every run; §11 blocks only where the batch exposed a gap.
- **No terminal questions.** Never invoke a structured question tool (Claude Code: `AskUserQuestion`; Codex: `request_user_input`). Every gap becomes a §11 question block (`**Q-n**`, 2–4 `- [ ]` options, one `(recommended)`), notes per *Recommended options must be advised*. Max 6/run, ranked by confidence.
- **Batch input**: read ticks first — a tick with no note is still an answer. Per note: `answer` or `[x]` tick (own answer `- [x] ✎ text`) → anchor per *Anchoring answers*, append §12, delete block. `comment`/`free` → this run's briefing (block-bound: `path`, `line`–`endLine`, verify `md`/`hash`, fall back to `quote`, honour `selection`). `diagram` → update the graph file (below). Technical note → report belongs to the spec, change nothing.
- **Full pass on request only.** A review request ("check the whole PRD", "reconcile") runs the full flow: step 2, §11 gap review, missing options/marks/notes filled. Otherwise touched questions get options.
- **Scoped agent runs.** Spawn `sw-product-manager`/`sw-shopware-architect` only when a note touches feasibility, §10, or a §11 block changes (one brief per run); else edit, anchor, log alone.
- **Preserve on every write:** status tags on item ids (`- **FR-3** [done] …`, also `AC-n`/`BR-n`), the `Diagram:` line, the §11 question blocks and ticks. Rewrite in place; never regenerate.
- **Diagrams.** Domain diagram: `specs/NNNN-slug.domain.graph.json` (business concepts only). Write/update, run `npx -y @execuro-sw-ecosystem/sw-specs-editor@latest diagram specs/NNNN-slug.domain.graph.json specs/NNNN-slug.domain.excalidraw`, ensure §4 carries `Diagram: specs/NNNN-slug.domain.excalidraw`; never write `.excalidraw` directly, first request only.
- **Progress.** Before each step, before/after each spawn: `npx -y @execuro-sw-ecosystem/sw-specs-editor@latest emit progress "<step>" --batch <id> --doc prd`.
- **Report:** changed blocks, answers (Q ids → anchor), top remaining gap or `none`, confidence %, status, `Agents: <list or none>`.

Graph shape (`bin/cli.mjs diagram` input): `{ "title", "direction": "LR", "groups": [{id,label}], "nodes": [{id,label,type: entity|actor|service|external|event|store, group?, note?}], "edges": [{from,to,label?}] }`.
