// The lock file: `var/sw-ai-sdk/harness.lock.json` in the host repository, or
// `.sw-ai-sdk/harness.lock.json` in a root that has no `var/` (see
// `lockDir()` in content.mjs).
//
// This is the ownership record. JSON config files have no comments, so nothing
// in `.mcp.json` can tell us who wrote an entry — the lock does, by content
// hash. It also records what we had to create (files, containers) so that
// removal is always narrower than addition, and which rules the user declined
// so we never ask twice.
//
// It is never tracked: it describes one machine's install, not the project.
// Under `var/` the Shopware recipe already ignores it; in the fallback
// location the installer writes the managed `.gitignore` line itself.
//
// A lock left at the old `.sw-ai-sdk/` path is read and rewritten to the new
// one on the next write, so an existing install never looks fresh.

import {
  LOCK_FILE, SUPPORTED_CONTENT, CONTENT_VERSION, PKG_NAME, PKG_VERSION, lockFile,
} from './content.mjs';
import {
  abs, ensureDir, exists, readTextMaybe, removeDirIfEmpty, removeFile, writeAtomic,
} from './fsx.mjs';
import { dirname } from 'node:path';

export class LockVersionError extends Error {}

export function lockPath(root) {
  return abs(root, lockFile(root));
}

/** The pre-`var/` location, kept only so an existing install can be migrated. */
export function legacyLockPath(root) {
  return abs(root, LOCK_FILE);
}

export function empty(scope) {
  return {
    schema: 1,
    content_version: CONTENT_VERSION,
    package: PKG_NAME,
    version: PKG_VERSION,
    scope,
    installed_at: null,
    updated_at: null,
    platform: process.platform,
    agents: {},
    files: {},
    dirs: [],
    json_pointers: [],
    rules: [],
    fences: [],
    declined: [],
    manual: [],
  };
}

/** Read the lock, or null when absent. Throws on a layout we cannot undo. */
export function read(root, scope) {
  // The new location first; a lock still at the old one is read here and
  // rewritten by `write()`.
  let where = lockFile(root);
  let found = readTextMaybe(lockPath(root));
  if (found === null) {
    found = readTextMaybe(legacyLockPath(root));
    where = LOCK_FILE;
  }
  if (found === null) return null;
  let lock;
  try {
    lock = JSON.parse(found.text);
  } catch {
    throw new LockVersionError(
      `${where} is not valid JSON. Move it aside and re-run apply to rebuild it.`,
    );
  }
  if (!SUPPORTED_CONTENT.includes(lock.content_version)) {
    throw new LockVersionError(
      `${where} records content_version ${lock.content_version}, which this ` +
        `version of ${PKG_NAME} (${PKG_VERSION}) does not understand.`,
    );
  }
  // Locks written before the `--host` -> `--agent` rename record the
  // selection under `hosts`. Read either, write `agents` — missing this
  // would make every existing install look like it had never chosen an
  // agent, and send it straight to the exit-2 "no --agent given" path.
  const { hosts, ...rest } = lock;
  return { ...empty(scope), ...rest, agents: lock.agents ?? hosts ?? {} };
}

export function write(root, lock) {
  const next = { ...lock, updated_at: new Date().toISOString() };
  if (!next.installed_at) next.installed_at = next.updated_at;
  const target = lockPath(root);
  ensureDir(dirname(target));
  writeAtomic(target, `${JSON.stringify(next, null, 2)}\n`);
  // Migration: one lock, at one path. Writing the new one and leaving the old
  // would make an older CLI, or our own `read()`, resurrect a stale record.
  const legacy = legacyLockPath(root);
  if (legacy !== target && exists(legacy)) {
    removeFile(legacy);
    removeDirIfEmpty(dirname(legacy));
  }
  return next;
}

/** Fold a batch of executed entries into the lock. */
export function record(lock, entries, { agent, version = PKG_VERSION } = {}) {
  const next = {
    ...lock,
    files: { ...lock.files },
    dirs: [...lock.dirs],
    json_pointers: [...lock.json_pointers],
    rules: [...lock.rules],
    fences: [...lock.fences],
    manual: [...lock.manual],
    agents: { ...lock.agents },
  };
  for (const entry of entries) {
    if (!entry) continue;
    switch (entry.kind) {
      case 'file-copy':
        next.files[entry.target] = {
          host: entry.host, source: entry.source, hash: entry.hash,
          bytes: entry.bytes, created_file: entry.created_file !== false,
        };
        for (const dir of entry.dirs ?? []) if (!next.dirs.includes(dir)) next.dirs.push(dir);
        break;
      case 'json-merge':
        if (entry.op === 'array-union') {
          upsert(next.rules, (r) => r.file === entry.target && r.pointer === entry.pointer, {
            file: entry.target, pointer: entry.pointer, values: entry.values,
            created_containers: entry.created_containers ?? [],
            created_file: entry.created_file === true,
          });
        } else {
          upsert(next.json_pointers, (p) => p.file === entry.target && p.pointer === entry.pointer, {
            file: entry.target, pointer: entry.pointer, hash: entry.hash,
            created_containers: entry.created_containers ?? [],
            created_file: entry.created_file === true,
          });
        }
        break;
      case 'toml-fence':
      case 'text-fence':
        upsert(next.fences, (f) => f.file === entry.target && f.block === entry.block, {
          file: entry.target, block: entry.block, syntax: entry.syntax,
          hash: entry.hash, created_file: entry.created_file === true,
        });
        break;
      case 'manual':
        upsert(next.manual, (m) => m.file === entry.target && m.block === entry.block, {
          file: entry.target, block: entry.block ?? null,
          remedy: entry.remedy, at: new Date().toISOString(),
        });
        break;
      default:
        break;
    }
  }
  if (agent) next.agents[agent] = { installed_at: new Date().toISOString(), version };
  return next;
}

function upsert(list, match, value) {
  const i = list.findIndex(match);
  if (i === -1) list.push(value);
  else list[i] = value;
}

/** A rule the user removed after we added it is a decline, not a gap to refill. */
export function isDeclined(lock, file, pointer, value) {
  return lock.declined.some((d) => d.file === file && d.pointer === pointer && d.value === value);
}

export function decline(lock, { file, pointer, value, reason }) {
  if (isDeclined(lock, file, pointer, value)) return lock;
  return {
    ...lock,
    declined: [
      ...lock.declined,
      { rule: `${pointer}/${value}`, file, pointer, value, at: new Date().toISOString(), reason },
    ],
  };
}

/** Everything the lock says we own, as a flat list for uninstall. */
export function entries(lock) {
  return [
    ...Object.entries(lock.files).map(([target, v]) => ({ kind: 'file-copy', target, ...v })),
    ...lock.json_pointers.map((p) => ({ kind: 'json-merge', op: 'set', target: p.file, ...p })),
    ...lock.rules.map((r) => ({ kind: 'json-merge', op: 'array-union', target: r.file, ...r })),
    ...lock.fences.map((f) => ({ kind: f.syntax === 'toml' ? 'toml-fence' : 'text-fence', target: f.file, ...f })),
  ];
}
