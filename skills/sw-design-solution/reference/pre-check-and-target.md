# Pre-check and target file

Entered before touching the target file. Decides how to handle `--editor`/`--editor-session` flags, the setup pre-check, and how to establish the spec file to write.

### 0. Editor flags

`--editor` → **first action**, in this order. An editor session edits **one** document and is named from its filename, so the target has to be the *spec* path and the file has to exist before the page opens.

1. **Resolve to the spec path.** `…-spec.md` → that is it. `specs/NNNN-slug.md` (a PRD) → `specs/NNNN-slug-spec.md`, same `NNNN`/slug, per §1's one-spec-per-PRD rule. Anything else → stop with one line naming the two shapes.
2. **Gate, before creating anything.** Is the `sw-specs-editor` skill available? It is an optional add-on, installed by `sw-setup`, not part of this plugin. Not available → **stop here** with one line — "The Specs Editor is not installed. Run `sw-setup` to add it, or re-run without `--editor`." — and do not fall back to non-editor mode, and do not leave a skeleton behind for a page that will never open.
3. **Spec missing → write the skeleton.** Copy `reference/tech-spec-template.md`, section numbers and titles verbatim, every body `_TBD_`; fill only `PRD: specs/NNNN-slug.md`, `Status: In progress`, `Confidence: 0%`, `Updated: <today>`. Still no PRD/spec read, no version detection, no lookup, no agent spawn, no AC drafting — this is a deterministic file write, a file to open, not a first draft.
4. **Hand off with the spec path** and stop.
5. If step 3 created the file, add one line: "Created the spec skeleton at `<path>`. Send a note on the page — e.g. 'draft the spec' — to fill it."

The Specs Editor opens the page and waits; this skill runs again (*Editor mode*) only when the user sends notes. The PRD is **not** part of that session: it is reference only, and business changes go back to its own session (`sw-design-requirements <prd path> --editor`). `--editor-session` → run the procedure below under *Editor mode*, scoped to the batch.

### 0.5 Pre-check

Once, before touching the target file. Note the ISO start time (`date -u +%Y-%m-%dT%H:%M:%SZ`) — step 8's Timing line and editor progress prefixes use it. In editor mode it runs on the **first batch**, not on the hand-off: §0's skeleton write precedes it and reads nothing.

- **Check:** invoke `sw-setup` once; rows vendor/ and KB MCP must be ticked. Never proceed past an unticked row without the user's answer.
- **Terminal, on failure:** the setup skill's own question settles it — declined → proceed with `(unverified — vendor/ not installed)` / `(unverified — KB unavailable)`, blocks readiness, as before.
- **Editor mode:** failure → `[gate] vendor/ is not installed` / `[gate] ShopwareDevKnowledgeBase MCP is not available`, `A: Bootstrap first (recommended)` / `B: Proceed with unverified decisions`, fix text names `/sw-setup`. Unanswered → *In progress*.

### 1. Establish the target file

New spec: `specs/NNNN-slug-spec.md`, reusing the PRD's `NNNN`/`slug` — one per PRD. Create from `reference/tech-spec-template.md` in this skill's directory, section numbers/titles unchanged. In editor mode §0 already established (and may have skeletoned) this file; the first batch migrates a skeleton exactly as it migrates a pre-template spec. Header: PRD path, `shopware/core` version + KB directory, plugin (`custom/plugins/<Name>`, `<Vendor>\<Name>`, existing domain plugin or new one named after the feature's domain). Plugin never `_TBD_` at readiness. Continue mode: keep path, never renumber/duplicate; pre-template spec → migrate this run, say so in the report.
