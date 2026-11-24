---
name: sw-feature-status
description: Show where every feature stands across the three phases of the process (design requirements, design solution, implement) in one table, read straight from the PRDs and tech specs in specs/. One row per feature, with the completion of each phase and the next command to run. Read-only, it never edits a file, never starts a phase and never opens an editor. Use when asked where the features stand, what is done, what is next, or for an overview of the PRDs and specs in progress.
when_to_use: Trigger phrases, for example "feature status", "overview of the features", "where do we stand", "what is the status of the specs", "what is next for each feature", "which PRDs are in progress", "sw-feature-status".
allowed-tools: Read Glob Grep
---

# sw-feature-status

Report, in one table, how far each feature has come through the process. The information is already in `specs/`; this skill only reads it and does not change anything.

## Read-only contract

Read `specs/` and nothing else. Write no file, run no other skill, start no editor. Name the next command in the table and stop: the user decides whether to run it.

## Procedure

### 1. Find the features

List `specs/*.md`. A feature is a file named `NNNN-slug.md` (four digits, then the slug). Its tech spec is `NNNN-slug-spec.md`. Ignore everything else: `NNNN-slug-adr-<topic>.md`, `NNNN-slug-verification.md` (read in step 2 only), files without the four-digit prefix, spreadsheets and any folder.

Group files by `NNNN-slug`, one row per feature. A tech spec with no PRD still gets its row, with the PRD cell `missing`.

### 2. Read the state of each phase

Read the header table at the top of each file, not the body. The `Status` and `Confidence` rows are the only inputs. Take the status string as written; never recompute the readiness threshold yourself.

| Phase | File | Done when `Status` starts with | Otherwise |
| --- | --- | --- | --- |
| 1 Requirements | the PRD | `Ready for specification` | `In progress`, with the `Confidence` percentage |
| 2 Solution | the tech spec | `Ready for implementation` | `In progress`, with the `Confidence` as written (`n/5` or a percentage); `Not started` if the file does not exist |
| 3 Implementation | the tech spec, plus `NNNN-slug-verification.md` | never measured | `Not started`, `Next` or `Started` |

Phase 3 is only a position, never a percentage:

- `Not started`: phase 2 is not done yet.
- `Next`: phase 2 is done and nothing shows implementation has begun.
- `Started`: `specs/NNNN-slug-verification.md` exists, or at least one acceptance criterion in the spec carries a `[done]` or `[partly]` tag.

A phase after an unfinished one is `Not started`, even if its file exists.

### 3. Work out the next command

One command per feature, by the first phase that is not done:

| Where the feature stands | Next command |
| --- | --- |
| PRD not ready | `/sw-design-requirements <prd path>` |
| PRD ready, spec not ready or missing | `/sw-design-solution <prd path>` |
| Spec ready, implementation not started | `/sw-implement-feature <spec path>` |
| Implementation started | none (`-`) |
| Tech spec with no PRD | none (`-`) |

For a spec that does not exist yet, the PRD path is the input. Always write the command as a slash command (`/sw-implement-feature ...`). Add `--editor` only if the user asked for the editor.

### 4. Report

One markdown table, nothing before it except a line with the count of features, and no commentary after it unless something could not be read (name that file in one line).

| No. | Feature | PRD | Tech spec | Implementation | Next |
| :-- | :-- | :-- | :-- | :-- | :-- |

- No.: the four digits.
- Feature: the slug with hyphens turned into spaces and the first letter capitalised.
- Phase cells: `Ready, 94%`, `In progress, 70%`, `Ready, 5/5`, `Not started`, `Next`, `Started`, `missing`.
- Next: the command from step 3 with its leading slash, in code format, so the user can run it as typed.

Plain text only inside the cells: no emoji, no line breaks, no bars. Sort by `No.`.

If more than ten features have `Started` implementation, collapse those into one line under the table (`N features with implementation started`) and list only the others.

If `specs/` holds no feature file, say so in one line and name `sw-design-requirements` as how to start one.

## What this skill does not do

- It does not judge quality, check that the PRD or spec is correct, or read acceptance criteria beyond their status tags.
- It does not follow up on features whose files disagree (for example a spec marked ready while its PRD is not): report the cells as written.
- It does not cover documents without the four-digit prefix, such as planning notes or tender analyses.
