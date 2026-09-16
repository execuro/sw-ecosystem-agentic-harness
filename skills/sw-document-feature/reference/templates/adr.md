---
title: <Decision title>
nav_order: <n>
parent: Decision records
date: YYYY-MM-DD
area: <platform|checkout|catalogues|orders|customers|process>
tags: [<tag>]
authors: [<Name>]
status: <accepted|superseded|deprecated>
---

# <Decision title>

Shopware ADR format. File name: `adr/YYYY-MM-DD-<kebab-title>.md`. The adr index in [../adr/index.md](../adr/index.md) — its regenerated TOC block, and additionally a Liquid-rendered table on wikis using the Jekyll flavor — picks it up automatically. Filled only for an ADR the user provides in chat as accepted — never generated from the skill's own judgment; a not-yet-accepted ADR belongs in `specs/*-adr-*.md` as WIP. WIP files are not written from this template; they are promoted per `reference/adr-promotion.md` once accepted and built (same frontmatter plus `id`, `prd`, `spec`, `owner`, `promoted_from`, `promoted`, body carried over). Use `area: process` for project/process decisions and a `business` tag for business rules; routine business rationale belongs in the domain index "Why" column instead.

## Context

<The situation and forces. Link the spec, PRD, or feature page that triggered it.>

## Decision

<What we decided, present tense. One decision per ADR.>

## Consequences

<Positive, negative, follow-ups. If this supersedes another ADR, link it and set that ADR's status to superseded.>
