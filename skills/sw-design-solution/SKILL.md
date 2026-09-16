---
name: sw-design-solution
description: Turn a PRD (specs/NNNN-slug.md) into a technical spec at specs/NNNN-slug-spec.md. Applies TDD — every acceptance criterion gets an implementation plan and e2e coverage, with Shopware toolchain (shopware-cli/PHPStan/ESLint/Stylelint) conventions baked into decisions up front. Runs a clarification loop for the gaps that change the implementation plan, and on the user's say-so extracts project-wide architecture/stack decisions into ADR files (specs/NNNN-slug-adr-<topic>.md) that gate readiness while proposed. Pre-checks vendor/ and the KB before it starts. Use when asked to write, draft, refine, or continue a tech spec / implementation plan. Never edits the source PRD or answers business/requirements questions — that's sw-design-requirements.
when_to_use: Trigger phrases — "write the tech spec for PRD 0007", "create an implementation plan for this PRD", "draft the spec", "continue spec 0007", "is this spec ready for implementation".
argument-hint: [specs/NNNN-slug.md | specs/NNNN-slug-spec.md] [--editor]
allowed-tools: Read Write Edit Glob Grep AskUserQuestion Agent Skill Bash(ls *) Bash(npx -y @execuro-sw-ecosystem/sw-specs-editor@0.1.0 *) WebSearch WebFetch mcp__ShopwareDevKnowledgeBase__list_docs mcp__ShopwareDevKnowledgeBase__grep_docs mcp__ShopwareDevKnowledgeBase__read_doc mcp__ShopwareDevKnowledgeBase__kb_status
---

# sw-design-solution

Produce or advance one technical spec from one PRD. Technical decisions only.

## Hard boundary

Answers **how**, never **what**/**why**. Never re-litigate, question, or change any FR/AC's scope. The PRD is **read-only**; an unclear/inconsistent requirement is never edited or reinterpreted — flag it in **Open Questions**, or raise it in the clarification loop if it blocks a decision. A business/requirements question mid-run: one line that it belongs in the PRD, note if a real gap, return to technical work.

## Inputs

| Argument | Behaviour |
| --- | --- |
| `specs/NNNN-slug-spec.md` | **Continue mode** — load, keep its number, advance |
| `specs/NNNN-slug.md` (a PRD) | **New spec** — PRD is the source of truth |
| Nothing | Ask for the PRD path |
| `<path> --editor` | **Editor hand-off**, first reference file below |
| `<path> --editor-session <url> --batch <file>` | **Editor mode** — see `reference/editor-mode.md` |

## Procedure

Then work through the reference files in this skill's directory, in order:

| File | When | What it decides |
| --- | --- | --- |
| `reference/pre-check-and-target.md` | before touching the target file | editor flags, the `sw-setup` pre-check, and how to establish the spec file |
| `reference/research-and-evidence.md` | after reading the PRD | version detection, KB lookups, the evidence rules, and the architecture guidelines pass |
| `reference/draft-and-spawn.md` | drafting the spec | architect/QA spawn briefs, merging their output, spot-checks, and cross-AC dependencies |
| `reference/toolchain-conformance.md` | while drafting, before finalizing | writing the spec so code conforms to Shopware's linters/static analysis on first write |
| `reference/clarification-loop.md` | when a gap changes architecture, data model, or test strategy | when and how to ask the user, and how answers are anchored |
| `reference/adr-flow.md` | before finalizing, when a decision affects the project as a whole | detecting, asking about, extracting, and gating on ADRs |
| `reference/readiness-and-report.md` | every run | the §7 confidence score and the step 8 report |
| `reference/editor-mode.md` | invoked with `--editor-session` | how the procedure differs from the terminal flow |

## Reference files

Under `reference/` in this skill's directory:

- `tech-spec-template.md` — the section structure to fill; §3 is the per-AC contract `sw-implement-feature` and `sw-verify-feature` consume, §7 is the five-criteria readiness table that sets the confidence
- `adr-template.md` — the ADR file created on Extract
- KB via MCP — `read_doc { path: "guidelines/<version>/qa-guidelines.md" }` plus `be-qa-guidelines.md` / `fe-qa-guidelines.md` for test levels and directory layout the test tables must follow. AC marker convention: PHPUnit — method name contains `Ac<n>` plus `#[Group('NNNN-ACn')]`; Jest — test title starts `AC-n:`; Playwright — `{ tag: ['@NNNN', '@AC-n'] }`.
