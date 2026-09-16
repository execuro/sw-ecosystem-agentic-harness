# The documentation run, step by step

Entered from `sw-document-feature` after step 0. Steps 1-7 run in order. Step 3 is a hard gate: nothing under `docs/project-wiki/` is created or edited until it has produced its evidence table and verdict.

### 1. Resolve inputs

Read the source document(s) or the chat. Collect the names the built-check will search for: extension name, entities, services, routes, templates/Twig blocks, admin modules/components, snippet keys, config keys, feature flags, test names. Note the feature slug: PRD slug without `NNNN-` (chat mode: kebab-case, 2–5 words).

### 2. Find the counterpart

`ls specs/` and match by `NNNN`, then by slug. Read the counterpart. Do not create, edit, or renumber anything under `specs/`.

### 3. Built-check gate (mandatory)

Follow `reference/built-check.md` in this skill's directory exactly: search custom project code, installed extensions (`composer.json`, `composer.lock`/`vendor/`, `bin/console plugin:list` / `app:list` if an environment is reachable — never fail on an unreachable one, note it), and any `sw-verify-feature` report in chat. Produce the evidence table and the verdict: `built`, `partially-built`, or `no evidence`.

**On `no evidence` — STOP.** Print the evidence table, then ask with a structured question tool if you have one (Claude Code: `AskUserQuestion`; Codex: `request_user_input`):

> Feature not found in project code — enforce documentation anyway?
> - **Stop (Recommended)** — nothing is written; document after implementation.
> - **Enforce — document as planned/not-built** — pages are written with the ⚠️ NOT BUILT block.

Only the enforce answer continues. Then every page carries `status: planned` (PRD or spec exists) or `not-built` (neither), the ⚠️ NOT BUILT block, a Developer section labelled "(planned)", and the Decision Log line `YYYY-MM-DD — User enforced documentation although the built-check found no code`. A "Stop" answer ends the run with the evidence table as the report.

`partially-built` needs no question but also requires the ⚠️ PARTIALLY BUILT block listing the failing ACs.

### 4. Map domain and surfaces

- Domain and surfaces per `reference/domain-guidelines.md` in this skill's directory: canonical slug list, assignment rules, what never goes into `platform`. Ask (same tool) only if two domains fit equally; anchor the answer in the Decision Log.
- New domain: create `domains/<domain>/index.md` from `reference/templates/domain-index.md`, add a row to `domains/index.md` and to the domain map in `docs/project-wiki/index.md` (`| [Domain](domains/<domain>/index.md) | Purpose |`).

### 5. Write pages

Apply `reference/page-rules.md` and `reference/source-mapping.md` in this skill's directory. First check the side pages this run touches exist — `domains/index.md`, `domains/platform/extensions-inventory.md`, `adr/index.md`; if one is missing, stop and tell the user to run `sw-document-feature --setup`.

- Feature page(s) from `reference/templates/feature-page.md`, frontmatter complete: `nav_order`, `parent` (the domain's title), `grand_parent: Domains`, `status`, `extension`, `spec`, `prd`, `verified_against` = `Shopware <shopware/core version from composer.json>`, `last_synced` = today, `related`.
- Feature row in `domains/<domain>/index.md` — the single source of the "why".
- `domains/platform/extensions-inventory.md` — add a row if the feature introduces an extension not listed.
- ADR provided by the user in chat and stated as accepted: write it from `reference/templates/adr.md` (structure verbatim), Decision Log line on the page; it lands in the TOC via step 5b. Not stated as accepted → tell the user to file it under `specs/` as WIP. ADRs from `specs/` are handled only by step 5b. Anything else the skill thinks might deserve an ADR is not written — it goes to the report as an ADR candidate.
- Developer › Decisions references a promoted ADR as `[ADR-id](../../../adr/<file>.md)`, a WIP one as `[ADR-id](../../../../../specs/<file>) (WIP, <status>)`.
- Existing page for the same feature/surface: update in place, never create a second file. If its `status` contradicts the gate verdict, the gate wins: update status and the ⚠️ block, and append the Decision Log line `YYYY-MM-DD — Status changed <old>→<new> by built-check (<evidence>)`.

### 5b. Promote ADRs

Follow `reference/adr-promotion.md`: glob **all** `specs/*-adr-*.md` (not only this feature's); an `accepted` one whose required changes the built-check finds in the code is promoted once into `docs/project-wiki/adr/<date>-<topic>.md` (already present by `id` → skip, docs wins); everything else is reported as WIP / awaiting implementation. Check the spec's `[adr] <path>` lines resolve, then regenerate the block between `<!-- adr-toc:start -->` / `<!-- adr-toc:end -->` in `adr/index.md`; everything outside the markers stays untouched (including the Liquid table block, on wikis using the Jekyll flavor).

### 5c. Update project guidelines — only when triggered

Triggered when the user states a project coding rule directly, or a promoted ADR (step 5b) changes one — never on the skill's own judgment. Follow `reference/page-rules.md` "Project guidelines". No built-check gate: a guideline is a rule, not a feature.

### 6. Link check

For every touched page, including promoted ADRs and the TOC block, resolve each relative link (`[..](../x.md)`, `related:` entries) against the filesystem, e.g. with `grep -o` + `test -e` from the page's directory. Fix or drop broken links; report any you could not resolve.

### 7. Report

At most six lines: structure check (created files or drift, if any); files written/updated; status per page; gate verdict (with "enforced" if applicable); `ADRs: promoted n · WIP n · awaiting implementation n · removable specs copies n · dangling [adr] links: <paths or none>`, inventory rows, "ADR candidates (not created): …" (`[potential ADR]` items the spec left unextracted; omit when none), open questions; link-check result. Never paste page bodies.

