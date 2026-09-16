# Guideline sources and the tool gates

Steps 3 and 4 of `sw-verify-feature-code-quality`, entered once the plugin, the touched areas and the applicable tool suites are known. Step 3 decides which written guidelines apply; step 4 runs the gates. Both are read-only — nothing here mutates code.

### 3. Gather guideline sources (quality/style dimension)

Guidelines: first call `read_doc { path: "guidelines/<version>/<base-file>" }` with the detected Shopware major (6.6 or 6.7), then its surface file(s) for the area touched. Each is the effective file — Shopware's rules with this project's rules merged in; a `[project …]` section takes precedence. Apply every rule; cite it by the section's tag-line path, as `[rule: <path>]` — the tag line already ends with `#anchor`. If a call returns a not-found notice, say so in the report and continue — never substitute rules from memory. `<base-file>` is `code-guidelines.md` plus `qa-guidelines.md`; surface files are `be-`/`admin-`/`storefront-code-guidelines.md` and `be-`/`fe-qa-guidelines.md` of the touched areas. Read them for quality/style clauses (naming conventions, duplication limits, dead-code policy, comment policy, complexity limits) and apply them in step 5.

Fallback when the MCP is unavailable: read `docs/project-wiki/guidelines/` directly on disk (project rules only, no platform merge) and state in the report that platform rules were unavailable.

Report which sections actually came from the project layer: `project rules applied: N sections from project/guidelines/…` when at least one `[project …]` tag appears in an effective file read above, or `Project guidelines: none — inherited from Shopware platform guidelines` when every section read is `[platform]`. Neutral fact, not a failure. Distinguish two not-found cases, both reported plainly and never replaced by memory: the whole MCP being unreachable (disk fallback used, above) versus one `read_doc` call for a named `guidelines/<v>/<file>` returning a not-found notice while the MCP itself answers other calls — report the latter as `not found: guidelines/<v>/<file> (reported, continued)` and keep going with whatever files did resolve.

### 4. Execute the tool gates

**PHPStan / ESLint / Stylelint / sw-cli structural** — bundled by Shopware's own toolchain, not run standalone:
1. Read the shopware-cli row from the `sw-setup` table (brief, or invoke `sw-setup` standalone). Unticked → report that gate line `not run`, naming `/sw-setup` — do not block the rest of this skill on it.
2. `shopware-cli extension validate --full --only=phpstan,eslint,stylelint,sw-cli custom/plugins/<PluginName>` — scoped to the four tools that actually have a real, check-only `Check()` in shopware-cli's toolchain and no real `Fix()`/`Format()` of their own (confirmed from source: `internal/verifier/{phpstan,eslint,stylelint,sw_cli}.go`), matching the areas identified in step 2. `sw-cli` here is the extension's structural/manifest validation (`extension.yml`, plugin metadata, packaging rules) — it has nowhere else to run since `sw-implement-feature` never invokes it (no `Fix()`) and no other verifier covers it.
   - **Important**: `--only` has no effect without `--full` in `extension validate` — passing `--only` alone silently resets to the default `sw-cli`-only structural check and the others never run. Always pass both flags together.
3. Every `error` is a fail for this gate; `warning` is reported but doesn't block unless the spec's tech decisions require avoiding it.

**PHPUnit regression suite** — broader than `sw-verify-feature-ac-tests`' per-AC execution: run the plugin's *entire* PHPUnit suite (not just the tests mapped to this feature's ACs) to catch regressions the change may have caused elsewhere in the plugin. Report pass/fail with the failing test list if any.

