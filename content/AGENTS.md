## Shopware agentic harness

This repository has the Shopware Ecosystem Agentic Harness installed:
10 `sw-*` skills and 7 `sw-*` sub-agents for Shopware 6 work.

Work through a skill rather than improvising. Each one states its own
procedure, and the detail lives in `reference/*.md` files beside its
`SKILL.md`. Read those on demand — they are not loaded up front.

### Skills

| Skill | What it does |
| --- | --- |
| `sw-design-requirements` | Turn a briefing — chat text or a file, covering one or more features — into a lean, business-only PRD stored as specs/NNNN-slug.md. |
| `sw-design-solution` | Turn a PRD (specs/NNNN-slug.md) into a technical spec at specs/NNNN-slug-spec.md. |
| `sw-discover-tender` | Turn a client's RFI/RFP/RFQ or project plan into confirmed Shopware scope in one working document, `specs/rfp-NNNN-slug-analysis.md`. |
| `sw-document-feature` | Document one Shopware project feature into the LLM-wiki under docs/project-wiki/ — one feature page per surface (administration/ and/or storefront/), the "why" row in the domain index, ADR pages only promoted from the WIP ADR files sw-design-solution extracted into specs/ once they are accepted and built (with an organised table of contents) or provided by the user (never invented). |
| `sw-implement-feature` | Implement a feature from its technical spec (specs/NNNN-slug-spec.md, written by sw-design-solution) following TDD — tests first per acceptance criterion, then the implementation, fixing until every relevant test passes (including that AC's own acceptance/e2e test, run immediately, not deferred), running Shopware's own shopware-cli fixers/static-analysis per AC to conform to Shopware's coding standards as code is written rather than after the fact. |
| `sw-setup` | Print one environment-readiness table for the project's development/test setup — vendor/, Node, the editor CLIs, shopware-cli, the KB MCP, the acceptance-test project, Playwright browsers, its .env, per-plugin test scaffolding, the project wiki, `.gitignore` and whether the SW AH npm packages are current, plus the installer CLI's own configuration/drift status. |
| `sw-verify-feature` | Verify a feature implementation against its technical spec (specs/NNNN-slug-spec.md) by running three independent verifiers in parallel — AC test coverage/health, architecture/guideline compliance, and code quality/static analysis — then cross-checking their verdicts into one final per-AC pass/not pass/partly report. |
| `sw-verify-feature-ac-tests` | Verify that a feature's acceptance criteria are backed by tests that actually exist, actually pass, and actually test what their name/comment/PHPDoc claims. |
| `sw-verify-feature-architecture` | Verify that a feature's implementation matches the architectural decisions its spec made, and complies with Shopware's own Core conventions plus any written Project guidelines this repo defines. |
| `sw-verify-feature-code-quality` | Verify the code-quality gate for a feature — identifies which tool suites actually apply (PHPStan, ESLint, Stylelint, sw-cli structural validation via shopware-cli, PHPUnit regression), executes them, and checks the touched files against written Core and Project guidelines' quality/style clauses (naming, duplication, dead code, unneeded complexity). |

### Sub-agents

Delegate to these by role where your host supports sub-agents. Where it
does not, read the agent definition and do the work yourself in the main
thread — every agent file is written to be readable that way.

| Agent | Role |
| --- | --- |
| `sw-admin-frontend-developer` | Senior Shopware 6 Administration (Vue admin) specialist for building, extending, and unit-testing admin modules, components, ACL, snippets, and data-layer code. |
| `sw-php-backend-developer` | Shopware 6 PHP backend specialist. |
| `sw-product-manager` | A senior, Shopware-specialist Product Manager — deeply expert in Shopware 6's stock capabilities, edition/licence tiers, and typical implementation complexity — who verifies claims against the official Shopware documentation and the Dev Knowledge Base (platform and project wiki) for the exact installed version, never from model memory, and drafts high-impact clarification questions for a calling skill or a direct conversation. |
| `sw-qa-engineer` | Elite Shopware 6 QA engineer. |
| `sw-shopware-architect` | Use PROACTIVELY for Shopware 6 architecture decisions and design reviews - plugin/app/theme choice, extension points, DI/decoration, DAL modelling, migrations, cart/checkout, API surface, caching, async, BC/upgrade risk. |
| `sw-storefront-developer` | Use PROACTIVELY for any Shopware 6 Storefront work - Twig templates, theme/SCSS, storefront controllers/pages/pagelets, storefront JS plugins, checkout/account/product-page customizations. |
| `sw-tender-editor` | Mechanical file worker for the `sw-discover-tender` skill's two non-judgment jobs — reading ONE named file (the runtime's `import-digest.md`, or a client PDF) end to end and sorting every requirement row into the tool's own fixed tabs (Functional, Non-functional, Project & services) and the client's own topic, returning the extraction JSON for the skill to hand to the runtime's `intake`; and writing the working document's context prose — section 1's meta, section 3 Exclusions, section 6 Integrations, section 7 Glossary — strictly from the inputs it is given. |

### Before anything else

Run the `sw-setup` skill once per repository. It reports what is missing
and installs the harness configuration — permission rules and the MCP
server registrations — through the installer CLI:

```
npx -y @execuro-sw-ecosystem/sw-ecosystem-agentic-harness@latest status
```

The Shopware knowledge base is served by the `ShopwareDevKnowledgeBase`
MCP server. Its tools are namespaced by your host, so a call looks like
`mcp__ShopwareDevKnowledgeBase__read_doc`. Prefer it over model memory for
any claim about Shopware behaviour, and cite the document path you used.

### House rules

- Never edit `vendor/`, `public/theme/`, `public/bundles/`, or any plugin
  `Resources/public/` or storefront `dist/` directory — those are build
  output. Change the source and rebuild.
- Ask the user with a structured question tool if you have one (Claude
  Code: `AskUserQuestion`; Codex: `request_user_input`, which is
  non-blocking outside Plan mode — so end the turn after asking).
