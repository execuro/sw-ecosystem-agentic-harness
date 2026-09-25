# Context parameters — version, edition, plan

Project facts (Shopware version, edition, plan, what the project already built) come from the Dev Knowledge Base MCP only. The tool never researches the project itself outside it — no reading `composer.json`, no scanning `custom/plugins`, no asking the operator to guess.

## Detection

Run once per document per session, before any item is assessed, and pass the result to every agent spawned for that run:

1. `mcp__ShopwareDevKnowledgeBase__kb_status` — confirms the Knowledge Base is indexed for this project; refuse to assess coverage without it and say so in section 1.
2. `mcp__ShopwareDevKnowledgeBase__read_doc` the project's own overview/index page for the installed version, edition (Community or the named Commercial plan) and any plan tier facts it records.
3. `mcp__ShopwareDevKnowledgeBase__grep_docs` for what the project already built, per requirement area, before asking whether a scope item needs Extension or Custom — a feature the project already delivered is OOTB (D-12), not a separate value.

A fact the Knowledge Base does not carry: state it as `not provided by the Dev Knowledge Base` in section 1 rather than guessing; a scope item that depends on it becomes a `Q-n` to the operator, never an assumption dressed as a fact.

## What section 1 states

- Detected Shopware version, edition and plan of an existing project, each with the Knowledge Base page it came from — stated here in section 1's meta prose only. The Project information table's `shopware` row (`project-information.md`) instead records the tender's own stated target, Source = the tender location; when the detected version differs from the tender's stated target, raise a `Q-n` to the operator.
- What the project already built that is relevant to at least one scope item, named by feature, with its Knowledge Base or wiki page.
- The coverage-to-client-token map is not an intake fact — it is decided at export and stored in the fit-back map (`coverage-mapping.md`).

## Passed to every agent

Every `sw-product-manager` and `sw-shopware-architect` spawn receives: the detected version/edition/plan from this file, section 1's Project information table, and, per scope item it is given, that item's own Internal note (read-only) and its own rejected proposals (`References` `rejected:` lines plus any `rejected` entries in `proposals.json` for that item or global) with an instruction never to re-propose them (AQ-4).
