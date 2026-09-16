---
title: "<Feature name> (<Administration|Storefront>)"
nav_order: <n>
parent: <Domain title>
grand_parent: Domains
domain: <domain-slug>
surface: <administration|storefront>
feature: <feature-slug>
status: <built|partially-built|planned|not-built|deprecated>
extension: <PluginName in custom/, composer package vendor/name, or null>
spec: <specs/NNNN-slug-spec.md or null>
prd: <specs/NNNN-slug.md or null>
verified_against: Shopware 6.7.13
last_synced: YYYY-MM-DD
tags: [<domain-slug>, <surface>]
related: [../<other-surface>/<feature-slug>.md, ../index.md]
---

# <Feature name> — <Administration|Storefront>

<1–2 sentences: what on THIS surface. For the why, link to the domain index feature entry: [Domain index](../index.md#features). Storefront half may link to the Administration half instead of restating.>

## Status

<If built: "`built` — verified YYYY-MM-DD (AC-1..AC-n pass).">

<If NOT built / planned / partially built, this block is mandatory:>
> ⚠️ NOT BUILT
>
> **What exists in the repo:** <PRD/spec/flag/partial code, with paths>
> **What is missing:** <what sw-document-feature could not find under custom/>
> **Reference:** <spec ACs, verification report date or "not run">. Checked against the repo on YYYY-MM-DD.
>
> Do not describe this feature as available. Everything below is the *intended* design from the spec.

## Business user

<How it is used on THIS surface only. Administration: menu path, fields, workflows, ACL. Storefront: what the shopper sees and does. Concise.>

## Developer

- **Where:** <extension, paths, entities, modules, routes>
- **Extension points used:** <events, decorators, entity extensions, cart processors, Twig blocks, component overrides>
- **Decisions:** <key choices and why; link ADRs>
- **Config:** <keys, flags — link ../../platform/configuration.md>
- **Debug/observe:** <log channel, profiler hints — link ../../platform/logging.md, ../../platform/debugging.md>
- **Gotchas:** <surprises for the next developer>

No code listings. At most a one-line snippet if unavoidable.

## Related

- Counterpart surface: [../<other-surface>/<feature-slug>.md](../index.md)
- Domain: [../index.md](../index.md)
- Spec / PRD / ADRs / platform pages

## Decision Log

<Optional. One line per user decision, override, or status change; append only, never rewrite. Omit the section if empty.>
- YYYY-MM-DD — <e.g. User enforced documentation although the built-check found no code>

---

*Last synced: YYYY-MM-DD · Verified against Shopware 6.7.13 · Re-sync: re-run `sw-document-feature`.*
