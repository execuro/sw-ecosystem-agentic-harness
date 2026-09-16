# Readiness and report

Entered every run, after drafting and the clarification loop. Decides the §7 confidence score and what the step 8 report contains.

### 7. Readiness

Evaluate §7 criteria (C-1…C-5) every run, set `Confidence` = met/5 %. 5/5 → **Ready for implementation**; else **In progress**, report names the first unmet criterion.

No readiness while a **Dependencies** row is `proposed`/`rejected` unless overridden — *ADR flow* sub-step 5.

### 8. Report

Seven lines: path written; status, confidence `N/5`, `Open ADRs: <ids>`/`none`; what changed (continue mode); first unmet §7 criterion or top open question, or `none`; any PRD-level inconsistency flagged this run, or `none`; `Agents: architect <consulted/not> — <headline>; QA <consulted/not> — <N> tests/<M> ACs`; `Timing: step 3 m:ss · agents m:ss · merge+write m:ss · total m:ss`.

Never paste the spec body back into chat; never edit the source PRD.
