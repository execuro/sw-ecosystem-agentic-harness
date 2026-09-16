# Pre-check and target file

Entered before touching the target file. Decides how to handle `--editor`/`--editor-session` flags, the setup pre-check, and how to establish the spec file to write.

### 0. Editor flags

`--editor` → **first action**: is the `sw-specs-editor` skill available? It is an optional add-on, installed by `sw-setup`, not part of this plugin. Available → run it on `<document path>` and stop — no PRD/spec read, no version detection, no lookup, no agent spawn. Not available → **stop here** with one line — "The Specs Editor is not installed. Run `sw-setup` to add it, or re-run without `--editor`." — and do not fall back to non-editor mode or write the spec. The Specs Editor opens the page and waits; this skill runs again (*Editor mode*) only when the user sends notes. `--editor-session` → run the procedure below under *Editor mode*, scoped to the batch.

### 0.5 Pre-check

Once, before touching the target file. Note the ISO start time (`date -u +%Y-%m-%dT%H:%M:%SZ`) — step 8's Timing line and editor progress prefixes use it.

- **Check:** invoke `sw-setup` once; rows vendor/ and KB MCP must be ticked. Never proceed past an unticked row without the user's answer.
- **Terminal, on failure:** the setup skill's own question settles it — declined → proceed with `(unverified — vendor/ not installed)` / `(unverified — KB unavailable)`, blocks readiness, as before.
- **Editor mode:** failure → `[gate] vendor/ is not installed` / `[gate] ShopwareDevKnowledgeBase MCP is not available`, `A: Bootstrap first (recommended)` / `B: Proceed with unverified decisions`, fix text names `/sw-setup`. Unanswered → *In progress*.

### 1. Establish the target file

New spec: `specs/NNNN-slug-spec.md`, reusing the PRD's `NNNN`/`slug` — one per PRD. Create from `reference/tech-spec-template.md` in this skill's directory, section numbers/titles unchanged. Header: PRD path, `shopware/core` version + KB directory, plugin (`custom/plugins/<Name>`, `<Vendor>\<Name>`, existing domain plugin or new one named after the feature's domain). Plugin never `_TBD_` at readiness. Continue mode: keep path, never renumber/duplicate; pre-template spec → migrate this run, say so in the report.
