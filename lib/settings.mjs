// The anchored target agents: `sw-ecosystem-agentic-harness.json`, next to the lock (see
// `lockDir()` in content.mjs).
//
// The lock records what was *installed*; this records what the project
// *targets*. Marker directories only ever produce candidates — a stray empty
// `.vscode/` must not make Copilot a target — so every command that has to
// pick agents reads this file first. Only the CLI writes it, per checkout: it
// lives in the ignored state directory, so each machine anchors once.

import { dirname } from 'node:path';
import { LOCK_DIR, lockDir } from './content.mjs';
import {
  abs, ensureDir, exists, readTextMaybe, removeDirIfEmpty, removeFile, writeAtomic,
} from './fsx.mjs';
import { AGENTS } from './hosts.mjs';

const NAME = 'sw-ecosystem-agentic-harness.json';

export function settingsFile(root) {
  return `${lockDir(root)}/${NAME}`;
}

/** The pre-`var/` location; read only so an anchored project survives the move. */
function legacyPath(root) {
  return abs(root, `${LOCK_DIR}/${NAME}`);
}

/** The anchored agents, or null when nothing is anchored (or the file is unusable). */
export function read(root) {
  const found = readTextMaybe(abs(root, settingsFile(root))) ?? readTextMaybe(legacyPath(root));
  if (found === null) return null;
  let parsed;
  try { parsed = JSON.parse(found.text); } catch { return null; }
  const agents = (Array.isArray(parsed?.agents) ? parsed.agents : []).filter((a) => AGENTS.includes(a));
  return agents.length ? { ...parsed, agents: [...new Set(agents)] } : null;
}

export function write(root, agents, source) {
  const settings = {
    schema: 1, agents: [...new Set(agents)], anchored_at: new Date().toISOString(), source,
  };
  const target = abs(root, settingsFile(root));
  ensureDir(dirname(target));
  writeAtomic(target, `${JSON.stringify(settings, null, 2)}\n`);
  dropLegacy(root, target);
  return settings;
}

function dropLegacy(root, target) {
  const legacy = legacyPath(root);
  if (legacy !== target && exists(legacy)) {
    removeFile(legacy);
    removeDirIfEmpty(dirname(legacy));
  }
}

/** Move a settings file left at the old path to the current one. */
export function migrate(root) {
  const current = read(root);
  if (current && legacyPath(root) !== abs(root, settingsFile(root)) && exists(legacyPath(root))) write(root, current.agents, current.source ?? 'chosen');
}

/** Drop agents from the targets; the file goes when none are left. */
export function prune(root, removed) {
  const current = read(root);
  if (!current) return;
  const left = current.agents.filter((a) => !removed.includes(a));
  if (left.length === current.agents.length) return;
  if (left.length) {
    write(root, left, current.source ?? 'chosen');
    return;
  }
  const target = abs(root, settingsFile(root));
  removeFile(target);
  removeDirIfEmpty(dirname(target));
  dropLegacy(root, target);
}
