---
name: sw-verify-feature
description: Verify a feature implementation against its technical spec (specs/NNNN-slug-spec.md) by running three independent verifiers in parallel — AC test coverage/health, architecture/guideline compliance, and code quality/static analysis — then cross-checking their verdicts into one final per-AC pass/not pass/partly report. Wired as the final step of sw-implement-feature; can also be run standalone to (re)check a feature. Not to be confused with the existing "verify-implementation" skill, which is a mock and should be ignored.
when_to_use: Trigger phrases — "verify spec 0007", "check if this feature is done", "run full verification for this feature", "is epic 1 actually passing".
argument-hint: '[specs/NNNN-slug-spec.md]'
allowed-tools: Read Write Glob Grep Agent
---

# sw-verify-feature

Independently verify that an implementation actually satisfies its spec. This is the completeness gate — do not soften a `not pass` into a `partly` to be agreeable.

This skill is a pure orchestrator: it does not run tests, read code for compliance, or execute static analysis itself. It spawns three specialist verifier skills in parallel, each of which performs its own verification with its own tools, then cross-checks their independent verdicts into one report, written to `specs/NNNN-slug-verification.md` using `reference/verification-report-template.md`.

## Read-only contract

This skill observes and reports. It never changes the project code: no source/test file created, edited or deleted, no fix applied, no migration run, no git action. The one file this skill is allowed to write is its own output report at `specs/NNNN-slug-verification.md` (create or overwrite). Anything found wrong in the project is a report line handed to `sw-implement-feature`, never a fix. The same contract binds every agent this skill spawns — pass it verbatim in each brief.

## Inputs

| Argument | Behaviour |
| --- | --- |
| Path to `specs/NNNN-slug-spec.md` | Verify this spec against the current codebase |
| Nothing | Ask the user for the spec path |

## Procedure

### 1. Load the AC lists

Read the spec's acceptance criteria — this is the reference list used in step 3 to catch a verifier that silently drops an AC.

Also read the source PRD: same `NNNN-slug` as the spec, at `specs/NNNN-slug.md` (drop the `-spec` suffix). Read its §7 Acceptance Criteria — this is the AC-n list the feature was originally scoped to. This skill runs independently of `sw-implement-feature` (it can verify a manually-implemented feature just as well, and doubles as this skill's own test), so it cannot assume the spec still matches the PRD it was derived from; that assumption is exactly what this check exists to catch.

If the PRD file doesn't exist, note `PRD not found — traceability check skipped` in the final report's Overall Verdict and skip the PRD comparison in step 3.

Otherwise, diff the two `AC-n` lists. Any AC-n in the PRD but absent from the spec is a **traceability gap**: it was never carried into the implementation plan, so none of the three verifiers below can find or test it. Record these now — they are forced into the per-AC table in step 3 as `not pass`, not silently dropped for being out of the spec's own list.

### 2. Spawn the three verifiers in parallel

**Shopware version — detect once, here, before spawning anything, never assume:** `vendor/shopware/core/composer.json` `version` → `composer.lock` → `composer.json` constraint ("unconfirmed"); PHP from the project runtime (`compose.yaml`, `.ddev/config.yaml`, `Dockerfile`), not the host. Pass version + source to every spawned agent; unknown → ask the user. Also invoke `sw-setup` once, here — before spawning anything.

In a single message, make three `Agent` tool calls (one per verifier), each delegated to a general-purpose worker sub-agent since it just needs to invoke a skill and relay its output — do not use `fork`, these need no conversation context. Each prompt must contain:

- The spec path.
- The detected Shopware/PHP version and its evidence, plus the `sw-setup` table text.
- The read-only contract above, verbatim.
- The exact instruction: invoke the `Skill` tool with the named skill below, passing the spec path, the detected version and evidence, and the `sw-setup` table as `args`, then return that skill's complete report output verbatim — no summarizing, no reformatting, no adding or dropping lines.

The three skills, one per Agent call:

1. `sw-verify-feature-ac-tests`
2. `sw-verify-feature-architecture`
3. `sw-verify-feature-code-quality`

Never call these three sequentially — they run concurrently. If one Agent call fails to spawn or errors out, note it and continue with the other two; do not block the run on a single failed spawn (report that dimension as `not consulted — <reason>` in step 4 instead of silently omitting it).


### 3-5. Reconcile and report

Follow `reference/reconcile-and-report.md` in this skill's directory: cross-check the
three verifiers into one per-AC pass / partly / not pass verdict, collect the
whole-feature gate lines, and write the report from
`reference/verification-report-template.md`. Never report a verdict a verifier did not
support, and never re-run a verifier's work yourself.
