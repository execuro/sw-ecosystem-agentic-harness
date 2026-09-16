---
title: Environments and deployment
nav_order: 6
grand_parent: Domains
parent: Platform
type: platform
purpose: Which environments exist, how a build reaches them, and how to roll back.
scope: Process and topology. No hostnames or credentials.
last_synced: {{DATE}}
verified_against: Shopware {{SHOPWARE_VERSION}}
resync: Update when the CI pipeline or environment list changes.
tags: [platform, deployment, environments]
---

# Environments and deployment

<!-- List every environment defined in .shopware-project.yml or the CI config, local first. Fill from the repo, never invent one. -->

*No environment beyond `local` is recorded for this project yet.*

## Local stack

<!-- One row per service the local stack exposes, read from compose.yaml / docker-dev; ports and addresses are project facts, not examples. -->

*Local services not recorded yet — see [Tech stack](../../baseline/tech-stack.md) for how to read them from `compose.yaml`.*

Component versions (PHP, Node, Database, Shopware) live on
[Tech stack](../../baseline/tech-stack.md) — not repeated here.

## Deployment flow

<!-- Numbered steps from CI to running: build (shopware-cli project ci / build), artifact, target routine (migrations, plugin:refresh/update, theme:compile, cache warmup), rollback strategy. -->

*No deployment pipeline is recorded in this repo yet.*

## Rules

- No manual changes on non-local containers.
- Feature flags (see [Configuration](configuration.md)) gate anything with `status: partially-built`.

## Related

- [Tech stack](../../baseline/tech-stack.md), [Logging](logging.md)

---

*Scope: process and topology, no hostnames or credentials · Last synced: {{DATE}} · Verified
against Shopware {{SHOPWARE_VERSION}} · Re-sync: update when a CI pipeline or a new environment is added to
`.shopware-project.yml`.*
