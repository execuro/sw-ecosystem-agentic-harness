---
name: sw-design-requirements
description: Turn a briefing — chat text or a file, covering one or more features — into a lean, business-only PRD stored as specs/NNNN-slug.md. Runs an interactive clarification loop for the requirement gaps and inconsistencies that actually change the requirements, then scores a weighted confidence %. Use when asked to write, draft, refine, continue, or score a PRD / requirements doc / feature brief for this Shopware project. Never writes a tech spec or answers architecture questions — that's sw-design-solution.
when_to_use: Trigger phrases — "write a PRD", "draft requirements", "turn this brief into a PRD", "continue PRD 0003", "is this PRD ready for specification", "raise the confidence on this PRD", "requirements for <feature>".
argument-hint: '[file-path | briefing text | specs/NNNN-slug.md to continue] [--editor]'
allowed-tools: Read Write Edit Glob Grep AskUserQuestion Agent Skill Bash(ls *) Bash(mkdir -p specs) Bash(npx -y @execuro-sw-ecosystem/sw-specs-editor@latest *) mcp__ShopwareDevKnowledgeBase__list_docs mcp__ShopwareDevKnowledgeBase__grep_docs mcp__ShopwareDevKnowledgeBase__read_doc mcp__ShopwareDevKnowledgeBase__kb_status

---

# sw-design-requirements

Produce or advance one PRD, business requirements only. Sole delegate for `specs/*.md`; `sw-product-manager` only researches, never writes one. A feasibility chat is not by itself a PRD request — ask before writing one if unclear.

## Hard boundary

Answers **what** and **why**, never **how**: no architecture, DAL entities, schema, plugin structure, class/service names, APIs, events, subscribers, Symfony/Vue/Twig, performance strategy, or effort estimates.

A user-asserted tech decision or platform limitation: don't discuss, expand, validate, or challenge it — record it as one bullet in **§10 Early Tech Decisions / Limitations**, tagged `[decision]` or `[constraint]`, with who set it. Never raises confidence or feeds FRs. A mid-run technical question: one line it belongs in the tech spec, log in §10 if a decision, return to requirements.

## Architect advisor (exception, not default)

