# Draft: architect/QA spawn, merge, dependencies

Entered once research and evidence are gathered. Decides how the architect and QA agents are briefed, how their output is merged, and how cross-AC dependencies are resolved.

### 4. Draft

**One message, two spawns** — `sw-shopware-architect` and `sw-qa-engineer` (plan mode), parallel not sequential.

Architect brief: PRD path, ACs, version + evidence, step-3 KB paths, the three evidence rules, plus: every literal identifier (class, tag, prop, field type) needs its own citation; the ADR-candidate bar (*ADR flow*, Detect); report ≤ 40 lines — one line/decision (`Decision | mechanism | vendor file:line (live call site) | KB path — "quoted sentence" | verified/unverified`) plus Extension points, Data model, Work slices, ADR candidates, Trade-offs, Verified assumptions, Open questions; never `list_docs`.

QA brief, tagged "plan mode": PRD ACs, version + evidence, plugin directory, placeholders allowed (`<service>`, `<route>`, `<class>`), report ≤ 25 lines: `AC-n | level | test file (placeholders allowed) | scenario | first failure | edge cases`.

**Merge in context**, no re-spawn — fill QA placeholders from the Work slices; re-spawn QA only if the architect's mechanism contradicts an assumed test level (rare). Re-spawn the architect whenever a later verification or clarification answer overturns a central decision, in editor mode or the terminal flow.

**Spot-check ≤ 2 central decisions** (data model, extension mechanism) — one Read each of the cited `file:line`. Fails → `(unverified — …)`; else the architect's evidence stands. Before finalizing, also re-scan every inline-code identifier written in the spec and confirm each has its own citation against a live example used the same way (bound writable, not display-only) — in addition to the architect brief's identifier rule.

Architect-sourced decisions get Decision Log `[architect]`; open questions feed step 6. Run *ADR flow* (Detect → Ask → Extract/Keep → Depend) before finalizing.

**Resolve cross-AC dependencies, maximize parallelism.** From the Work slices, find genuine dependencies (shared migration/entity/file/contract) — never default to PRD order. Group dependency-free ACs for parallel build, preferring decisions that reduce coupling. Record `Depends on` (AC ids or `none`) per AC in §3. Per-AC TDD unaffected — failing test(s) first, acceptance/e2e right after, whatever runs in parallel.

Fill `reference/tech-spec-template.md` in this skill's directory. Each AC block: the decision ("what will exist", not code), a TDD plan, the QA brief's test(s) plus an e2e scenario where user-facing — state the planned test file path (e.g. `tests/acceptance/tests/<Plugin>/<slug>.spec.ts`) alongside the description on every AC; `sw-implement-feature` writes and runs it per-AC, `sw-verify-feature` only audits it. Unknown sections `_TBD_`; never invent unimplied thresholds/SLAs/tech.
