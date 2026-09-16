// The Action engine. `plan` previews, `apply` previews then executes, and
// `uninstall` reverts from the lock — one code path, three verbs.
//
// `preview` is the only place `state`, `prior` and `hash` are decided, and it
// never writes. That is what makes `plan` provably read-only and what keeps
// `plan` and `apply` from ever disagreeing about what is about to happen.
//
// The safety rule throughout: refuse, report, continue. A target we do not own
// is never overwritten and never aborts the run — it becomes a `conflict` or
// `manual` action whose `remedy` reaches the user in `help`.

import { dirname } from 'node:path';
import {
  abs, ensureDir, readMaybe, readTextMaybe, removeDirIfEmpty, removeFile, rel, sha256, writeAtomic,
} from './fsx.mjs';
import {
  canonical, deletePointer, fenceInner, findFence, getPointer, mergeArrayUnique, parseJsonLoose,
  removeArrayValues, removeFence, serializeJson, setPointer, upsertFence,
} from './merge.mjs';
import { PKG_ROOT } from './content.mjs';
import { isDeclined } from './lock.mjs';
import { readFileSync } from 'node:fs';

/** Preview one action against the filesystem. Reads only. */
export function preview(action, ctx) {
  switch (action.kind) {
    case 'file-copy': return previewFile(action, ctx);
    case 'json-merge': return previewJson(action, ctx);
    case 'toml-fence':
    case 'text-fence': return previewFence(action, ctx);
    case 'manual': return { ...action, state: 'manual' };
    default: throw new Error(`unknown action kind: ${action.kind}`);
  }
}

// ------------------------------------------------------------- file-copy

function previewFile(action, ctx) {
  const shipped = readFileSync(`${PKG_ROOT}/${action.source}`);
  const hash = sha256(shipped);
  const target = abs(ctx.root, action.target);
  const current = readMaybe(target);
  const locked = ctx.lock?.files?.[action.target] ?? null;
  const base = { ...action, hash, bytes: shipped.length };

  if (current === null) {
    return { ...base, prior: null, state: 'create', created_file: true,
      detail: locked ? 'reinstalling a file that was deleted' : 'new file' };
  }
  const priorHash = sha256(current);
  if (priorHash === hash) {
    // Byte-identical to what we would write. Materially ours; adopt it.
    return { ...base, prior: priorHash, state: 'unchanged', created_file: locked?.created_file ?? false,
      detail: locked ? 'up to date' : 'already identical to the shipped file — adopted' };
  }
  if (!locked) {
    return { ...base, prior: priorHash, state: 'conflict',
      reason: 'a different file already exists here and was not installed by this CLI',
      remedy: `move or delete ${action.target}, then re-run apply` };
  }
  if (locked.hash !== priorHash) {
    return { ...base, prior: priorHash, state: 'drift',
      reason: 'edited after install', remedy: `delete ${action.target} to take the shipped version` };
  }
  return { ...base, prior: priorHash, state: 'update', created_file: locked.created_file,
    detail: 'shipped content changed' };
}

// ------------------------------------------------------------- json-merge

function previewJson(action, ctx) {
  const target = abs(ctx.root, action.target);
  const found = readTextMaybe(target);
  const createdFile = found === null;
  const fmt = found ?? { indent: '  ', eol: '\n', bom: false, trailingNewline: true };
  const base = { ...action, fmt, created_file: createdFile };

  let doc = {};
  if (found !== null) {
    const parsed = parseJsonLoose(found.text);
    // JSONC first: a file with comments is not malformed, it is a format
    // `JSON.parse` does not read. Checking validity first would tell the user
    // to "fix" a perfectly good `.vscode/mcp.json`.
    if (parsed.hasComments) {
      // Re-serialising would silently delete the user's comments. Not ours to do.
      return { ...base, kind: 'manual', prior: null, state: 'manual',
        reason: 'the existing file uses JSONC (comments or trailing commas), which a rewrite would destroy',
        remedy: renderManualJson(action) };
    }
    if (!parsed.valid) {
      return { ...base, prior: null, state: 'conflict',
        reason: 'the existing file is not valid JSON',
        remedy: `fix or move ${action.target}, then re-run apply` };
    }
    doc = parsed.value ?? {};
    if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) doc = {};
  }

  if (action.op === 'array-union') return previewArray(base, doc, ctx);
  return previewSet(base, doc, ctx);
}

