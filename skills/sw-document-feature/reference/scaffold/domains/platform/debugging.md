---
title: Debugging
nav_order: 5
grand_parent: Domains
parent: Platform
type: platform
purpose: How to observe and debug this project locally, and where to look first for common failures.
scope: Local development. Production incident handling lives in environments-and-deployment.md.
last_synced: {{DATE}}
verified_against: Shopware {{SHOPWARE_VERSION}}
resync: Update when the local setup or tooling changes (see baseline/tech-stack.md).
tags: [platform, debugging, profiler, xdebug]
---

# Debugging

Where to look first when something breaks locally, and which tool answers which question.

## Tools

<!-- Keep the generic Shopware tools; add the project's container/service names, ports and IDE settings once known. -->

- **Symfony profiler** at `/_profiler` when `APP_ENV=dev`; Store API and Admin API requests appear there too.
- **Logs**: see [Logging](logging.md).
- **`bin/console`** for any CLI diagnostics (`bundle:dump`, `cache:clear`, `database:migrate`, …).
- **shopware-cli**: `shopware-cli project ci` for the full lint/static-analysis run, `shopware-cli extension validate --full` per extension.

Xdebug config is not recorded in this project yet — fill in the container, `XDEBUG_MODE`, and IDE
server name once set up.

## Common failure lookups

<!-- Add a row whenever a feature page's Gotchas reveal a recurring symptom; link the feature page. -->

| Symptom | Look first |
|---|---|
| Administration module missing after change | `bin/console bundle:dump` + rebuild; check the extension's `main.js` entry and ACL privileges |
| Storefront template change not visible | `bin/console cache:clear`, `theme:compile`; confirm the block lives in the domain extension, not the theme |
| Custom entity not found / 500 on Admin API | migration ran? `bin/console database:migrate --all`; entity definition registered in `services.yaml` |
| Flow not firing | `business_events` log; is the event registered as a business event? |

## Surface tips

- Administration: Vue devtools work on the dev build; the Admin API request log is in the profiler.
- Storefront: `?_profiler` on any page; Twig template names visible via the profiler's Twig panel.

## Related

- [Configuration](configuration.md), [Customization guidelines](customization-guidelines.md)

---

*Scope: local development, production incidents live in environments-and-deployment.md ·
Last synced: {{DATE}} · Verified against Shopware {{SHOPWARE_VERSION}} · Re-sync: re-run each tip on a fresh
checkout after upgrades.*
