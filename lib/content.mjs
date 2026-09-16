// What this package ships, and the two things that can only be decided on the
// user's machine: an absolute path, and `process.platform`.
//
// Everything else — the Codex TOMLs, the Copilot adapters, AGENTS.md — is
// generated at build time by `scripts/gen-*.mjs`, committed and CI-diffed. A
// bad transform is then a red CI run on our own PR rather than a stranger's
// broken install.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { walk } from './fsx.mjs';

export const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const pkg = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8'));
export const PKG_NAME = pkg.name;
export const PKG_VERSION = pkg.version;

/**
 * The layout of what we install. Bumped only when an old CLI would write a
 * layout a newer one cannot uninstall; the lock records it and `read()`
 * refuses anything not in SUPPORTED_CONTENT.
 */
export const CONTENT_VERSION = 1;
export const SUPPORTED_CONTENT = [1];

export const LOCK_DIR = '.sw-ai-sdk';
export const LOCK_FILE = `${LOCK_DIR}/harness.lock.json`;

function dirsIn(abs) {
  return readdirSync(abs)
    .filter((entry) => statSync(join(abs, entry)).isDirectory())
    .sort();
}

/** Every shipped skill, with its file list relative to the skill directory. */
export function skills() {
  const root = join(PKG_ROOT, 'skills');
  return dirsIn(root).map((name) => ({
    name,
    root: `skills/${name}`,
    files: walk(join(root, name)),
  }));
}

/** Every shipped agent, with the path to each host's adapter. */
export function agents() {
  const root = join(PKG_ROOT, 'agents');
  return readdirSync(root)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((file) => {
      const name = file.replace(/\.md$/, '');
      return {
        name,
        claude: `agents/${name}.md`,
        codex: `codex/agents/${name}.toml`,
        copilot: `copilot/agents/${name}.agent.md`,
      };
    });
}

export function agentsMd() {
  return readFileSync(join(PKG_ROOT, 'content', 'AGENTS.md'), 'utf8');
}

/** The permission rules and settings keys the installer merges. */
export function claudeSettings() {
  return JSON.parse(readFileSync(join(PKG_ROOT, 'content', 'claude-settings.json'), 'utf8'));
}

/**
 * Wrap a command for the host platform.
 *
 * `npx` on Windows is a `.cmd` shim, and a bare `"command": "npx"` fails with
 * `spawn ENOENT` in every host we target. `platform` is a parameter rather
 * than a read of `process.platform` so the Windows behaviour is testable on
 * Linux — which is the only way it ever actually gets tested.
 */
export function wrapCommand({ command, args }, platform) {
  if (platform === 'win32') return { command: 'cmd', args: ['/c', command, ...args] };
  return { command, args: [...args] };
}

/**
 * The MCP servers to register, fully resolved: no `${VAR}`, because Codex
 * performs no expansion at all and the others disagree about the syntax.
 */
export function mcpServers({ platform, root, projectWiki } = {}) {
  const spec = JSON.parse(readFileSync(join(PKG_ROOT, 'content', 'mcp-servers.json'), 'utf8'));
  return spec.servers.map((server) => {
    const args = [...server.args];
    if (server.projectWikiFlag) {
      const wiki = projectWiki ?? join(root ?? process.cwd(), ...server.projectWikiDefault.split('/'));
      args.push(server.projectWikiFlag, wiki);
    }
    const wrapped = wrapCommand({ command: 'npx', args }, platform);
    return { name: server.name, type: 'stdio', ...wrapped };
  });
}