function previewSet(action, doc, ctx) {
  const hash = sha256(canonical(action.value));
  const got = getPointer(doc, action.pointer);
  const locked = ctx.lock?.json_pointers?.find(
    (p) => p.file === action.target && p.pointer === action.pointer,
  );
  const { next, createdContainers } = setPointer(doc, action.pointer, action.value);
  const base = { ...action, hash, doc: next, created_containers: createdContainers };

  if (!got.found) return { ...base, prior: null, state: 'create', detail: `sets ${action.pointer}` };
  const priorHash = sha256(canonical(got.value));
  if (priorHash === hash) {
    return { ...base, prior: priorHash, state: 'unchanged',
      created_containers: locked?.created_containers ?? [],
      detail: locked ? 'up to date' : 'already set to the shipped value — adopted' };
  }
  if (!locked) {
    return { ...base, prior: priorHash, state: 'conflict',
      reason: `${action.pointer} already has a different value and was not set by this CLI`,
      remedy: `remove or rename the existing ${action.pointer} entry, then re-run apply` };
  }
  if (locked.hash !== priorHash) {
    return { ...base, prior: priorHash, state: 'drift',
      created_containers: locked.created_containers ?? [],
      reason: 'changed after install',
      remedy: `revert your change at ${action.pointer}, or leave it — apply will not touch it` };
  }
  return { ...base, prior: priorHash, state: 'update',
    created_containers: locked.created_containers ?? [], detail: 'shipped value changed' };
}

function previewArray(action, doc, ctx) {
  const got = getPointer(doc, action.pointer);
  const existing = Array.isArray(got.value) ? got.value : [];
  const lock = ctx.lock;

  // A rule we recorded that the user has since removed is a decline. Never
  // re-offer it — that is directive 4, and the reason this is trusted near a
  // settings file.
  const recorded = lock?.rules?.find(
    (r) => r.file === action.target && r.pointer === action.pointer,
  );
  const skipped = [];
  const wanted = [];
  for (const value of action.values) {
    if (lock && isDeclined(lock, action.target, action.pointer, value)) { skipped.push(value); continue; }
    if (recorded?.values?.includes(value) && !existing.includes(value)) { skipped.push(value); continue; }
    wanted.push(value);
  }

  const merged = mergeArrayUnique(existing, wanted);
  const { next, createdContainers } = setPointer(doc, action.pointer, merged.next);
  const values = [...new Set([...(recorded?.values ?? []), ...merged.added])].filter(
    (v) => !skipped.includes(v),
  );
  const base = {
    ...action, doc: next, values,
    created_containers: got.found ? (recorded?.created_containers ?? []) : createdContainers,
    added: merged.added, kept: existing, skipped,
    hash: sha256(canonical(merged.added)),
    // Values the user deleted after we added them, for the caller to record.
    newly_declined: (recorded?.values ?? []).filter(
      (v) => !existing.includes(v) && !lock?.declined?.some((d) => d.value === v),
    ),
  };

  if (merged.added.length === 0) {
    return { ...base, prior: null, state: 'unchanged',
      detail: skipped.length ? `${skipped.length} rule(s) declined earlier, not re-offered` : 'all rules already present' };
  }
  return { ...base, prior: null, state: got.found ? 'update' : 'create',
    detail: `adds ${merged.added.length} rule(s), keeps ${existing.length} existing` +
      (skipped.length ? `, skips ${skipped.length} declined` : '') };
}

function renderManualJson(action) {
  if (action.op === 'array-union') {
    return `add these entries to "${action.pointer}" in ${action.target}: ${action.values.map((v) => JSON.stringify(v)).join(', ')}`;
  }
  return `set "${action.pointer}" in ${action.target} to ${JSON.stringify(action.value)}`;
}

// ------------------------------------------------------------- fences

function previewFence(action, ctx) {
  const target = abs(ctx.root, action.target);
  const found = readTextMaybe(target);
  const createdFile = found === null;
  // Hash what will actually sit inside the fence, warning line included, so it
  // can be compared with what `findFence` reads back.
  const hash = sha256(fenceInner(action.body, action.syntax));
  const locked = ctx.lock?.fences?.find(
    (f) => f.file === action.target && f.block === action.block,
  );
  const base = { ...action, hash, fmt: found ?? { eol: '\n', bom: false }, created_file: createdFile };

  if (action.conflict) {
    return { ...base, kind: 'manual', state: 'manual',
      reason: action.conflict.reason, remedy: action.conflict.remedy };
  }

  const existing = found ? findFence(found.text, action.block) : null;
  if (!existing) {
    return { ...base, prior: null, state: 'create',
      detail: createdFile ? 'creates the file with a managed block' : 'appends a managed block' };
  }
  const priorHash = sha256(existing.inner);
  if (priorHash === hash) return { ...base, prior: priorHash, state: 'unchanged', created_file: locked?.created_file ?? false, detail: 'up to date' };
  if (locked && locked.hash !== priorHash) {
    return { ...base, prior: priorHash, state: 'drift', created_file: locked.created_file,
      reason: 'the managed block was hand-edited',
      remedy: `revert your edits inside the ${action.block} block in ${action.target}, or leave them — apply will not touch it` };
  }
  return { ...base, prior: priorHash, state: 'update', created_file: locked?.created_file ?? false,
    detail: 'shipped block changed' };
}

