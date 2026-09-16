# Reconciling the verifiers and writing the report

Entered once all three verifiers have returned. Steps 3-5 of `sw-verify-feature`: cross-check the three verdicts into one per-AC result, collect the whole-feature gate lines, and write the report.

### 3. Reconcile per-AC verdicts

Each verifier reports its own `AC-n | pass/partly/not pass | ...` line. For every AC in the union of the spec's list and the PRD's list (step 1):

- AC-n exists in the PRD but not in the spec → final verdict `not pass`, failing dimension `traceability`, note `AC missing from spec — never implemented or tested`. Do not ask a verifier for it; none can see an AC the spec never mentioned.
- Else, for an AC-n present in the spec:
  - If any verifier reports `not pass` for that AC → final verdict `not pass`.
  - Else if any verifier reports `partly` → final verdict `partly`.
  - Else (all three report `pass`) → final verdict `pass`.
  - If a verifier's report has no line at all for an AC that exists in the spec → treat that as `not pass` from that verifier (a missing line is not a pass by omission).

Carry forward the specific reason from whichever verifier(s) triggered the downgrade — the final report must say *which* dimension failed (tests / architecture / code quality / traceability), not just that something did.

While reconciling, also tally the PRD AC coverage counts used in step 5's gate line: how many PRD ACs land on `pass` (a passing test found), how many are `not pass`/`partly` specifically because of the `tests` dimension (a test exists but fails, or is flagged unhealthy), and how many are `traceability` (no test possible — AC absent from spec) or otherwise have no test located at all (from `sw-verify-feature-ac-tests`'s Coverage column). These three counts — passed / failed / absent — are what makes the PRD comparison useful; a single "N ACs not pass" number would hide which of the three it is.

### 4. Collect the whole-feature gate lines

Beyond the per-AC lines, each verifier also reports gates that don't map to a single AC. Carry all of them into the final report unchanged:

- From `sw-verify-feature-ac-tests`: the Test Health Report (flagged tests).
- From `sw-verify-feature-architecture`: the Project guidelines line, the shopware-cli Twig linters (`admin-twig`/`storefront-twig`) line.
- From `sw-verify-feature-code-quality`: the PHPStan/ESLint/Stylelint/sw-cli line, the PHPUnit regression line, its own Project guidelines line (merge with the architecture skill's if identical, keep both if they differ).
- The PRD AC coverage tally from step 3 (skip this line entirely if the PRD file wasn't found — do not report `0/0`).

### 5. Report

Fill `reference/verification-report-template.md` verbatim and write it to `specs/NNNN-slug-verification.md`, where `NNNN-slug` matches the spec being verified (e.g. `specs/0007-checkout-notes-verification.md` for `specs/0007-checkout-notes-spec.md`). If the file already exists from a previous run, overwrite it — this report is a snapshot of the latest run, not an append-only log.

- **§1 Per-AC Verdicts** — one row per AC in the union list from step 1 (spec ∪ PRD), reconciled per step 3 above. An AC that only exists in the PRD still gets a row here, marked `not pass` / `traceability`.
- **§2 Whole-Feature Gates** — the gate lines collected in step 4, each prefixed by its source verifier (`[tests]`, `[architecture]`, `[code-quality]`), copied verbatim from what each verifier reported, plus the `[tests] PRD AC coverage: <passed>/<total> passed, <failed> failed, <absent> absent` line from step 3's tally (`failed` = test exists but fails/flagged, `absent` = no test located, including ACs missing from the spec entirely).
- **§3 Test Health Report** — copied verbatim from `sw-verify-feature-ac-tests`'s report.
- **§4 Overall Verdict** — one paragraph: fully verified, or the count of ACs not passing/partly plus whether every whole-feature gate passed. End with `Verifiers consulted: tests, architecture, code-quality` (list only the ones that actually ran; note any `not consulted — <reason>`).

Never mark the feature complete if any AC is `not pass` or any whole-feature gate reports `fail`. A `not run`/`not active` gate does not block the AC verdicts, but the overall verdict must say so explicitly rather than reading as fully verified. `partly` always carries the one-sentence reason from the verifier that reported it.

**Status tags (only exception to the read-only contract).** Per AC verdict you may set the inline tag directly after the bold id in the spec and PRD: `pass` → `[done]`, `partly` → `[partly]`, `not pass` → remove the tag (open). Change only that line; no other edit to either document.

After writing the file, also relay the same content as your final response — the file is the durable record, the chat response is so the caller (e.g. `sw-implement-feature`) sees the result immediately without a separate read.
