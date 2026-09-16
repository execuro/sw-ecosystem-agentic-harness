---
name: sw-verify-feature-architecture
description: Verify that a feature's implementation matches the architectural decisions its spec made, and complies with Shopware's own Core conventions plus any written Project guidelines this repo defines. Reports per-AC pass/partly/not pass with the specific guideline or mismatch behind any non-pass. One of three parallel verifiers spawned by sw-verify-feature; can also be run standalone.
when_to_use: Trigger phrases — "verify architecture for spec 0007", "does this implementation follow the spec's design", "check Core/Project guideline compliance for this feature", "architecture audit for epic 1".
argument-hint: '[specs/NNNN-slug-spec.md]'
allowed-tools: Read Glob Grep Bash mcp__ShopwareDevKnowledgeBase__list_docs mcp__ShopwareDevKnowledgeBase__grep_docs mcp__ShopwareDevKnowledgeBase__read_doc mcp__ShopwareDevKnowledgeBase__kb_status
---

# sw-verify-feature-architecture

Independently verify the architecture layer of a feature against its spec. This skill performs the verification itself using its own tools — it does not delegate the check to an agent. It answers one question per AC: does the real implementation match the architectural decision the spec made, and does it follow Shopware's Core conventions plus this project's own written guidelines (if any exist)?

## Read-only contract

This skill observes and reports. It never changes the project: no file created, edited, or deleted, no fix applied, no migration run, no git action.

## Inputs

| Argument | Behaviour |
| --- | --- |
| Path to `specs/NNNN-slug-spec.md` | Verify the architecture for this spec against the current codebase |
| `; ` followed by a detected Shopware/PHP version + evidence (e.g. from `sw-verify-feature`'s brief) | Use it as verified — no re-detection needed |
| Nothing | Ask the user for the spec path |

## Procedure

### 0. Shopware/PHP version

**Version:** from `args` if stated with evidence, use it as verified; else detect via `vendor/shopware/core/composer.json` → `composer.lock` → `composer.json` ("unconfirmed"). Ambiguous or unknown → stop, never guess — blocking question to the caller, or ask the user if run standalone. Extension points, DAL flags, and deprecations checked in step 2 below are version-specific.

### 1. Load the AC list and architectural decisions

Read the spec's acceptance criteria and, for each, the architectural/technical decision it names (extension point, DAL model, DI/decoration target, migration, cart/checkout hook, API surface, etc.).


### 2. Gather guideline sources

Follow the "Step 2" half of `reference/guidelines-and-twig.md` in this skill's
directory.

### 3. Verify each AC

For every AC, inspect the actual code that implements it and check:

- **Architectural mapping**: does the implementation use the extension point/pattern the spec's decision names? A passing test with an implementation that diverges from the spec's decision (e.g. spec says event subscriber, code patches a core class) is not a pass here even if the tests skill scores it green.
- **Core compliance**: does it violate a Core convention gathered in step 2 (e.g. a `vendor/` patch, a raw un-versioned FK on a versioned entity, price mutated in a subscriber instead of a cart processor, a global/context-free read)? Any such violation is `not pass`.
- **Project compliance**: does it violate a Project guideline found in step 2, if any exist? Weight this the same as a Core violation.


### 4. Guardrail: shopware-cli Twig linters

Follow the "Step 4" half of `reference/guidelines-and-twig.md` in this skill's
directory. Read-only: report what the linter says, never fix it.

### 5. Report

```
AC-n | pass/partly/not pass | Core/Project guideline violated or architectural mismatch | evidence (file:line) | note if partly/not pass

Project guidelines: <"project rules applied: N sections from project/guidelines/…" | "Project guidelines: none — inherited from Shopware platform guidelines" | "not found: guidelines/<v>/<file> — MCP unavailable, disk fallback used" | "not found: guidelines/<v>/<file> (reported, continued)">
shopware-cli Twig linters | pass/fail/not run | admin-twig,storefront-twig — N errors, N warnings (or install command)
```

Then a one-line verdict: fully compliant, or the count of ACs not passing/partly with the guideline category (Core vs Project vs architectural mismatch) behind each.

Never mark an AC `pass` to be agreeable. `partly` always carries the one-sentence reason (e.g. "extension point correct, but DAL association not batched — Core performance guideline").
