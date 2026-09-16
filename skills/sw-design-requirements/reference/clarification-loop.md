# Clarification loop

Interactive by default; skip if unattended or the user asked for no questions — write every gap to §11, stop after step 5.

**One class of question.** Ask only if the answer changes domain modelling, functional behaviour, or acceptance criteria — test: *would requirements differ either way?* No → `(assumed)` marker or leave out, no §11 block. Never ask about wording, ordering, formatting, or anything inferable/technical. **Short and concrete:** one sentence, one decision, no preamble, no "and/or" — split into two, choice not background.

Loop: ask the user with a structured question tool if you have one (Claude Code: `AskUserQuestion`; Codex: `request_user_input`, which is non-blocking outside Plan mode — so end the turn after asking), up to 4 questions/round, 2–4 options each with a short consequence, ranked by confidence unlocked. Max 3 rounds, rest → §11. Contradictions with a prior answer, PRD, plugin, or stock Shopware: explicit choice quoting both sides (stock cites sw-product-manager's evidence).

**Recommended options must be advised — mandatory.** Never mark `(recommended)` on your own judgement; an agent recommends, this skill only records.
- `sw-product-manager` always advises; `sw-shopware-architect` too when options differ in feasibility/platform depth, per *Architect advisor*.
- One batched brief per agent per run, covering every question it advises on — never one spawn per question. PRD path, questions, options verbatim, (architect only) detected version; ask for the option and one-line reason.
- Note form: `[<agent>] <stance>: <reason>`, under its option; the recommended option always has one; a note under the question only when nothing is recommended.
- Disagree → keep `sw-product-manager`'s mark, both notes. No advice → no mark, `[pm] no recommendation — business preference`.
- Interactive: identical — a "(Recommended)" option needs the same advice, stated in its consequence line.

**Anchoring answers — mandatory.** Never a quote, Q&A pair, or transcript — rewrite into the PRD's own voice, in the section it belongs:

> "yes but only with a verified email" → §5 gains `FR-7 A guest may submit after confirming email via a one-time link.`; §12 gains `C-3 | Guest access | Allowed, gated by email confirmation | 2026-08-11`

§12 holds one line per resolved decision — topic, decision, date, never the raw question or reply. An answer invalidating existing text: edit it, note the supersession.
