# Built-check gate

Run before any file under `docs/project-wiki/` is touched. The question is only: *does this functionality exist in this project?* — not whether it works well.

## 1. Collect search terms

From the PRD, spec, or chat (step 1 of SKILL.md), list every concrete name: extension/plugin/app name (`AcmeCheckout`), entity/table names (`acme_return_request`), PHP classes and services, Admin/Store API routes, Storefront routes, Twig templates/blocks, admin modules/components, snippet keys, system-config keys, feature flags, migration names, test names. Add the feature slug and its main nouns as fallback terms. Fewer than three concrete terms → say so in the table; a search on nouns alone is weak evidence.

## 2. Search — all three sources, always

**A. Custom project code** (`Grep`/`Glob`, case-insensitive, per term):

```
custom/plugins/ custom/apps/ custom/static-plugins/ src/
```
Also `ls custom/plugins custom/apps custom/static-plugins` — an empty directory is a finding.

**B. Installed extension or bundle delivering it:**
- `composer.json` `require` — packages beyond `shopware/*` that could deliver the feature (store extensions, bundles).
- `grep -n '"name": "<package>"' composer.lock` and `ls vendor/<vendor>/<package>` to confirm it is actually installed.
- Live environment, best effort only: `docker compose exec web bin/console plugin:list` and `… app:list` (or `bin/console` directly if it runs locally). If the command is unavailable or the container is down, record `not reachable` — never block or retry in a loop.

**C. Verification report in chat** — an `sw-verify-feature` block with `AC-n | pass / not pass / partly | …` lines for this feature. Absent → `none`.

Search **B** even when **A** found code, and **A** even when **B** did: a spec may describe a feature that a store extension already delivers, or vice versa.

## 3. Evidence table

Print this before any verdict, whatever the outcome:

```
| Source | Searched | Found |
|---|---|---|
| custom/plugins, apps, static-plugins, src/ | AcmeCheckout, acme_delivery_date, delivery-date route, ACME_DELIVERY_DATE_SELECTION | custom/plugins/AcmeCheckout/src/Storefront/… (3 files), migration Migration17…, no tests |
| composer.json / composer.lock / vendor | delivery date, shipping | nothing beyond shopware/* |
| bin/console plugin:list / app:list | — | not reachable (container down) |
| sw-verify-feature report in chat | — | 2026-08-29: AC-1..AC-4 pass, AC-5 not pass |
```

One row per source; "Searched" lists the terms actually used, "Found" lists paths/packages/lines or `nothing`.

## 4. Verdict

| Verdict | Condition | Page status |
|---|---|---|
| `built` | Code found in A **or** installed package in B, **and** a report in C with every AC `pass` | `built` |
| `partially-built` | Code/package found, but C is missing, or has any `not pass`/`partly`, or only part of the named artefacts exist | `partially-built` + ⚠️ PARTIALLY BUILT block listing missing/failing ACs |
| `no evidence` | Nothing in A, nothing in B (beyond core), C absent or all `not pass` | STOP → ask (below) |

Hits matter only when they match a **concrete artefact** (extension, entity, class, route, template, key, migration, test). Hits on fallback nouns alone (the feature slug or its generic words), or fewer than three concrete terms with no artefact match, are `no evidence` — they never yield `partially-built` and never skip the gate.

`built` is never granted on code presence alone — the documentation guidelines require the verification report. Without one, code present = `partially-built` and the block says "verification not run". Status → page mapping and block markup: `page-rules.md`.

A chat report with pass lines but **no** code found in A or B is `no evidence` — a report cannot substitute for the artefacts it claims to test; mention the contradiction in the table.

## 5. The override (only on `no evidence`)

Ask with a structured question tool if you have one (Claude Code: `AskUserQuestion`; Codex: `request_user_input`), exactly one question:

- Question: "Feature not found in project code — enforce documentation anyway?"
- Option 1: **Stop (Recommended)** — end the run; the evidence table is the report.
- Option 2: **Enforce — document as planned/not-built** — continue.

On enforce, every page written this run must have:
- `status: planned` if a PRD or spec exists in `specs/`, `status: not-built` if neither does (chat mode with nothing on disk).
- The `> ⚠️ NOT BUILT` block in *Status*, directly after the page's intro prose — exact markup in `page-rules.md` "Flag block": what exists (PRD/spec paths, flags), what is missing (what was searched and not found), reference (spec ACs, "verification not run"), "Checked against the repo on YYYY-MM-DD".
- *Developer* section labelled "(planned)" describing the *intended* location from the spec.
- Decision Log line: `YYYY-MM-DD — User enforced documentation although the built-check found no code`.
- `planned`/`not-built` added to `tags`.

Never continue on `no evidence` without the explicit enforce answer — not when unattended, not when the user "obviously wants docs", not when the spec is marked *Ready for implementation*.
