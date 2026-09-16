---
title: "<Base or surface guideline file title, matching the platform file>"
nav_order: <n>
parent: Guidelines
merge:
  <platform-section-anchor>: <override|extend|waive>
adr: [adr/<date>-<topic>.md]
tags: [guidelines, platform]
last_synced: YYYY-MM-DD
verified_against: Shopware 6.7.13
---

# <Title>

<1–2 sentences: what this project changes about `<same file name>` in the Shopware platform
guidelines, and why. Everything not listed here is inherited unchanged — do not restate platform
rules.>

<!--
Read the platform file first — `read_doc platform/guidelines/<version>/<file>.md` — and copy the
real heading anchor for each section you act on into `merge:` above. One `## <heading>` per rule
below, anchor matching a real platform section unless the rule is a pure addition.

override — replaces the platform section in place. Body is the full replacement rule.
extend    — inserted directly before the platform section; both apply, this one first.
waive     — replaces the platform section; body states the reason and starts with `WAIVED:`.
(anchor not in the platform file) — an addition, appended after the last platform section.
-->

## <Platform section heading, verbatim anchor>

<The project's rule for this section. For `waive`, start with `WAIVED:` and state the reason.>

## Related

- [Guidelines](index.md)
- ADR: [<id>](../adr/<file>.md) <if `adr:` is set>

---

*Last synced: YYYY-MM-DD · Verified against Shopware 6.7.13 · Re-sync: update when the rule
changes or the platform file's anchor is renamed by regeneration.*
