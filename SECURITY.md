# Security Policy

## Supported versions

`0.x`, latest release only. This package is pre-1.0; fixes land on the tip of
`main` and ship in the next `0.x` release rather than being backported.

## Reporting a vulnerability

Report a suspected vulnerability privately, using GitHub's private
vulnerability reporting: open
**https://github.com/execuro/sw-ecosystem-agentic-harness/security/advisories/new**,
or click **Report a vulnerability** on the repository's **Security** tab.
This opens a private thread visible only to you and the maintainers; nothing
becomes public until an advisory is published. Please do not open a public
GitHub issue for a suspected vulnerability — that discloses it before a fix
exists.

We aim to acknowledge a report within **5 business days** and to have a fix or
a mitigation plan within **30 days** of confirming it.

## What is in scope

This package's installer writes to files outside its own tree: your coding
agent's settings, MCP configuration and permission rules, under both project
and user (`$HOME`) scope. In-scope classes of issue include:

- the installer writing outside the paths it documents, or outside `--root`
  and the selected `--scope`;
- path traversal in any value the installer reads from a project (skill
  names, host markers, lock file entries) and turns into a filesystem path;
- the installer overwriting a file it did not create, or silently discarding
  a user's edits (the "conflict" and "drift" states existing precisely to
  prevent this — a bypass of either is a vulnerability);
- a JSONC or TOML config being corrupted by a partial or non-atomic write;
- the installer executing anything beyond the CLI invocation the user typed,
  or an install hook firing without the user running `apply` themselves.

This package declares **zero runtime dependencies** and runs **no lifecycle
scripts** on install, which removes a large part of the usual npm attack
surface.

Out of scope: vulnerabilities in the coding agents themselves, in the
separately published companion packages (they have their own repositories
and their own reporting), or in a third-party MCP server this package merely
registers, such as Playwright's (report those upstream).

## Disclosure

We credit reporters in the release notes unless you ask not to be named.
