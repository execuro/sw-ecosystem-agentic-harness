---
title: Logging
nav_order: 4
grand_parent: Domains
parent: Platform
type: platform
purpose: Which log channels exist, where they go, and how to correlate entries.
scope: Application logs from custom extensions and Shopware. Not infrastructure/container logs.
last_synced: {{DATE}}
verified_against: Shopware {{SHOPWARE_VERSION}}
resync: Update when an extension registers a new Monolog channel (config/packages/monolog.yaml).
tags: [platform, logging, observability]
---

# Logging

Which log channel carries what, and where it ends up — so you look in the right file first.

## Channels

<!-- Shopware's own channels first (app, business_events), then one row per project channel. Destination = file path or stream, no hostnames. -->

| Channel | Emitted by | Level (prod) | Destination |
|---|---|---|---|
| `app` | Shopware core | `error` | `var/log/prod.log`, stderr in containers |
| `business_events` | Flow Builder, mail | `info` | `var/log/business_events.log` |

*No project-specific log channel is recorded yet.*

Local (`APP_ENV=dev`): everything at `debug`, also in the Symfony profiler.

## Conventions

<!-- Context fields every entry carries (sales_channel_id, order_number…), what must never be logged (customer PII), correlation id handling, which channel a feature must use. -->

*No project-specific logging conventions recorded yet.*

## Related

- [Debugging](debugging.md), [Environments and deployment](environments-and-deployment.md)

---

*Scope: application logs from custom extensions and Shopware, not infrastructure/container logs ·
Last synced: {{DATE}} · Verified against Shopware {{SHOPWARE_VERSION}} · Re-sync: compare with
`config/packages/monolog.yaml` when an extension registers a new channel.*
