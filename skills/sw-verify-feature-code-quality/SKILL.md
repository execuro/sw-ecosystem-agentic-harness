---
name: sw-verify-feature-code-quality
description: Verify the code-quality gate for a feature — identifies which tool suites actually apply (PHPStan, ESLint, Stylelint, sw-cli structural validation via shopware-cli, PHPUnit regression), executes them, and checks the touched files against written Core and Project guidelines' quality/style clauses (naming, duplication, dead code, unneeded complexity). Reports whole-plugin gate results plus any per-AC quality defect found in that AC's files. One of three parallel verifiers spawned by sw-verify-feature; can also be run standalone.
when_to_use: Trigger phrases — "verify code quality for spec 0007", "run static analysis for this feature", "does this pass PHPStan/ESLint", "code quality gate for epic 1".
argument-hint: [specs/NNNN-slug-spec.md]
allowed-tools: Read Glob Grep Bash mcp__ShopwareDevKnowledgeBase__list_docs mcp__ShopwareDevKnowledgeBase__grep_docs mcp__ShopwareDevKnowledgeBase__read_doc mcp__ShopwareDevKnowledgeBase__kb_status
---

# sw-verify-feature-code-quality

Independently verify the code-quality layer of a feature against its spec. This skill performs the verification itself using its own tools — it does not delegate execution to an agent. It answers two questions: do the automated tool gates pass, and does the touched code follow this project's written quality/style guidelines?

This is distinct from `sw-verify-feature-architecture`, which reads the same guideline sources for their *architectural-decision* clauses (extension points, DAL modelling, DI/decoration). This skill reads them for their *quality/style* clauses (naming, duplication, dead code, unneeded complexity, comment discipline).

## Read-only contract

This skill observes and reports. It never changes the project: no file created, edited, or deleted, no auto-fix applied (`shopware-cli extension fix`/`format`, etc.), no git action.

`shopware-cli` also bundles `php-cs-fixer`, `prettier`, and `rector` — but each of those has an empty `Check()` in shopware-cli's own source and only does real work through `extension format` or `extension fix` (file-mutating; `php-cs-fixer` has a `--dry-run` mode but fixing is still not this skill's job). Those three are `sw-implement-feature`'s tools for fixing code, not this skill's for validating it — do not run them here even in dry-run.

## Inputs

| Argument | Behaviour |
| --- | --- |
| Path to `specs/NNNN-slug-spec.md` | Verify code quality for this spec's implementation against the current codebase |
| `; ` followed by a detected Shopware/PHP version + evidence (e.g. from `sw-verify-feature`'s brief) | Use it as verified — no re-detection needed |
| Nothing | Ask the user for the spec path |

## Procedure

### 0. Shopware/PHP version

**Version:** from `args` if stated with evidence, use it as verified; else detect via `vendor/shopware/core/composer.json` → `composer.lock` → `composer.json` ("unconfirmed"). Ambiguous or unknown → stop, never guess — blocking question to the caller, or ask the user if run standalone. Which PHPStan/rule level and toolchain shape applies can be version-dependent.

### 1. Identify the plugin and touched areas

From the spec, identify the plugin directory (e.g. `custom/plugins/<PluginName>`) and which areas it touches: PHP backend, Administration JS, Storefront JS/Twig/SCSS, CLI.

### 2. Identify which tool suites actually apply

Don't run everything blind — scope to what the touched areas need:

- PHP touched → PHPStan, PHPUnit regression suite
- Administration/Storefront JS touched → ESLint
- Storefront SCSS/Admin LESS touched → Stylelint
- Nothing outside PHP → skip ESLint/Stylelint and say so, don't silently omit the line

(Twig linting — `admin-twig`/`storefront-twig` — is `sw-verify-feature-architecture`'s gate, not this skill's; don't duplicate it here.)


### 3-4. Guideline sources and the tool gates

Follow `reference/gates.md` in this skill's directory: gather the Core and Project
guideline sources for the quality/style dimension, then execute the tool gates that
step 2 found applicable. Read-only — report what a gate says, never fix it.

### 5. Manual quality read

For the files this feature actually touched (not the whole plugin), check against the quality/style clauses gathered in step 3 plus general good-practice defaults if no written guideline covers a case: no dead code left behind, no unneeded abstraction for a one-shot operation, no duplicated logic that should be one place, naming that matches project convention, no comments explaining *what* obvious code does. Note each defect against the specific AC whose files it appears in.

### 6. Report

```
AC-n | pass/partly/not pass | quality defect found in this AC's files (or "no defects found") | evidence (file:line)

PHPStan/ESLint/Stylelint/sw-cli (shopware-cli --full --only=phpstan,eslint,stylelint,sw-cli) | pass/fail/not run | N errors, N warnings (or install command)
PHPUnit regression (full plugin suite) | pass/fail | N failing tests (list if any)
Project guidelines: <"project rules applied: N sections from project/guidelines/…" | "Project guidelines: none — inherited from Shopware platform guidelines" | "not found: guidelines/<v>/<file> — MCP unavailable, disk fallback used" | "not found: guidelines/<v>/<file> (reported, continued)">
```

Then a one-line verdict: fully clean, or the count of gates failing/not-run plus the count of ACs with a quality defect.

Never mark a gate `pass` to be agreeable, and never mark it `not run` as a quiet substitute for a real failure. `partly` on an AC line always carries the one-sentence reason for the defect found.
