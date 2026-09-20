# Readiness and report

Entered at step 5, after the clarification loop settles. Decides how confidence is scored, what gets written, and what the step 6 report contains.

### 5. Score and write

Apply `reference/confidence-rubric.md` in this skill's directory. Fill the meta table and §13 — **Weakest dimension** is one sentence, max 25 words, naming the gap and what closes it; the run narrative belongs only in the report, never §13. Status: `In progress` below 90%; `Ready for specification` at 90%+ **and** no open §11 question — absolute, every question changes requirements. That exact string is load-bearing: the Specs Editor's PRD page renders its "Ready for Technical Specification" banner off it, so do not reword it and do not invent a third status.

Write the file. In continue mode, update `Updated`, `Confidence`, `Status` and §13; append to §12.

### 6. Report

Five lines, no more (six with an architect), each one line:
- path written
- confidence % and status
- what changed this run (continue mode)
- remaining gap costing most confidence, or `none`
- in editor mode, once the status is `Ready for specification`: `Next: sw-design-solution <prd path> --editor` — a statement of what the user runs next, never an offer, and never something this skill starts itself
- a split recommendation, phrased as a question, only if guidelines warrant one
- `Architect consulted: <topic> — <one-line verdict>`, only if spawned this run

Never paste the PRD body back into chat.