// ------------------------------------------------------------- execute

const WRITABLE = new Set(['create', 'update']);

export function isWritableState(state) {
  return WRITABLE.has(state);
}

/** Perform a previewed action. Returns the lock entry it produced. */
export function execute(action, ctx) {
  const target = abs(ctx.root, action.target);
  switch (action.kind) {
    case 'file-copy': {
      const shipped = readFileSync(`${PKG_ROOT}/${action.source}`);
      ensureDir(dirname(target));
      writeAtomic(target, shipped);
      const dirs = ancestorDirs(ctx.root, action.target);
      return { kind: 'file-copy', host: action.host, target: action.target, source: action.source,
        hash: action.hash, bytes: action.bytes, created_file: action.created_file !== false, dirs };
    }
    case 'json-merge': {
      // Recompute from what is on disk right now rather than writing the
      // snapshot `preview` took. Several actions can target one file — the two
      // MCP servers in `.mcp.json` are the obvious pair — and each preview saw
      // the file before any of them had run, so writing those snapshots would
      // let the last action silently drop the earlier ones' work.
      const found = readTextMaybe(target);
      const fmt = found ?? action.fmt ?? { indent: '  ', eol: '\n', bom: false, trailingNewline: true };
      let doc = {};
      if (found !== null) {
        const parsed = parseJsonLoose(found.text);
        if (!parsed.valid) throw new Error(`${action.target} is not valid JSON`);
        doc = parsed.value ?? {};
        if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) doc = {};
      }
      let next;
      let createdContainers;
      if (action.op === 'array-union') {
        const got = getPointer(doc, action.pointer);
        const merged = mergeArrayUnique(got.value, action.added ?? []);
        ({ next, createdContainers } = setPointer(doc, action.pointer, merged.next));
      } else {
        ({ next, createdContainers } = setPointer(doc, action.pointer, action.value));
      }
      writeAtomic(target, serializeJson(next, fmt), { eol: fmt.eol ?? '\n', bom: fmt.bom });
      return { kind: 'json-merge', host: action.host, target: action.target, pointer: action.pointer,
        op: action.op, hash: action.hash, values: action.values,
        created_containers: (action.created_containers ?? []).length
          ? action.created_containers : createdContainers,
        created_file: action.created_file === true };
    }
    case 'toml-fence':
    case 'text-fence': {
      // Same hazard as JSON: `.codex/config.toml` carries two managed blocks,
      // so re-read rather than build on the snapshot `preview` took.
      const found = readTextMaybe(target);
      const { next } = upsertFence(found?.text ?? '', action.block, action.body,
        { version: ctx.version }, action.syntax);
      writeAtomic(target, next, { eol: found?.eol ?? '\n', bom: found?.bom });
      return { kind: action.kind, host: action.host, target: action.target, block: action.block,
        syntax: action.syntax, hash: action.hash, created_file: action.created_file === true };
    }
    case 'manual':
      return { kind: 'manual', host: action.host, target: action.target,
        block: action.block ?? null, remedy: action.remedy };
    default:
      throw new Error(`unknown action kind: ${action.kind}`);
  }
}

function ancestorDirs(root, targetRel) {
  const parts = targetRel.split('/');
  const dirs = [];
  for (let i = 1; i < parts.length; i += 1) dirs.push(parts.slice(0, i).join('/'));
  return dirs;
}

// ------------------------------------------------------------- revert

/**
 * Undo one lock entry. Total on the lock — uninstall never needs the original
 * Action, which is what lets it work against an install from an older run.
 *
 * Anything hand-edited is kept and reported, never overwritten.
 */
