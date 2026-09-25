# Client question rules

A client question (`CQ-n`) is the written question the operator takes to the client's Q&A round; the tool writes no question document (AQ-7). It is the correct answer to a requirement too vague to assess — a silent guess is a defect.

## AQ-5 — when a requirement gets a CQ

A requirement too vague to assess gets a `CQ-n` in section 5: options, the scope effect of each, and a fallback. The scope item's Status becomes `blocked CQ-n` and it is estimated on the fallback option (E-4). Vague means: comparative or totality phrasing ("as good as", "everything that works today", "all"); an undefined reference ("to be defined", "some", "etc."); an external counterpart named without an interface or an owner; or a Shopware-stock contradiction the Dev Knowledge Base cannot resolve.

## Wording

- Client's own language. One decision per question. Item ids in the block heading (`analysis-template.md` section 5 grammar).
- At least two options (`A`, `B`, ...), each with its scope effect in plain words after `— effect:`.
- Neutral: never lead with a preferred option, never argue for one.
- Name a `Fallback:` key — the option the estimate assumes until the client answers.
- Quote the client's own sentence when the ambiguity is internal to their document; cite the Knowledge Base page when it is a stock contradiction, never a claim from memory.

## AQ-6 — answering

The operator records the client's chosen option on the page or with `answer <doc> <CQ-n> <key>`. The runtime marks every scope item the question names for re-estimate; a confirmed item among them reopens only when the next `apply` actually changes its Requirement Coverage, Estimation or Client Response (L-3), with the cause in References.

## Never ask

- What the client's own document already answers, even if it is on another sheet.
- What the operator can decide alone (profile inputs, preferred ISVs, phasing) — write a `Q-n` (an operator question, same shape) or resolve it directly.
- Wording, formatting, or which column to use.
- Anything the client cannot judge from a technical standpoint (an implementation choice with no client-visible effect).

Test: if answered either way, would a Requirement Coverage value, an Estimation figure or the Client Response text differ? No — no question.
