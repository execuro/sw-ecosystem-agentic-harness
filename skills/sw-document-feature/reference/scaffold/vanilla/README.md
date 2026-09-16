---
title: "Shopware Project Wiki"
nav_exclude: true
tags: [readme, meta]
---

# Shopware Project Wiki

This documentation was produced by the **Shopware Ecosystem AI SDK**. It is structured, atomic documentation written to be consumed by coding agents (MCP/LLM tooling) and, at the same time, to serve as the project's living documentation for the whole team — PMs, architects, developers, QA.

## What is inside

- `domains/<domain>/` → one feature page per surface (`administration/`, `storefront/`); `adr/` holds decision records; `domains/platform/` covers cross-cutting infrastructure (extensions, configuration, logging, debugging, environments); `guidelines/` holds this project's coding rules, inherited from Shopware unless overridden, plus [documentation guidelines](guidelines/documentation-guidelines.md).
- Entry point is [index.md](index.md); the rules every page follows are in [guidelines/documentation-guidelines.md](guidelines/documentation-guidelines.md).
- Kept in sync by the `sw-document-feature` skill after each feature verification (`sw-verify-feature`).

## Browsing this wiki

Every page is plain Markdown — no config files, no static-site build step or generator, nothing beyond docs and folder structure. Browse it directly in GitHub's file view, in any IDE, or on the command line with `cat`/`grep`. A Jekyll/GitHub Pages structure is a separate flavor of this same wiki, chosen once when it's first created — ask for that flavor next time if the project outgrows plain Markdown.

---

*Generated {{DATE}} · verified against Shopware {{SHOPWARE_VERSION}} · the rules for pages live in
[guidelines/documentation-guidelines.md](guidelines/documentation-guidelines.md).*
