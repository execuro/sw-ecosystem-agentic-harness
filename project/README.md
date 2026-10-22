# project/

Files the installer writes into the target project, besides skills and agents.
Not plugin hooks: nothing here is auto-loaded by a plugin host.

| File | Target | How |
| --- | --- | --- |
| `entry/router.md` | `AGENTS.md`, `CLAUDE.md` or `.github/copilot-instructions.md` (see `lib/entry-files.mjs`) | fence |
| `entry/cursor/sw-shopware-knowledge.mdc` (generated) | `.cursor/rules/` when no `AGENTS.md` | copy |
| `hooks/sw-knowledge-routing.mjs` (generated, router embedded) | `.claude/hooks/`, `.codex/hooks/` | copy |
| `hooks/claude.json` | `.claude/settings.json` `/hooks/SubagentStart` | merge |
| `hooks/codex.json` | `.codex/hooks.json` `/hooks/SubagentStart` | merge |
| `config/claude-settings.json` | `.claude/settings.json` permissions, sandbox | merge |
| `config/mcp-servers.json` | `.mcp.json`, `.codex/config.toml`, `.vscode/mcp.json`, `.cursor/mcp.json` | merge (Codex: fence) |

- fence: managed block, rest of the file untouched.
- copy: whole file, byte for byte.
- merge: JSON entries added; yours stay.
- Generated files: `npm run gen`. Never hand-edit.
