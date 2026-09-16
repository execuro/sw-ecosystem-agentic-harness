# Security Policy

## Supported versions

`0.x`, latest release only. This package is pre-1.0; fixes land on the tip of
`main` and ship in the next `0.x` release rather than being backported.

## Reporting a vulnerability

Email **security@execuro.example** <!-- placeholder: no verified Execuro
security contact was found in this repository; replace with the real address
before publishing --> with a description of the issue and, if you have one, a
reproduction. Do not open a public GitHub issue for a suspected vulnerability.

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

Out of scope: vulnerabilities in a third-party MCP server this package
registers (report those upstream), and the Shopware project code the
installed skills and agents operate on.

## Disclosure

We credit reporters in the release notes unless you ask not to be named.
