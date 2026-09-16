# Clarification loop

Entered when a gap changes architecture, data model, or test strategy. Decides when and how to ask the user, and how answers are anchored into the spec.

### 6. Clarification loop

Interactive by default. Unattended/no-questions → write gaps into **Open Questions**, stop after step 4.

Ask only if the answer changes architecture, data model, or test strategy; otherwise `(assumed)`, no §6 block — every open question blocks readiness. One sentence, one decision, no preamble; split "and/or".

Loop: ask the user with a structured question tool if you have one (Claude Code: `AskUserQuestion`; Codex: `request_user_input`, which is non-blocking outside Plan mode — so end the turn after asking), ≤ 4 questions/round, 4 options each with a consequence, one recommended. Rank by unblock impact. Max 3 rounds; rest → **Open Questions**.

**Anchoring — mandatory.** Never a quote/transcript — rewrite into the spec's own voice, plus one **Decision Log** line (topic, decision, date). Answer invalidates existing text → edit it, log the supersession.
