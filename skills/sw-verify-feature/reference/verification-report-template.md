# Verification report template

Copy verbatim, fill, delete every `<!-- -->` hint. Keep section numbers and titles unchanged — a re-run of `sw-verify-feature` diffs against the previous report by these anchors, and the `AC-n` identifiers must match the source spec and PRD exactly (an AC present only in the PRD still keeps its PRD numbering).

This report is a record of one verification run, not a living document like the PRD or tech spec. Never soften a `not pass` into `partly` to be agreeable, and never omit a line to make the report shorter — a missing gate line reads as "not checked," which is itself a defect.

---

```markdown
# VERIFICATION-NNNN — <Feature name>

| | |
| --- | --- |
| **Overall verdict** | fully verified \| not fully verified |
| **Source spec** | specs/NNNN-slug-spec.md |
| **Run date** | YYYY-MM-DD |
| **Verifiers consulted** | tests, architecture, code-quality <!-- list only the ones that actually ran; append "— not consulted: <name> (<reason>)" if any failed to spawn -->|

## 1. Per-AC Verdicts

One row per acceptance criterion in the union of the source spec and the source PRD — same `AC-n` numbering, no additions, no omissions. A verifier that reported no line at all for an AC counts as `not pass` from that verifier, not a silent skip. An AC present in the PRD but missing from the spec still gets a row, verdict `not pass`, dimension `traceability` — no verifier could have tested an AC the spec never mentions.

| AC | Verdict | Failing dimension(s) | Evidence | Note |
| --- | --- | --- | --- | --- |
| <!-- AC-1 --> | <!-- pass / partly / not pass --> | <!-- tests / architecture / code-quality / traceability, or "—" if pass --> | <!-- test names, file:line, e2e result, screenshot path --> | <!-- one sentence from the verifier that drove the downgrade, or "—" if pass --> |

## 2. Whole-Feature Gates

Gates that don't map to a single AC, carried from each verifier unchanged and prefixed by source.

```
[tests] Test Health Report: <!-- pointer to §3, or "no tests flagged" -->
[architecture] Project guidelines: <!-- "project rules applied: N sections from project/guidelines/…", "Project guidelines: none — inherited from Shopware platform guidelines", "not found: guidelines/<v>/<file> — MCP unavailable, disk fallback used", or "not found: guidelines/<v>/<file> (reported, continued)" for a single missing file while the MCP itself is reachable -->
[architecture] shopware-cli Twig linters (admin-twig, storefront-twig) | <!-- pass/fail/not run --> | <!-- N errors, N warnings, or install command -->
[code-quality] PHPStan/ESLint/Stylelint (shopware-cli --full) | <!-- pass/fail/not run --> | <!-- N errors, N warnings, or install command -->
[code-quality] PHPUnit regression (full plugin suite) | <!-- pass/fail --> | <!-- N failing tests, list if any -->
[code-quality] Project guidelines: <!-- "project rules applied: N sections from project/guidelines/…", "Project guidelines: none — inherited from Shopware platform guidelines", "not found: guidelines/<v>/<file> — MCP unavailable, disk fallback used", "not found: guidelines/<v>/<file> (reported, continued)", or "same as [architecture] above" -->
[tests] PRD AC coverage: <!-- <passed>/<total> passed, <failed> failed, <absent> absent — omit this line entirely if no source PRD was found, do not report 0/0 -->
```

## 3. Test Health Report

Every test the tests verifier located, `healthy` or `flagged` with the specific reason. Empty only if the tests verifier was not consulted — state that explicitly rather than leaving the section blank with no note.

```
test::method (type) — healthy
test::method (type) — flagged: <specific reason>
```

## 4. Overall Verdict

<!-- One paragraph: fully verified, or the count of ACs not passing/partly plus whether every whole-feature gate passed. A "not run"/"not active" gate does not block per-AC verdicts but must be named here rather than silently reading as fully verified. -->
```

---

Naming: save as `specs/NNNN-slug-verification.md`, same `NNNN-slug` as the spec it verifies. A re-run overwrites the previous report in place — this is a snapshot of the latest run, not an append-only log; if the caller wants history, that's what git provides.
