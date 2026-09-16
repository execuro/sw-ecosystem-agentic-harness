---
name: sw-verify-feature-ac-tests
description: Verify that a feature's acceptance criteria are backed by tests that actually exist, actually pass, and actually test what their name/comment/PHPDoc claims. Classifies tests by type (API/PHPUnit, Admin Panel/Playwright, Storefront/Playwright, CLI/PHPUnit), runs a test-health audit to catch false, mismatched, or unhealthy tests, then reports per-AC Coverage and Execution as pass / partly / not pass. One of three parallel verifiers spawned by sw-verify-feature; can also be run standalone.
when_to_use: Trigger phrases — "verify AC tests for spec 0007", "audit test health for this feature", "are these tests actually testing what they claim", "check test coverage for epic 1".
argument-hint: [specs/NNNN-slug-spec.md]
allowed-tools: Read Glob Grep Bash mcp__playwright__browser_navigate mcp__playwright__browser_click mcp__playwright__browser_type mcp__playwright__browser_fill_form mcp__playwright__browser_snapshot mcp__playwright__browser_take_screenshot mcp__playwright__browser_wait_for mcp__playwright__browser_console_messages mcp__playwright__browser_network_requests mcp__playwright__browser_evaluate mcp__playwright__browser_select_option mcp__playwright__browser_press_key mcp__playwright__browser_hover mcp__playwright__browser_tabs mcp__playwright__browser_close
---

# sw-verify-feature-ac-tests

Independently verify the test layer of a feature against its spec. This skill performs the verification itself using its own tools — it does not delegate execution to an agent. It answers one question per AC: is this acceptance criterion actually, healthily, tested?

## Read-only contract

This skill observes and reports. It never changes the project: no file created, edited, or deleted (tests included), no fix applied, no migration run, no git action. Cache clears and `theme:compile` to observe current code/UI are the only state changes allowed. Anything found wrong is a report line, never a fix.

The one exception is failure screenshots (step 5): written under `var/verification-screenshots/`, which is gitignored, never inside tracked project paths.

## Inputs

| Argument | Behaviour |
| --- | --- |
| Path to `specs/NNNN-slug-spec.md` | Verify the AC tests for this spec against the current codebase |
| `; ` followed by a detected Shopware/PHP version + evidence (e.g. from `sw-verify-feature`'s brief) | Use it as verified — no re-detection needed |
| Nothing | Ask the user for the spec path |

## Procedure

### 0. Shopware/PHP version and readiness

**Version:** from `args` if stated with evidence, use it as verified; else detect via `vendor/shopware/core/composer.json` → `composer.lock` → `composer.json` ("unconfirmed"). Ambiguous or unknown → stop, never guess — blocking question to the caller, or ask the user if run standalone. Version-specific test-utility names (traits, stubs, helper APIs) differ enough between minors to make a wrong guess produce a false pass/fail.

Readiness: read the `sw-setup` table from `args`, or invoke `sw-setup` yourself standalone. An unticked row a type needs (vendor/ — API/CLI; Acceptance-test project, Playwright browsers, ATS env — Admin Panel/Storefront) → `not run (environment)` for that AC/type, naming `/sw-setup`; never `partly`.

### 1. Load the AC list

Read the spec's acceptance criteria and, for each, the test(s)/scenario(s) defined.

### 2. Classify relevant test types per AC

For each AC, determine which of these apply:

- **API** — Store API / Admin API behavior (PHPUnit functional tests)
- **Admin Panel** — Administration UI behavior (Playwright, e2e headed)
- **Storefront** — Storefront UI behavior (Playwright, e2e headed)
- **CLI** — `bin/console` command behavior (PHPUnit)

An AC can require more than one type (e.g. an Admin API endpoint plus the Admin UI screen calling it). If the spec doesn't name the type explicitly, infer it from the behavior. Note the expected type(s) before searching — the coverage baseline; a type the AC needs but has no test is a coverage gap, not something to drop.

### 3. Locate the actual tests

For each AC/type, find the test file/method that corresponds to it, matching by name/description/PHPDoc against the spec — not by assumption. Record what you found (or didn't) per AC/type.

An AC with no locatable test for a needed type is `not pass` for that type regardless of how "done" the feature looks.


### 4-6. Test health audit, execution and coverage scoring

Follow `reference/audit-execute-score.md` in this skill's directory: audit each located
test against what its name, comment or PHPDoc claims, execute the relevant suites, then
score Coverage and Execution per AC. Read-only — never edit or repair a test to make it
pass.

### 7. Report

```
Test Health Report:
  test::method (type) — healthy
  test::method (type) — flagged: <specific reason>

AC-n | Coverage: pass/partly/not pass/not run (environment) | Execution: pass/partly/not pass | types covered | evidence (test names, e2e result, screenshot path if a failure was captured) | note if partly/not pass/not run
```

Then a one-line verdict: fully covered and healthy, or the count of ACs not passing/partly plus a pointer to the Test Health Report entries that drove those scores.

Never mark an AC `pass` to be agreeable. A flagged test is a reason to downgrade, not a detail to omit — `partly` always carries the one-sentence reason for the doubt.
