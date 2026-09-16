# Delegation, briefs and escalation

Entered from step 0 of `sw-implement-feature`, once the build order is known. It decides *who* builds each AC and what they are told.

**Delegation.** You orchestrate; you do not write feature code yourself. Route each AC to the agent that owns its layer via the Agent tool. Within a parallelized group, spawn one agent per AC concurrently (same message, multiple Agent calls) — dependencies are already resolved. Outside a parallel group (sequential fallback, or a group of size one), spawn one AC per call as before:

| Step | AC touches | Agent |
| --- | --- | --- |
| 1 — tests | every AC (all test levels the spec lists, including the Playwright spec for e2e-tagged ACs) | `sw-qa-engineer` |
| 2–4 — code | PHP: DAL entities, migrations, Store/Admin API routes, services/decorators, subscribers, flow/rule, message handlers | `sw-php-backend-developer` |
| 2–4 — code | Administration: Vue modules/components, ACL privileges, snippets | `sw-admin-frontend-developer` |
| 2–4 — code | Storefront: Twig, theme/SCSS, storefront controllers/pages/pagelets, storefront JS plugins | `sw-storefront-developer` |

An AC spanning layers is split: backend first (route contract fixed), then Admin/Storefront against it. Each brief contains: the spec path, the AC id, the spec's architectural decision for that AC, the detected Shopware/PHP version and its evidence, the KB doc paths the spec's Decision Log cites for that AC (`platform/dev/<version>/…`), the gating conditions above, and the instruction to run steps 1–5 below and reply in the agent's own report format. Review the report; if anything is red, re-spawn the same agent with the failure. Do not fix the agent's output yourself.

**Docs (ShopwareDevKnowledgeBase MCP).** Tell each implementing agent: `read_doc` the cited pages before writing code; when the spec names a mechanism without a citation, `grep_docs { pattern: "<mechanism>", path: "platform/dev/<version>" }` and read the page first. The version directory matches the installed `shopware/core` (`composer.lock`). The spec's decisions still win; the docs explain how, not whether.

**Architect escalation.** When an implementer reports the spec is ambiguous or wrong for an AC, or the named extension point misbehaves (see the "stop after the first workaround" rule below), first `grep_docs` the KB for that mechanism yourself and `read_doc` the hit. Then spawn `sw-shopware-architect` with the spec path, AC id, the implementer's report, the KB page path (or "no KB page"), and the same detected Shopware/PHP version and evidence, before doing anything else. If the architect's decision stays within the spec, pass it to the implementer and continue; if it changes the spec, stop and report to the user — that change belongs in `sw-design-solution`.
