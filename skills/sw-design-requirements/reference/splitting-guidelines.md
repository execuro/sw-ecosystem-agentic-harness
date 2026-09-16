# Splitting guidelines

When one PRD should have been two. Recommend only — the user decides, and a PRD is never split unasked.

## Size is not a signal

A simple feature can legitimately need many actors, many domain rows, and twenty FRs. A tangled feature can hide in eight. Length tells you nothing on its own.

None of these are reasons to split: FR count, table row count, file length, number of edge cases, breadth of an admin configuration surface, or a section that grew longer than its neighbours.

If a PRD merely feels long, the fix is usually to cut restatement and remove tech-spec content that leaked in — not to divide the feature.

## The real signal: coupling

Ask the standalone-value question in both directions:

> If part A shipped alone and B never did, does a real actor get value?
> If part B shipped alone and A never did, does a real actor get value?

**Both yes → splitting is viable.** Then check whether it is worthwhile using the signals below.
**One yes → it is one feature with a phase, not two PRDs.** The "no" half is a requirement of the "yes" half.
**Both no → one PRD.** Neither half exists without the other.

## Worth splitting

The more of these hold, the stronger the case:

- **Independent outcomes.** Each half has its own goal statement, and neither goal reads as a step toward the other.
- **Disjoint acceptance criteria.** No AC needs both halves to be true. If you cannot write a single Given/When/Then that spans the two, they are loosely coupled.
- **Disjoint actors.** A merchant-facing configuration capability and a customer-facing behaviour that consume nothing from each other.
- **No shared business rule.** Section 6 rules fall cleanly on one side. A rule that references both halves is the strongest keep-together signal there is.
- **Different release timing or lifecycle.** One is wanted this quarter, the other is exploratory.
- **Asymmetric blocking.** Half is waiting on a decision, an external system, or a licence question, and half is fully specified. Splitting lets the ready half reach *Ready for specification* instead of being held hostage.
- **Bimodal confidence.** One area scores near 100 and the other sits at `_TBD_`. A single number averages away the fact that most of the work is fully understood.
- **The clarification loop forks.** Answers about A never constrain B, and each round has to ask about both separately. That is two conversations sharing a file.

## Keep together

Any one of these outweighs several splitting signals:

- A single acceptance criterion spans both halves.
- A business rule references both halves.
- They are one actor journey — the actor experiences them as a single flow, whatever internal boundary you see.
- They share a state machine, or the same order/cart lifecycle from the actor's point of view.
- One half changes the other's acceptance criteria. A one-way dependency is fine; a two-way one is not.
- Reading either PRD alone would require jumping to the other to understand basic behaviour.

## Ordering dependencies are not a reason to keep them together

"A must ship before B" is a sequence, not coupling. Split it, state the dependency in B's §2 Scope, and let A reach *Ready for specification* on its own schedule.

The disqualifier is the other direction: if a decision inside B would change A's FRs or ACs, they are genuinely coupled and stay in one PRD.

## When you do split

- Split by **outcome or actor journey**, never by delivery layer. Storefront-vs-admin, frontend-vs-backend, and phase-1-vs-phase-2 are tech-spec or planning boundaries, not requirement boundaries — the first two also drag architecture into a business document.
- Each resulting PRD gets its own sequential number, its own confidence score, and a complete §1 Problem & Goal that stands alone.
- Cross-reference in §2 Scope (`Depends on PRD-0004` / `Extends PRD-0004`). Do not use `Supersedes` — nothing was replaced.
- Move the relevant clarification-log lines to whichever PRD they now govern, rather than duplicating them.

## The opposite case

A PRD too small to state a standalone outcome is not a PRD. If §1 can only be written as "so that PRD-0006 can work", it is a requirement of PRD-0006. Fold it in.

## How to raise it

One line in the closing report, phrased as a question, never as an action already taken:

> "§5 splits cleanly — the merchant import and the storefront badge share no rule and no AC. Worth two PRDs?"
