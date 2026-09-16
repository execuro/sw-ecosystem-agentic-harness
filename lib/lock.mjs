// The lock file: `.sw-ai-sdk/harness.lock.json` in the host repository.
//
// This is the ownership record. JSON config files have no comments, so nothing
// in `.mcp.json` can tell us who wrote an entry — the lock does, by content
// hash. It also records what we had to create (files, containers) so that
// removal is always narrower than addition, and which rules the user declined
// so we never ask twice.
//
// It is gitignored by default: it describes one machine's install, not the
// project.

import { LOCK_FILE, SUPPORTED_CONTENT, CONTENT_VERSION, PKG_NAME, PKG_VERSION } from './content.mjs';
import { abs, readTextMaybe, writeAtomic } from './fsx.mjs';

export class LockVersionError extends Error {}

export function lockPath(root) {
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
    hosts: {},
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
  const found = readTextMaybe(lockPath(root));
  if (found === null) return null;
  let lock;
  try {
    lock = JSON.parse(found.text);
  } catch {
    throw new LockVersionError(
      `${LOCK_FILE} is not valid JSON. Move it aside and re-run apply to rebuild it.`,
    );
  }
  if (!SUPPORTED_CONTENT.includes(lock.content_version)) {
    throw new LockVersionError(
      `${LOCK_FILE} records content_version ${lock.content_version}, which this ` +
        `version of ${PKG_NAME} (${PKG_VERSION}) does not understand.`,
    );
  }
  return { ...empty(scope), ...lock };
}

export function write(root, lock) {
  const next = { ...lock, updated_at: new Date().toISOString() };
  if (!next.installed_at) next.installed_at = next.updated_at;
  writeAtomic(lockPath(root), `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

/** Fold a batch of executed entries into the lock. */
export function record(lock, entries, { host, version = PKG_VERSION } = {}) {
  const next = {
    ...lock,
    files: { ...lock.files },
    dirs: [...lock.dirs],
    json_pointers: [...lock.json_pointers],
    rules: [...lock.rules],
    fences: [...lock.fences],
    manual: [...lock.manual],
    hosts: { ...lock.hosts },
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
  if (host) next.hosts[host] = { installed_at: new Date().toISOString(), version };
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
