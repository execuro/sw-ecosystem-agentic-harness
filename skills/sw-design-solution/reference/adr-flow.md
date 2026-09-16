# ADR flow (project-wide architecture decisions)

Entered before finalizing, when a decision affects the project as a whole rather than one feature. Decides how such decisions are detected, extracted into ADR files, and gated at readiness.

Markers: `[potential ADR]` (candidate) → `[adr] <path>` (extracted) | `[decision]` (kept, + `[architect]` if sourced there). `[adr]` is what `sw-document-feature` consumes — never vary it.

| Step | What happens |
| --- | --- |
| **1. Detect** | Architect brief's extra output: **ADR candidates** — only if it changes the *project as a whole* (runtime component/service, cross-extension framework/tool/convention, deployment topology, shared data model/integration contract). Feature-confined → `[decision]`, expect zero usually. Per candidate: title, one-line "why", decision(s) covered, logged `[potential ADR]`. Only detection source; re-runs only when re-spawned for an overturned decision. |
| **2. Ask** | One call to a structured question tool if you have one (Claude Code: `AskUserQuestion`; Codex: `request_user_input`, non-blocking outside Plan mode — end the turn after asking), one question/candidate (max 4), two options: **Extract as ADR** / **Keep inside the spec** — outside step 6's budget. No ADR without explicit Extract; kept candidates aren't re-asked. |
| **3. Extract/Keep** | Extract → `specs/NNNN-slug-adr-<kebab-topic>.md` from `reference/adr-template.md`: `status: proposed`, `id: ADR-NNNN-<kebab-topic>`, `prd`/`spec` paths, `area`, `owner: _TBD_`, `decision_needed_by: _TBD_`; Decision Log → `[adr] <path>` + summary. Keep → `[decision]` (+ `[architect]`); log `<topic> \| kept inside spec (user, YYYY-MM-DD)`. |
| **4. Depend** | First Extract adds a **Dependencies** table (`\| ADR \| Status \| Blocks readiness \|`). Re-read each ADR's `status` in continue mode; missing under `specs/` → check `docs/project-wiki/adr/` by `id` (found → `accepted (docs)`; else `missing`, blocks). Only humans change `status`. |
| **5. Gate** | `proposed`/`rejected` row blocks readiness (step 7). List `Open ADRs: <ids>`; ask once: **Wait (Recommended)** vs **Override**. Unanswered → *In progress*; override → granted, logged `readiness overridden with open ADR(s) <ids> (user, YYYY-MM-DD)`. ADR files under `specs/` are WIP; once `accepted`/built, `sw-document-feature` promotes them into `docs/project-wiki/adr/` — this skill never writes into `docs/`. |
