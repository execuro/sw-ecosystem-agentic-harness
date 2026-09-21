# Clarification loop

Entered when a gap changes architecture, data model, or test strategy. Decides when and how to ask the user, and how answers are anchored into the spec.

### 6. Clarification loop

Interactive by default. Unattended/no-questions → write gaps into **Open Questions**, stop after step 4.

Ask only if the answer changes architecture, data model, or test strategy; otherwise `(assumed)`, no §6 block — every open question blocks readiness. One sentence, one decision, no preamble; split "and/or".

Loop: ask the user with a structured question tool if you have one (Claude Code: `AskUserQuestion`; Codex: `request_user_input`, which is non-blocking outside Plan mode — so end the turn after asking), ≤ 4 questions/round, 4 options each with a consequence, one recommended. Rank by unblock impact. Max 3 rounds; rest → **Open Questions**.

**Recommended options must be advised — mandatory.** Never mark `(recommended)` on your own judgement; an agent recommends, this skill only records. `sw-shopware-architect` advises; `sw-product-manager` too where an option turns on stock Shopware behaviour. One batched brief per agent per run covering every question it advises on — never one spawn per question: spec path, questions and options verbatim, version + evidence; ask for the option and a one-line reason. Note form `[<agent>] <stance>: <reason>` under its option; the recommended option always has one. Disagree → keep the architect's mark, both notes. Advised and declined → no mark, `[architect] no recommendation — project preference`. **Exception:** `[adr]` and `[gate]` blocks carry pre-canned options and need no spawn. In editor mode the advice happens in the run that raises the question — see *Editor mode*.

**Anchoring — mandatory.** Never a quote/transcript — rewrite into the spec's own voice, plus one **Decision Log** line (topic, decision, date). Answer invalidates existing text → edit it, log the supersession.
