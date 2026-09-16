# Editor mode

Entered when invoked as `<path> --editor-session <url> --batch <batch.json>` — a note batch, or "create tech spec" with a PRD path. Decides how the procedure differs from the terminal flow: no interactive questions, scoped re-verification, and progress emission.

Same procedure/boundary/verification/ADR rules, plus:

- **Scoped.** Nothing on open. Continue mode: read the batch first, run step 3 only for touched mechanisms, edit only named blocks plus invalidated ones, re-evaluate §7 — no re-verification/new §6 for untouched ACs. Full pass only for `createSpec` or an explicit review request.
- **No terminal questions.** Never ask via a structured question tool (Claude Code: `AskUserQuestion`; Codex: `request_user_input`). Every ask → §6 block: `**Q-n**`, 2–4 `- [ ]` options, one `(recommended)`, agent notes `  - [<agent>] <stance>: <reason>` under the judged option. Max 6/run. Tags: `[adr] <title>` → `A: Extract` / `B: Keep`; `[gate] Open ADRs <ids>` → `A: Wait (recommended)` / `B: Override`; step-0.5's two `[gate]` titles verbatim → `A: Bootstrap first (recommended)` / `B: Proceed unverified`. Unanswered `[gate]` → *In progress*, never auto-override.
- **Batch input.** Ticks first — a ticked question with no note is still an answer. `answer`/`[x]` tick → anchor, append Decision Log, delete block (`[adr]` sub-step 3, `[gate]` sub-step 5). `comment`/`free` → this run's briefing (block-bound `path`/`line`–`endLine`/`md`/`quote`/`hash`; verify `md` matches, fall back to `quote`; `selection` → rework only that text). `diagram` → update the graph file. *What*/*why* notes belong to the PRD. First write migrates a pre-template spec; blocks get missing options only when touched.
- **Scoped runs.** Re-spawn architect only for an overturned/new decision, QA only for a changed test plan, `sw-product-manager` only for feasibility — together still one message; else edit/verify/anchor/log alone, name agents.
- **Preserve:** status tags (`- **AC-2** [partly] (FR-3)`, `- **Decision:** [done] …`), `Diagram:` line, §6 blocks/ticks — rewrite in place, never regenerate.
- **Diagrams.** `specs/NNNN-slug-spec.architecture.graph.json`; run `npx -y @execuro-sw-ecosystem/sw-specs-editor@0.1.0 diagram specs/NNNN-slug-spec.architecture.graph.json specs/NNNN-slug-spec.architecture.excalidraw`, keep §2's `Diagram:` line — never write it directly.
- **Progress.** `npx -y @execuro-sw-ecosystem/sw-specs-editor@0.1.0 emit --since <step-0.5 start> progress "<step>" --batch <id> --doc spec` before/after each step/spawn; `--since` prefixes `+m:ss`.
- **Report:** changed blocks; answers (Q ids → anchor); first unmet §7 criterion or `none`; status/confidence/`Open ADRs`; `Agents: <list or none>`; `Timing:`.

Graph shape: `{ title, direction: "LR", groups: [{id,label}], nodes: [{id,label,type: entity|actor|service|external|event|store,group?,note?}], edges: [{from,to,label?}] }`.
