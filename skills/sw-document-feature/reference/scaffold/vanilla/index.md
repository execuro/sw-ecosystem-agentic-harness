---
title: Home
nav_order: 1
type: index
purpose: Entry point and wiki index for the {{PROJECT_NAME}} documentation.
scope: Everything under docs/project-wiki/. Does not cover Shopware core docs (use the ShopwareDevKnowledgeBase MCP for those).
last_synced: {{DATE}}
verified_against: Shopware {{SHOPWARE_VERSION}}
resync: Regenerate the domain map from domains/index.md whenever a domain or feature page is added.
tags: [index, wiki]
---

# Project documentation

Everything this team knows about **this** Shopware project: what we built, why we built it that
way, where it lives in the code, and how to run and debug it. Shopware's own behaviour is not
repeated here — where stock Shopware already answers a question, we link to Shopware's docs
instead. Coding guidelines are inherited from the Shopware platform guidelines; project deviations
live in [Guidelines](guidelines/index.md).

## Start here

| If you are… | Go to |
|---|---|
| New to the project | [Tech stack](baseline/tech-stack.md) — versions, services, how to run it locally |
| Looking for a feature | [Domains](domains/index.md) — pick a domain, then Administration or Storefront |
| Asking "why is it built this way?" | [Decision records](adr/index.md) |
| Checking a coding rule | [Guidelines](guidelines/index.md) |
| Debugging something | [Debugging](domains/platform/debugging.md) · [Logging](domains/platform/logging.md) |
| Unsure what a word means | [Glossary](baseline/glossary.md) |
| Writing or generating a page | [Documentation guidelines](guidelines/documentation-guidelines.md) |

## Domains

Feature documentation is organised by business domain, then by the surface the user acts on —
Administration (merchant) or Storefront (shopper).

<!-- sw-document-feature adds one row per domain when the domain is created. Keep in sync with domains/index.md. -->

| Domain | What it covers |
|---|---|
| [Platform](domains/platform/index.md) | Cross-cutting infrastructure: extensions, configuration, logging, debugging, environments |

## All sections

- [Tech stack](baseline/tech-stack.md) — the versions and services every feature is built and verified against
- [Glossary](baseline/glossary.md) — project terms mapped to Shopware's own terminology
- [Domains](domains/index.md) — feature documentation per domain and surface
- [Decision records](adr/index.md) — the technical and process decisions behind the project
- [Guidelines](guidelines/index.md) — this project's coding rules, inherited from Shopware unless overridden
- [Documentation guidelines](guidelines/documentation-guidelines.md) — page types, front matter, status vocabulary, what not to document
- [Overview](README.md) — what this wiki is

## About this wiki

Pages are written and kept in sync by the `sw-document-feature` skill, which documents a feature
only after it has been verified in the code. Each page states when it was last synced and which
Shopware version it was verified against, so a stale page is visible as stale rather than wrong.

The path a feature takes: PRD `specs/NNNN-slug.md` → tech spec `specs/NNNN-slug-spec.md` →
implementation in `custom/plugins/<PluginName>` → `sw-verify-feature` → `sw-document-feature` →
the pages here.

---

*Scope: everything under `docs/project-wiki/`. · Last synced: {{DATE}} · Verified against
Shopware {{SHOPWARE_VERSION}} · Re-sync: run `sw-document-feature` after each `sw-verify-feature` report;
`last_synced` is bumped only on the pages that run touches.*
