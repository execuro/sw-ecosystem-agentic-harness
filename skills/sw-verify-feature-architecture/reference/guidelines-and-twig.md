# Guideline sources and the Twig-linter guardrail

Steps 2 and 4 of `sw-verify-feature-architecture`. Step 2 decides which Core and Project guidelines apply to this feature and where they come from; step 4 is the read-only `shopware-cli` Twig guardrail. Neither mutates code.

### 2. Gather guideline sources

**Core** — Shopware's own architectural conventions: extension points over core patches, DI/decoration over reflection, versioned/inherited/translatable DAL modelling rules, idempotent migrations, `SalesChannelContext` as the unit of correctness, headless-first (Store API before Storefront controller logic), rule builder/flow actions before hardcoded conditions. Confirm the specific pattern against `mcp__ShopwareDevKnowledgeBase` and the installed `vendor/shopware/*` version — never from memory, versions drift.

**Guidelines**: first call `read_doc { path: "guidelines/<version>/<base-file>" }` with the detected Shopware major (6.6 or 6.7), then its surface file(s) for the area touched. Each is the effective file — Shopware's rules with this project's rules merged in; a `[project …]` section takes precedence. Apply every rule; cite it by the section's tag-line path, as `[rule: <path>]` — the tag line already ends with `#anchor`. If a call returns a not-found notice, say so in the report and continue — never substitute rules from memory. `<base-file>` is `architecture-guidelines.md`; surface files are `be-`/`fe-architecture-guidelines.md` of the touched areas.

Fallback when the MCP is unavailable: read `docs/project-wiki/guidelines/` directly on disk (project rules only, no platform merge) and state in the report that platform rules were unavailable.

**Project** — report which sections actually came from the project layer: `project rules applied: N sections from project/guidelines/…` when at least one `[project …]` tag appears in an effective file read above, or `Project guidelines: none — inherited from Shopware platform guidelines` when every section read is `[platform]`. This is a neutral fact, not a failure — do not treat "none" as a violation. Distinguish two not-found cases, both reported plainly and never replaced by memory: the whole MCP being unreachable (disk fallback used, above) versus one `read_doc` call for a named `guidelines/<v>/<file>` returning a not-found notice while the MCP itself answers other calls — report the latter as `not found: guidelines/<v>/<file> (reported, continued)` and keep going with whatever files did resolve.


### 4. Guardrail: shopware-cli Twig linters

`shopware-cli` bundles two tools with real, read-only checks relevant to Core-guideline compliance: `admin-twig` and `storefront-twig` (deprecated/incorrect Twig block usage — an extension-point correctness signal, since Shopware's Twig block/`sw_extends` conventions are how Storefront/Admin templates are meant to be extended).

1. Read the shopware-cli row from the `sw-setup` table (brief, or invoke `sw-setup` standalone). Unticked → report this gate `not run`, naming `/sw-setup`; don't block the rest of this skill on it.
2. Run `shopware-cli extension validate --full --only=admin-twig,storefront-twig custom/plugins/<PluginName>`.
   - **Important**: `--only` has no effect without `--full` — passing `--only` alone silently resets to the default `sw-cli` structural checks and these two linters never run. Always pass both flags together.
3. The same `validate` call (even without `--full`) also flags deprecated `services.xml`/`routes.xml` in favor of the YAML format as a `warning` — a Symfony/Core convention signal worth carrying into this gate too, since it's a structural check bundled by default.
4. Every `error` is a fail for this gate; `warning` is reported but doesn't block unless a Core/Project guideline explicitly requires avoiding it.

Note for context, not a gate to run here: Shopware's actual deprecated-pattern/upgrade-compatibility detector is `rector`, but it only executes via `shopware-cli extension fix` (mutates files, no dry-run) — that tool belongs to `sw-implement-feature` (fixing), not to this read-only verification skill. Do not attempt to run it here.