export function revert(entry, ctx) {
  const target = abs(ctx.root, entry.target);
  switch (entry.kind) {
    case 'file-copy': {
      const current = readMaybe(target);
      if (current === null) return { state: 'missing', target: entry.target, reason: 'already gone' };
      if (sha256(current) !== entry.hash) {
        return { state: 'kept', target: entry.target, reason: 'edited after install (hash mismatch)' };
      }
      if (!entry.created_file) return { state: 'kept', target: entry.target, reason: 'the file existed before install' };
      removeFile(target);
      return { state: 'removed', target: entry.target };
    }
    case 'json-merge': {
      const found = readTextMaybe(target);
      if (found === null) return { state: 'missing', target: entry.target, reason: 'already gone' };
      const parsed = parseJsonLoose(found.text);
      if (!parsed.valid) return { state: 'kept', target: entry.target, reason: 'the file is no longer valid JSON' };
      if (parsed.hasComments) return { state: 'kept', target: entry.target, reason: 'the file now uses JSONC; a rewrite would destroy comments' };
      const doc = parsed.value ?? {};

      if (entry.op === 'array-union') {
        const got = getPointer(doc, entry.pointer);
        const { next: arr, removed } = removeArrayValues(got.value, entry.values ?? []);
        if (removed.length === 0) return { state: 'missing', target: entry.target, reason: 'our rules are already gone' };
        let doc2 = setPointer(doc, entry.pointer, arr).next;
        if (arr.length === 0 && (entry.created_containers ?? []).length) {
          doc2 = deletePointer(doc2, entry.pointer, entry.created_containers);
        }
        if (isEmptyDoc(doc2) && entry.created_file) { removeFile(target); return { state: 'removed', target: entry.target }; }
        writeAtomic(target, serializeJson(doc2, found), { eol: found.eol, bom: found.bom });
        return { state: 'reverted', target: entry.target, removed };
      }

      const got = getPointer(doc, entry.pointer);
      if (!got.found) return { state: 'missing', target: entry.target, reason: 'our entry is already gone' };
      if (sha256(canonical(got.value)) !== entry.hash) {
        return { state: 'kept', target: entry.target, reason: 'changed after install' };
      }
      const doc2 = deletePointer(doc, entry.pointer, entry.created_containers ?? []);
      if (isEmptyDoc(doc2) && entry.created_file) { removeFile(target); return { state: 'removed', target: entry.target }; }
      writeAtomic(target, serializeJson(doc2, found), { eol: found.eol, bom: found.bom });
      return { state: 'reverted', target: entry.target };
    }
    case 'toml-fence':
    case 'text-fence': {
      const found = readTextMaybe(target);
      if (found === null) return { state: 'missing', target: entry.target, reason: 'already gone' };
      const fence = findFence(found.text, entry.block);
      if (!fence) return { state: 'missing', target: entry.target, reason: 'our block is already gone' };
      if (sha256(fence.inner) !== entry.hash) {
        return { state: 'kept', target: entry.target, reason: 'content inside the managed fence was hand-edited' };
      }
      const { next } = removeFence(found.text, entry.block);
      if (next.trim() === '' && entry.created_file) { removeFile(target); return { state: 'removed', target: entry.target }; }
      writeAtomic(target, next, { eol: found.eol, bom: found.bom });
      return { state: 'reverted', target: entry.target };
    }
    default:
      return { state: 'kept', target: entry.target, reason: `unknown lock entry kind ${entry.kind}` };
  }
}

function isEmptyDoc(doc) {
  return doc !== null && typeof doc === 'object' && Object.keys(doc).length === 0;
}

/** Prune directories we created, deepest first, stopping at any that is used. */
export function pruneDirs(dirs, ctx) {
  const removed = [];
  for (const dir of [...new Set(dirs)].sort((a, b) => b.length - a.length)) {
    // A host's own marker directory (`.claude`, `.codex`, …) is the user's,
    // not ours — leaving it empty is tidier than deleting something they made.
    if (!dir.includes('/')) continue;
    try {
      if (removeDirIfEmpty(abs(ctx.root, dir))) removed.push(dir);
    } catch {
      // A directory we cannot tidy is cosmetic, never a reason to fail an
      // uninstall that has already removed the files.
    }
  }
  return removed;
}

/**
 * Shared targets (`.mcp.json`, `AGENTS.md`) are produced once by the plan
 * builder and claimed by several hosts. Dedupe by id so `apply` cannot write
 * the same file twice with different content.
 */
export function dedupe(actions) {
  const byId = new Map();
  for (const action of actions) byId.set(action.id, action);
  return [...byId.values()];
}

export { rel };
