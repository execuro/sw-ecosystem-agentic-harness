# Audit, execute and score

Steps 4-6 of `sw-verify-feature-ac-tests`, entered once the relevant test types are classified and the actual tests located. The health audit runs before execution on purpose: a test that does not test what it claims must not be allowed to score an AC green by passing.

### 4. Test health audit

For every test located in step 3, read its actual body — not just its name — and classify it `healthy` or `flagged`. Flag any of:

- **False/errored test**: trivial assertions (`assertTrue(true)`), tests marked `skipped`/`incomplete`, assertions that can never fail given the setup, or swallowed exceptions instead of a failing test.
- **Name/intent mismatch**: the method name, comment, or PHPDoc claims to verify X, but the body verifies Y or nothing related.
- **Unhealthy**: heavy mocking that replaces the behavior under test, assertions on implementation details (call counts, private state) over observable behavior, timing-dependent waits/sleeps, or setup guaranteeing a green result regardless of the code under test.

Record each flagged test with its specific reason — this list is the Test Health Report.

### 5. Execute

Run the suites relevant to the types identified in step 2:

- API / CLI → PHPUnit
- Admin Panel / Storefront → Playwright MCP, headed/click-through — actually drive the flow described in the spec (navigate, click, type, read the resulting DOM/network), not a blind DOM assertion.

If a live check doesn't reflect an already-applied change, rule out stale cache before concluding the implementation is wrong.

**On any failure or unexpected state**, capture evidence before moving on:
- Admin Panel / Storefront (Playwright) → `mcp__playwright__browser_take_screenshot` at the point of failure, saved to `var/verification-screenshots/<spec-slug>/AC-n-<type>-<short-label>.png`. Take it before dismissing/navigating away, so it shows the actual failure, not a recovered page.
- API / CLI (PHPUnit) → no screenshot; capture the failing assertion output/response body as evidence text instead.

Record **Execution: pass / no pass** per test type actually run, with the screenshot path (if any) attached as evidence for every failure.

### 6. Score coverage per AC

For each AC, per type identified in step 2:

- **pass** — a `healthy` test exists and its execution passed.
- **partly** — a test exists but is `flagged` (health doubt), or it exists and passes but only covers part of the AC's described behavior, or execution could not be conclusively determined (e.g. a flaky-looking run worth a second opinion rather than an outright fail).
- **not pass** — no test found, the located test is flagged false/mismatched with none other covering the claim, or execution failed.
- **not run (environment)** — step 0's table shows an unticked row the type needs; name `/sw-setup`, never downgrade to `partly`/`not pass`.

Roll per-type scores into one **Coverage** verdict: `pass` only if every type is `pass`; `not pass` if any is `not pass`; else `not run (environment)` if any is `not run (environment)`; else `partly`.

