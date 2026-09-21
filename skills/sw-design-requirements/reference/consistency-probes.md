# Consistency probes

Run before drafting. Every conflict becomes a clarification question — never a silent assumption, never a resolution you pick yourself.

## 0. Preconditions (step 0, before anything is written)

**Probe what this run is about to use, never the whole environment.** Two things, both load-bearing for every probe below:

- `vendor/shopware/core/composer.json` exists — the version-matched cross-check in probe 4 has nothing to stand on without it.
- One `mcp__ShopwareDevKnowledgeBase__kb_status` reports `platform` as `implemented` — probe 6 is the stock-behaviour lookup.

Either missing → **stop**, write nothing, one line naming the fix:

> `vendor/` is not installed. Run `sw-setup`, then re-run this skill.
> The ShopwareDevKnowledgeBase MCP is not available. Run `sw-setup`, then re-run this skill.

Never invoke `sw-setup` from here, never fix it yourself, never ask about it: surveying and repairing the environment is its own run, up front, and it costs an `npx` registry resolution plus twelve rows to answer these two. Nothing else is probed — no other row of that table can affect a PRD run. In an editor session the stop still has to release the document: post that line as the run's reply and change nothing.

## 1. Against earlier answers in this PRD

Continue mode: re-read §12 Clarification Log and §5 before writing. A new answer that contradicts a logged decision is a conflict, not an update.

Ask as an explicit choice, quoting both sides:
> "C-2 recorded that guests may not use this. The new brief has guests submitting the form. Which holds?"

On resolution: edit the affected FR/AC, and log the supersession in §12 (`C-7 | Guest access | Reversed C-2 — guests now allowed | 2026-08-14`).

## 2. Against other PRDs in `specs/`

Read every `specs/*.md` header and §2 Scope. Look for:
- The same capability specified twice — the second PRD should reference or supersede the first.
- Directly contradictory rules across PRDs touching the same domain concept.
- A PRD marked `Ready for specification` whose assumptions this one breaks.

If this PRD replaces another, fill the `Supersedes` meta row and confirm with the user.

## 3. Against this project's existing code

Read `custom/plugins/*` and `custom/static-plugins/*` — plugin names, `composer.json` descriptions, and any README. On a fresh boilerplate these are empty; then this probe is a no-op.

A conflict is: the brief asks for something an existing plugin already provides, or contradicts behaviour an existing plugin establishes.

When there is no conflict but an existing plugin covers similar ground, that is a signal for §9 OOTB / Extend / Custom Assessment — it points toward `Extend` rather than `Custom` for the FRs it's close to.

## 4. Against stock Shopware

The most valuable probe. Shopware 6 ships a lot; briefs routinely re-specify it. This probe is delegated to the `sw-product-manager` subagent — never reasoned about from memory here, and never a static hardcoded list (Shopware's stock feature set changes across versions).

For every distinct Shopware concept the brief names, invoke `sw-product-manager`. It checks against the official docs matched to the project's actual installed Shopware version (from `composer.lock`), cross-checked with installed `vendor/` code when present, and returns a verdict + evidence (doc URL+version, or vendor path) — or `unverified` if neither source was reachable.

Frame a `confirmed-stock` finding as a scope question, not a design opinion:
> "sw-product-manager confirmed Shopware's Promotions + Rule Builder already covers 'free shipping over €50' (docs.shopware.com, v6.6). Does FR-3 need behaviour beyond that, or should it be dropped as a configuration task?"

Three valid outcomes — all fine, all the user's call:
- **Drop** the FR, note it in §2 Out of scope with the stock feature named.
- **Keep** it, and narrow the FR to the delta that stock Shopware cannot do.
- **Keep** it as-is because the user has a reason; log the reason in §12.

An `unverified` finding is not a pass — note it in §10 rather than assuming the brief is safe, and leave the corresponding §9 row `_TBD_` rather than guessing.

A `confirmed-stock` verdict, when the FR is kept, is also the signal for §9 OOTB / Extend / Custom Assessment: it points the estimate for that FR toward `OOTB`, cited to sw-product-manager's evidence.

## 5. Internal coherence of the PRD itself

Before scoring:
- Every FR reachable by at least one actor in §3.
- Every non-trivial FR has an AC in §7.
- No FR contradicts a BR in §6.
- Nothing in §2 Out of scope is specified anyway in §5.
- Nothing in §9 has leaked into §5 as a requirement.

Internal contradictions are fixed by editing, not by asking — unless the fix changes intent, which is a question.

## 6. Stock behaviour lookup (ShopwareDevKnowledgeBase MCP)

`platform/func` only; `platform/dev` off limits.
- Once per run: `read_doc { path: "platform/index.md" }`.
- Per feature noun: `grep_docs { pattern: "<noun>", path: "platform/func" }`, read the page; try `platform/synonyms.md` when empty.
- Use results only to name stock features and raise a conflict question quoting the doc path — never an FR, §9 line, or design hint. Step 0 already established that the KB answers; a call that fails after that is a stop naming `sw-setup`, not a silent fallback.
