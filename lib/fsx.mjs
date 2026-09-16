// Filesystem primitives for the installer.
//
// Two rules hold everywhere in this file:
//   1. Every write is atomic — temp file in the *target* directory, then
//      rename, so a crash mid-write can never truncate a user's config.
//   2. Every path that leaves this module towards output or the lock file is
//      POSIX-separated and relative to the install root, so a lock written on
//      Windows is readable on Linux and vice versa.

import { createHash } from 'node:crypto';
import {
  accessSync, constants, copyFileSync, existsSync, mkdirSync, readFileSync,
  readdirSync, renameSync, rmdirSync, statSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { join, posix, relative, resolve, sep, dirname } from 'node:path';

export function sha256(data) {
  return `sha256:${createHash('sha256').update(data).digest('hex')}`;
}

/** Read bytes, or null when the file is absent. Never throws on ENOENT. */
export function readMaybe(abs) {
  try {
    return readFileSync(abs);
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'EISDIR') return null;
    throw e;
  }
}

/**
 * Read text and remember how it was formatted, so a merge can write it back
 * the way the user had it. A config we reformat is a diff the user did not ask
 * for.
 */
export function readTextMaybe(abs) {
  const buf = readMaybe(abs);
  if (buf === null) return null;
  let text = buf.toString('utf8');
  const bom = text.startsWith('﻿');
  if (bom) text = text.slice(1);
  const crlf = /\r\n/.test(text);
  const indentMatch = /\n([ \t]+)\S/.exec(text);
  return {
    text,
    bom,
    eol: crlf ? '\r\n' : '\n',
    indent: indentMatch ? indentMatch[1] : '  ',
    trailingNewline: text.endsWith('\n'),
  };
}

/** Restore the EOL style captured on read. */
export function restoreEol(text, eol) {
  const lf = text.replace(/\r\n/g, '\n');
  return eol === '\r\n' ? lf.replace(/\n/g, '\r\n') : lf;
}

export function ensureDir(abs) {
  mkdirSync(abs, { recursive: true });
}

/**
 * Write atomically. The temp file goes in the target's own directory so the
 * rename is same-volume; an EXDEV still falls back to copy+unlink.
 *
 * Windows throws EPERM/EBUSY when an editor or antivirus briefly holds the
 * target, which is common rather than exceptional, so the rename is retried
 * with backoff before the action is given up on.
 */
export function writeAtomic(abs, data, { eol = '\n', bom = false } = {}) {
  const dir = dirname(abs);
  ensureDir(dir);
  let payload = typeof data === 'string' ? restoreEol(data, eol) : data;
  if (typeof payload === 'string' && bom) payload = `﻿${payload}`;
  const tmp = join(dir, `.${posix.basename(abs.split(sep).join('/'))}.${process.pid}.${Math.random().toString(36).slice(2, 8)}.tmp`);
  writeFileSync(tmp, payload);
  const delays = [0, 20, 40, 80, 160, 320];
  for (let i = 0; i < delays.length; i += 1) {
    try {
      renameSync(tmp, abs);
      return;
    } catch (e) {
      if (e.code === 'EXDEV') {
        copyFileSync(tmp, abs);
        try { unlinkSync(tmp); } catch { /* the copy landed; the temp is noise */ }
        return;
      }
      const retriable = e.code === 'EPERM' || e.code === 'EBUSY' || e.code === 'EACCES';
      if (!retriable || i === delays.length - 1) {
        try { unlinkSync(tmp); } catch { /* best effort */ }
        throw e;
      }
      sleep(delays[i + 1]);
    }
  }
}

/** Blocking sleep — the retry loop must not be async, callers are sync. */
function sleep(ms) {
  if (ms <= 0) return;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function removeFile(abs) {
  try {
    unlinkSync(abs);
    return true;
  } catch (e) {
    if (e.code === 'ENOENT') return false;
    throw e;
  }
}

/** Remove a directory only when it is empty. Returns whether it went. */
export function removeDirIfEmpty(abs) {
  try {
    if (readdirSync(abs).length > 0) return false;
    rmdirSync(abs);
    return true;
  } catch (e) {
    if (e.code === 'ENOENT') return false;
    throw e;
  }
}

/** Every file under a root, as sorted POSIX paths relative to it. */
export function walk(absRoot) {
  const out = [];
  const visit = (dir, prefix) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      if (e.code === 'ENOENT') return;
      throw e;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const child = join(dir, entry.name);
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) visit(child, rel);
      else out.push(rel);
    }
  };
  visit(absRoot, '');
  return out;
}

/** Root-relative, POSIX-separated — the form used in output and the lock. */
export function rel(root, abs) {
  return relative(root, abs).split(sep).join('/');
}

/** The inverse: a POSIX lock key back to a platform path. */
export function abs(root, relPosix) {
  return resolve(root, ...relPosix.split('/'));
}

export function isDir(abs_) {
  try {
    return statSync(abs_).isDirectory();
  } catch {
    return false;
  }
}

export function exists(abs_) {
  return existsSync(abs_);
}

/** Whether we could write here — checked on the nearest existing ancestor. */
export function isWritable(abs_) {
  let probe = abs_;
  for (let i = 0; i < 64; i += 1) {
    if (existsSync(probe)) {
      try {
        accessSync(probe, constants.W_OK);
        return true;
      } catch {
        return false;
      }
    }
    const parent = dirname(probe);
    if (parent === probe) return false;
    probe = parent;
  }
  return false;
}
