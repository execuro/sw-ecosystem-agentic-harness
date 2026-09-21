# Pre-check and target file

Entered before touching the target file. Decides how to handle `--editor`/`--editor-session` flags, the setup pre-check, and how to establish the spec file to write.

### 0. Editor flags

`--editor` → **first action**, in this order. An editor session edits **one** document and is named from its filename, so the target has to be the *spec* path, and the page only opens on a spec that already says something.

1. **Resolve to the spec path.** `…-spec.md` → that is it. `specs/NNNN-slug.md` (a PRD) → `specs/NNNN-slug-spec.md`, same `NNNN`/slug, per §1's one-spec-per-PRD rule. Anything else → stop with one line naming the two shapes.
2. **Gate, before any work.** Is the `sw-specs-editor` skill available? It is an optional add-on, installed by `sw-setup`, not part of this plugin. Not available → **stop here** with one line — "The Specs Editor is not installed. Run `sw-setup` to add it, or re-run without `--editor`." — do not fall back to non-editor mode, and never spend a draft on a page that will never open.
3. **Branch.** At least one AC block in §3 → already drafted: report `Opening <path> — <status>, <N>/5`, hand off at once, never re-draft. Otherwise → step 4 first.
4. **Draft it first, in the terminal, before the page.** Run the normal flow end to end — §0.5, §1, *Research and evidence*, *Draft* (both spawns), *Toolchain conformance*, *ADR flow*, *Readiness* — so §1–§5 and §7 carry real content and a real confidence the moment the page opens; a scored first draft is the target, not *Ready for implementation*. Two deviations, because the user answers on the page and not here: a structured question tool (`AskUserQuestion`, `request_user_input`) is **forbidden**, so *Clarification loop*'s rounds, *ADR flow* sub-steps 2 and 5 and §0.5's failures all become advised §6 `**Q-n**` blocks in *Editor mode*'s shape; and progress is one short plain terminal line per phase — no session exists yet, so nothing is emitted, polled or started here.
5. **Report one line, then hand off** — `Drafted <path> — <status>, <N>/5, §6: <M> question(s)` — and hand off to `sw-specs-editor` with the spec path. Automatic: `--editor` is the consent, never ask whether to open it.

The Specs Editor opens the page and waits; this skill runs again (*Editor mode*) only when the user sends notes. The PRD is **not** part of that session: it is reference only, and business changes go back to its own session (`sw-design-requirements <prd path> --editor`). `--editor-session` → run the procedure below under *Editor mode*, scoped to the batch.

### 0.5 Pre-check

Once, before touching the target file. Note the ISO start time (`date -u +%Y-%m-%dT%H:%M:%SZ`) — step 8's Timing line and editor progress prefixes use it. Under `--editor` it runs inside §0's pre-hand-off draft (step 4); when §0 handed off without drafting, the first batch runs it instead.

- **Check:** invoke `sw-setup` once; rows vendor/ and KB MCP must be ticked. Never proceed past an unticked row without the user's answer.
- **Terminal, on failure:** the setup skill's own question settles it — declined → proceed with `(unverified — vendor/ not installed)` / `(unverified — KB unavailable)`, blocks readiness, as before.
- **Editor mode:** failure → `[gate] vendor/ is not installed` / `[gate] ShopwareDevKnowledgeBase MCP is not available`, `A: Bootstrap first (recommended)` / `B: Proceed with unverified decisions`, fix text names `/sw-setup`. Unanswered → *In progress*.

### 1. Establish the target file

New spec: `specs/NNNN-slug-spec.md`, reusing the PRD's `NNNN`/`slug` — one per PRD. Create from `reference/tech-spec-template.md` in this skill's directory, section numbers/titles unchanged. Under `--editor` §0 step 4 already created and drafted this file; one that reached the page untouched migrates on first write. Header: PRD path, `shopware/core` version + KB directory, plugin (`custom/plugins/<Name>`, `<Vendor>\<Name>`, existing domain plugin or new one named after the feature's domain). Plugin never `_TBD_` at readiness. Continue mode: keep path, never renumber/duplicate; pre-template spec → migrate this run, say so in the report.
