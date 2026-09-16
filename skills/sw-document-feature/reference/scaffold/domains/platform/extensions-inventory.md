---
title: Extensions inventory
nav_order: 1
grand_parent: Domains
parent: Platform
type: platform
purpose: The authoritative list of custom Extensions (plugins, apps, themes) in this project and which domain owns each.
scope: custom/plugins, custom/apps, custom/static-plugins, and vendor-installed store extensions that deliver project features. Not Shopware core.
last_synced: {{DATE}}
verified_against: Shopware {{SHOPWARE_VERSION}}
resync: sw-document-feature adds a row when a spec introduces a new extension; verify with `bin/console plugin:list` and `app:list`.
tags: [platform, extensions, inventory]
---

# Extensions inventory

Every Extension this project ships, and which domain owns it. If an extension is not listed here, it is not ours.

<!-- One row per extension. Type = plugin | app | theme | package (vendor-installed). Path = custom/... or vendor/... Owning domain links the domain index. -->

| Extension | Type | Path | Owning domain | Depends on | Purpose | Notes |
|---|---|---|---|---|---|---|

*No extensions installed yet — `custom/plugins/`, `custom/apps/` and `custom/static-plugins/` are
all empty.*

## Rules

<!-- Record the project's own naming and ownership rules here, e.g. one plugin per domain group, a shared core plugin for cross-cutting code, technical-name prefix for config keys and log channels. Keep them as rules, not history — history goes to adr/. -->

- Every extension that ships project functionality requires a row here, including vendor-installed ones.
- An extension serving more than one domain records the sharing in the Notes column.
- Cross-cutting code (logging, feature flags, shared traits) goes into the platform-level extension named here, never into a business-domain extension. See [Customization guidelines](customization-guidelines.md).

---

*Scope: custom/plugins, custom/apps, custom/static-plugins, and vendor-installed store extensions,
not Shopware core · Last synced: {{DATE}} · Verified against Shopware {{SHOPWARE_VERSION}} · Re-sync:
`bin/console plugin:list`, `bin/console app:list`, `ls custom/plugins custom/apps
custom/static-plugins` vs this table.*