Tech decisions belong to `sw-design-solution`. Consult `sw-shopware-architect` (delegate to it as a sub-agent if your host supports sub-agents; otherwise read that agent's definition and do the work yourself) only when a high-impact §10 decision (data model, checkout/cart, plugin vs app) needs a viability check or conflicts with stock/a plugin, a requirement can't be stated without knowing if Shopware can do it at all, or a §11 `(recommended)` mark needs a feasibility verdict (*Recommended options must be advised*). Check merchant docs first (step 2); spawn only when insufficient. Brief: PRD path, §10 bullet or FR, the question, detected version if known — verdict not design, max 3 lines, anchored as one §10 bullet tagged `[architect]`. Never adds FRs or confidence, never a wording or loop-settleable decision.

## Inputs

| Argument | Behaviour |
| --- | --- |
| Path to `specs/NNNN-*.md` | **Continue mode** — load, keep its number, advance |
| Any other file path, or free text | **New PRD** — used as source brief |
| Nothing | Ask for the feature in one sentence, then proceed |
| `<path> --editor` | **Editor hand-off** — step 0 checks the optional `sw-specs-editor` skill is installed, then invokes it on `<path>` and stops. Nothing else runs. The session edits the PRD only; the tech spec, if it exists, is reference only and has its own session. A `-spec.md` path is refused here. |
| `<path> --editor-session <url> --batch <file>` | **Editor mode** — continue mode driven by one note batch; see `reference/editor-mode.md` in this skill's directory. |

Images, notes, tickets, transcripts count as sources; extract requirements, discard narrative.

## Procedure

### 0. Editor flags

`--editor` → run the gate in `reference/editor-gate.md` in this skill's directory first; the Specs Editor is optional and may not be installed, in which case stop there. Available → call Skill `sw-specs-editor` with the PRD path, stop; nothing else runs. `--editor-session` → continue mode under `reference/editor-mode.md` in this skill's directory.

### 1. Establish the target file

New PRD:
```
mkdir -p specs
ls specs
```
Take the highest `NNNN`, add 1, zero-pad to 4; slug = kebab-case, 2–5 words. Target: `specs/NNNN-slug.md`.

Continue mode: keep the existing path, number and slug. Never renumber or create a second file for the same feature.

### 2. Targeted consistency lookup

Always read first: `specs/*.md` (overlap, contradiction, supersession), `custom/plugins/*` and `custom/static-plugins/*` (what's already built), `CLAUDE.md` if present.

For every distinct Shopware concept named, delegate to the `sw-product-manager` sub-agent if your host supports sub-agents (otherwise read its definition and do the work yourself) against stock Shopware, version-matched, cross-checked with `vendor/`. Never reason from memory or grep `vendor/` yourself — sw-product-manager's job. `shopware_version: unknown` or `unverified` → note it in §10.

Fill **§9 OOTB / Extend / Custom** from that verdict plus the plugin scan: `confirmed-stock` → `OOTB`; an existing plugin → `Extend`; neither → `Custom`; no evidence → `_TBD_`. Word "Why" in what's missing/different from stock, never how it'd be built.

Work through `reference/consistency-probes.md` in this skill's directory for the rest (prior answers, other PRDs, plugins, the stock-Shopware KB lookup, internal coherence) — skill-local, no agent.

Every conflict becomes a step-4 clarification question, never a silent assumption.

### 3. Draft

Fill `reference/prd-template.md` in this skill's directory. Unknown sections stay `_TBD_`, never invented.

Writing rules — enforce on every line:
- FRs: one testable sentence each, `FR-n`, present-tense imperative ("The storefront shows…", "A guest cannot…").
- No paragraph over 4 lines; density not length — rows never dropped to shorten.
- Business vocabulary only. Shopware domain nouns (Product, Order, Cart, Customer Group, Sales Channel, Rule Builder) count as domain, not implementation.
- No filler: drop "the system should be able to", "in order to", restated goals.
- Never invent numbers, thresholds, SLAs, metrics — absent means open question.

§9's "Why" column: business terms only, never an implementation approach (see step 2).

Check `reference/splitting-guidelines.md` in this skill's directory; two loosely coupled features → raise it in step 6, never split unasked or on size alone.

### 4. Clarification loop

Work through `reference/clarification-loop.md` in this skill's directory: when to skip, the ask/don't-ask test, the question loop, the recommended-option rules, and how to anchor answers into the PRD.

Use `reference/prd-confidence-checklist.md` in this skill's directory for gap probes; merge with sw-product-manager's `draft_questions` into one queue.

### 5. Score, write, report

Work through `reference/readiness-and-report.md` in this skill's directory: apply the confidence rubric, fill the meta table and §13, write the file, and build the closing report.

## Reference files

All under `reference/` in this skill's directory:

- `reference/consistency-probes.md` — step 2: what counts as a conflict, where to look, the KB stock-behaviour lookup
- `reference/prd-template.md` — step 3: section structure to fill
- `reference/splitting-guidelines.md` — steps 3 and 6: when one PRD should have been two
- `reference/clarification-loop.md` — step 4: the question loop, recommended-option rules, anchoring answers
- `reference/prd-confidence-checklist.md` — step 4: gap probes and the ask/don't-ask test
- `reference/confidence-rubric.md` — step 5: scoring bands, status rule
- `reference/readiness-and-report.md` — step 5: scoring, writing the file, and the closing report
- `reference/editor-mode.md` — `--editor-session` runs: scoped procedure, diagrams, progress events
- `reference/editor-gate.md` — step 0: the optional-add-on check before the `--editor` hand-off
