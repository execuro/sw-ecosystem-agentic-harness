---
title: Tech stack
nav_order: 2
type: project
purpose: The fixed technical baseline every feature is built and verified against.
scope: Versions, runtime, tooling, environment shape. Not per-feature configuration (see domains/platform/configuration.md).
last_synced: {{DATE}}
verified_against: Shopware {{SHOPWARE_VERSION}}
resync: Update after any Shopware, PHP, or shopware-cli upgrade; bump verified_against on all pages in the same change.
tags: [baseline, versions]
---

# Tech stack

What this project runs on. Every feature page is verified against the versions below, so when one
of them changes, the pages that were verified against the old one become visibly stale.

<!-- Fill from the repo, never from memory: Shopware = composer.lock shopware/core; PHP and Node = the docker-dev image tag in compose.yaml; Database = the database service image; shopware-cli = `shopware-cli --version`. Replace _TBD_ rows only with a verified value; never invent one. -->

## Versions

| Component | Version | Where it comes from |
|---|---|---|
| Shopware | {{SHOPWARE_VERSION}} | `composer.json` / `composer.lock` (`shopware/core`) |

*PHP, database, Node and shopware-cli versions not recorded yet — fill from `compose.yaml`,
`.shopware-project.yml`, and `shopware-cli --version` when known.*

The project is Composer-based, built from the `shopware/production` template.

## Where things live

- Extensions: `custom/plugins/`, `custom/apps/`, `custom/static-plugins/` — see the
  [extensions inventory](../domains/platform/extensions-inventory.md).
- Specs and PRDs: `specs/`. This wiki: `docs/project-wiki/`.
- Local environment and non-local environments:
  [Environments and deployment](../domains/platform/environments-and-deployment.md).

## Related

- [Glossary](glossary.md)
- [Platform](../domains/platform/index.md)

---

*Scope: versions and environment shape only. · Last synced: {{DATE}} · Verified against Shopware
{{SHOPWARE_VERSION}} · Re-sync: compare with `composer.json`, `composer.lock`, `compose.yaml` and
`.shopware-project.yml` after any upgrade.*
