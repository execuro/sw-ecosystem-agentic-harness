# Client question rules

A client question (`CQ-n`) is the written question the partner submits in the tender's Q&A round. It is the only correct answer to a vague row; a silent assumption on a vague row is a defect.

## Ask, do not assume, when

1. **Comparative or totality phrasing** — "as good as", "comparable to", "modern", "fast", "everything that works today", "all".
2. **Undefined reference** — "to be defined", "some", "such as", "etc.", a system named without objects or direction.
3. **External counterpart without interface or owner** — an integration whose API, format or responsible party is not named.
4. **Wide estimate** — no acceptance criteria and the architect's high is more than 2× its low.
5. **Stock contradiction** — the PM reports `conflict` between the row and verified stock behaviour, or between tier documentation and the RFP's plan assumption.
6. **RFP-internal contradiction** — a row conflicts with the constraints sheet, another row, or a stated out-of-scope item.
7. **Rejected assumption routed to the client** — an assume line was `[-]` rejected and the partner wants the client to decide (its `C-n` says so).
8. **Missing or conflicting key parameter** — a §1.2 Key parameters row marked **drv** in `context-parameters.md` reads `_not provided_`, or any row reads `conflicting`. Use that file's question stubs; ask for a figure or a bracket, never for a design. One question may cover a whole group.

## Never ask

- What the RFP already answers, even if buried in another sheet.
- What the partner can decide (plan preference, own assets, overhead and buffer policy) — that is a `Q-n`.
- Wording, formatting, or which column to use.
- Anything technical the client cannot judge ("subscriber or decorator").

Test: *if answered both ways, would a class, a PD figure or a statement on that row differ?* No → no question.

## Wording

- RFP language. One decision per question. Row ids in the block heading.
- 2–4 options where the answer space is known, each with its effect on scope in plain words, plus `Other:`. No PD figures to the client unless the partner asks for them.
- Neutral: never lead with the partner's preferred option, never argue.
- State the assumption the estimate uses: *"Until answered we assume …"* — and write that same assumption under the row as a suggested `[ ]` line, so the partner can accept it without the client.
- Quote the RFP's own sentence when the contradiction is internal; quote the PM's evidence (doc URL + version) when it is a stock contradiction, never a claim from memory.

## Blocking

A question is **blocking** when no defensible estimate exists even with a written assumption: unbounded parity rows, integrations with undefined objects, a plan-tier conflict on a Must row. Blocking → row status `blocked, CQ-n`, PD empty, heading `blocking: yes`. Everything else → the row keeps its PD, status `estimated, CQ-n`, with the assumption it rests on written under it as a `[ ]` line.

A blocking `CQ-n` on a Must row blocks *Ready to submit* regardless of the confidence total.

## Cap and order

- At most 25 questions per submission; merge questions on the same topic across rows.
- Order by PD swing (largest first), then by priority (Must before Should).
- Beyond the cap, the remaining vague rows keep their `[ ]` assumption line and are listed in §5 as `Not sent — cap`.

## Answers

The partner records the client's answer by ticking an option or filling `Other:` in the §5 block. The next run's reconciliation turns it into a `.c<n>` line under every row the block names (source `client, CQ-n`, status date), or an `RC-n` in §3 when cross-cutting; the block is deleted; affected rows are re-estimated; one `C-n`. The client's wording never lands in the document, the decision does.
