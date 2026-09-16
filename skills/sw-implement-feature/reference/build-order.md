# Build order and parallelisation

Entered from step 0 of `sw-implement-feature`, before any agent is spawned. It decides *what* is built in which order and what may run concurrently.

Work through the spec's §3 **Parallel groups** (written by `sw-design-solution`), one group at a time, in the build order given — not raw AC order. Within a group, every AC is implemented concurrently; a group only starts once every AC it depends on (per each AC's `Depends on` line) has gone fully green (test passing, conformance clean per step 3 below).

**When the spec has no Parallel groups / Depends on data (older spec).** Fall back to determining parallel safety yourself, conservatively: default to sequential, and only parallelize a set of ACs when **all** of the following hold:
- None of them touch the same migration, entity/DAL definition, or plugin service registration (`services.xml`) — check the spec's data model section, not just the AC text.
- At least one AC from the same architectural area (entity, association, core extension point) has already gone green sequentially first, so the underlying approach is proven against the real framework, not still an assumption.
- They don't depend on each other's output (one AC's test fixture, service, or UI element being present for another's).

Note in the final report that the spec predates dependency data, so re-run `sw-design-solution` on it to unlock full parallelization next time.

**Even with an explicit group, keep the proven-approach guard.** The spec's dependency data tells you *what* is safe to parallelize architecturally, not that the approach has been exercised against the framework yet. For the first group, land one AC from each distinct architectural area (entity, association, core extension point) before fanning the rest out — once proven green, the rest of that area's ACs across any group go fully parallel.

If a parallelized AC's test fails for an architectural reason (not a simple bug), stop all parallel work in that group — the shared assumption behind them may be wrong, and continuing would just multiply the rework. Escalate per the Architect escalation rule below before resuming the group.

