// Pure merge primitives. No I/O lives here, which is what makes the risky
// part of the installer cheap to test exhaustively.
//
// Three formats, three ownership strategies:
//
//   JSON  — has no comments, so ownership cannot be written into the file.
//           Each change names an RFC 6901 pointer and the value we put there;
//           the lock file records the pointer and a hash of that value. We
//           never inject an "x-managed-by" key: these files are schema-checked
//           by their hosts and an unknown key is noise at best.
//   TOML  — has comments, so a real fence marks our lines and the body is
//           regenerated wholesale. No TOML parser is written; a deliberately
//           narrow line scanner is enough because we only ever replace whole
//           line ranges we ourselves emitted.
//   Text  — HTML-comment fence in Markdown, `#` fence in .gitignore. An
//           existing file without a fence is appended to, never rewritten.

export const FENCE_ID = 'sw-ecosystem-agentic-harness';

// ---------------------------------------------------------------- JSON

/**
 * Parse, and report whether the text carries anything that re-serialising
 * would silently destroy. A JSONC file with comments is not ours to rewrite.
 */
export function parseJsonLoose(text) {
  const hasComments = detectComments(text);
  let value;
  let valid = true;
  try {
    value = JSON.parse(stripBom(text));
  } catch {
    valid = false;
    value = undefined;
  }
  return { value, valid, hasComments };
}

function stripBom(text) {
  return text.startsWith('﻿') ? text.slice(1) : text;
}

/** `//`, `/* *\/` or a trailing comma outside a string literal. */
function detectComments(text) {
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; continue; }
    if (c === '/' && (text[i + 1] === '/' || text[i + 1] === '*')) return true;
    if (c === ',') {
      // A comma followed only by whitespace before a closing bracket is trailing.
      const rest = text.slice(i + 1);
      const m = /^\s*([}\]])/.exec(rest);
      if (m) return true;
    }
  }
  return false;
}

function decodeToken(token) {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

/** RFC 6901 lookup. `{found, value}` — `found` distinguishes absent from null. */
export function getPointer(obj, pointer) {
  if (pointer === '') return { found: true, value: obj };
  const tokens = pointer.split('/').slice(1).map(decodeToken);
  let node = obj;
  for (const token of tokens) {
    if (node === null || typeof node !== 'object') return { found: false, value: undefined };
    if (!Object.prototype.hasOwnProperty.call(node, token)) return { found: false, value: undefined };
    node = node[token];
  }
  return { found: true, value: node };
}

/**
 * Set a pointer, creating intermediate objects as needed. Returns the new root
 * plus the pointers of every container it had to create — uninstall prunes
 * only those, so removal is always narrower than addition.
 *
 * The input is not mutated.
 */
export function setPointer(obj, pointer, value) {
  const tokens = pointer.split('/').slice(1).map(decodeToken);
  const createdContainers = [];
  const root = obj === null || typeof obj !== 'object' || Array.isArray(obj) ? {} : { ...obj };
  let node = root;
  let path = '';
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const token = tokens[i];
    path += `/${token}`;
    const child = node[token];
    if (child === null || typeof child !== 'object' || Array.isArray(child)) {
      if (child === undefined) createdContainers.push(path);
      node[token] = {};
    } else {
      node[token] = { ...child };
    }
    node = node[token];
  }
  const last = tokens[tokens.length - 1];
  node[last] = value;
  return { next: root, createdContainers };
}

/** Remove a pointer, then prune the containers we created, deepest first. */
export function deletePointer(obj, pointer, createdContainers = []) {
  const clone = JSON.parse(JSON.stringify(obj ?? {}));
  const tokens = pointer.split('/').slice(1).map(decodeToken);
  let node = clone;
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const token = tokens[i];
    if (node === null || typeof node !== 'object') return clone;
    node = node[token];
    if (node === undefined) return clone;
  }
  if (node && typeof node === 'object') delete node[tokens[tokens.length - 1]];

  for (const container of [...createdContainers].sort((a, b) => b.length - a.length)) {
    const got = getPointer(clone, container);
    if (!got.found || got.value === null || typeof got.value !== 'object') continue;
    if (Object.keys(got.value).length > 0) continue;
    const parts = container.split('/').slice(1).map(decodeToken);
    let parent = clone;
    let ok = true;
    for (let i = 0; i < parts.length - 1; i += 1) {
      parent = parent?.[parts[i]];
      if (parent === undefined) { ok = false; break; }
    }
    if (ok && parent && typeof parent === 'object') delete parent[parts[parts.length - 1]];
  }
  return clone;
}

/**
 * Union into an array of rule strings. Existing elements are never removed,
 * reordered or rewritten — that is directive 4, and the whole reason a user
 * trusts this thing near their settings file.
 */
export function mergeArrayUnique(existing, additions) {
  const base = Array.isArray(existing) ? [...existing] : [];
  const added = [];
  const alreadyPresent = [];
  for (const value of additions) {
    if (base.includes(value)) alreadyPresent.push(value);
    else { base.push(value); added.push(value); }
  }
  return { next: base, added, alreadyPresent };
}

/** Remove only the values we recorded; anything else in the array survives. */
export function removeArrayValues(existing, values) {
  const base = Array.isArray(existing) ? [...existing] : [];
  const removed = [];
  for (const value of values) {
    const i = base.indexOf(value);
    if (i !== -1) { base.splice(i, 1); removed.push(value); }
  }
  return { next: base, removed };
}

/** Serialise, restoring the formatting captured on read. */
export function serializeJson(value, fmt = {}) {
  const indent = fmt.indent ?? '  ';
  let text = JSON.stringify(value, null, indent);
  if (fmt.trailingNewline !== false) text += '\n';
  return text;
}

/** Sorted-key JSON — for hashing only, so key order never looks like drift. */
export function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
}

// ------------------------------------------------------- fences (TOML/text)

const SYNTAX = {
  toml: {
    open: (block, meta) => `# >>> managed by ${FENCE_ID} block=${block} v=${meta.version}`,
    close: (block) => `# <<< end managed by ${FENCE_ID} block=${block}`,
    warn: `# Do not edit inside this fence — \`${FENCE_ID} apply\` rewrites it.`,
  },
  markdown: {
    open: (block, meta) => `<!-- >>> managed by ${FENCE_ID} block=${block} v=${meta.version} -->`,
    close: (block) => `<!-- <<< end managed by ${FENCE_ID} block=${block} -->`,
    warn: null,
  },
  gitignore: {
    open: (block, meta) => `# >>> managed by ${FENCE_ID} block=${block} v=${meta.version}`,
    close: (block) => `# <<< end managed by ${FENCE_ID} block=${block}`,
    warn: null,
  },
};

function openRe(block) {
  return new RegExp(`(^|\\s)managed by ${FENCE_ID} block=${escapeRe(block)}(\\s|$)`);
}
function closeRe(block) {
  return new RegExp(`(^|\\s)end managed by ${FENCE_ID} block=${escapeRe(block)}(\\s|$)`);
}
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Locate a fence. Returns line indices and the inner body, or null.
 * A close marker is matched before an open one so `end managed by` never
 * reads as an opening line.
 */
export function findFence(text, block) {
  const lines = text.split('\n');
  const open = openRe(block);
  const close = closeRe(block);
  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (close.test(lines[i])) {
      if (start !== -1) {
        return { start, end: i, inner: lines.slice(start + 1, i).join('\n') };
      }
      continue;
    }
    if (start === -1 && open.test(lines[i])) start = i;
  }
  return null;
}

/**
 * Exactly what sits between the two fence markers. `findFence` reads this back,
 * so hashing it — rather than the caller's body — is what makes "has the user
 * edited inside the fence?" a reliable question.
 */
export function fenceInner(body, syntax = 'toml') {
  const s = SYNTAX[syntax];
  if (!s) throw new Error(`unknown fence syntax: ${syntax}`);
  return s.warn ? `${s.warn}\n${body}` : body;
}

/** Create or replace a fence. Everything outside it stays byte-identical. */
export function upsertFence(text, block, body, meta = {}, syntax = 'toml') {
  const s = SYNTAX[syntax];
  if (!s) throw new Error(`unknown fence syntax: ${syntax}`);
  const version = meta.version ?? '0.0.0';
  const fence = [
    s.open(block, { version }),
    ...fenceInner(body, syntax).split('\n'),
    s.close(block),
  ].join('\n');

  const existing = findFence(text ?? '', block);
  if (existing) {
    const lines = (text ?? '').split('\n');
    const next = [...lines.slice(0, existing.start), ...fence.split('\n'), ...lines.slice(existing.end + 1)].join('\n');
    return { next, changed: next !== text, created: false };
  }
  if (!text || text.trim() === '') return { next: `${fence}\n`, changed: true, created: true };
  const sep = text.endsWith('\n\n') ? '' : text.endsWith('\n') ? '\n' : '\n\n';
  const next = `${text}${sep}${fence}\n`;
  return { next, changed: true, created: false };
}

/**
 * Remove a fence, restoring the file to what it was before we wrote it.
 *
 * Exact, with one documented exception: a file that had no final newline gets
 * one when we append to it, and nothing in the file records that it was
 * missing, so it keeps the newline afterwards. Adding a final newline to a
 * text file is a normalisation, not a loss.
 */
export function removeFence(text, block) {
  const existing = findFence(text ?? '', block);
  if (!existing) return { next: text, changed: false };
  const lines = (text ?? '').split('\n');
  const before = lines.slice(0, existing.start);
  const after = lines.slice(existing.end + 1);
  // The blank line we inserted when appending goes with the fence.
  while (before.length && before[before.length - 1].trim() === '' && after.length === 0) before.pop();
  while (before.length && after.length && before[before.length - 1].trim() === '' && after[0].trim() === '') before.pop();
  const next = [...before, ...after].join('\n');
  return { next, changed: true };
}

/**
 * Whether a TOML table header exists outside any of our fences. TOML forbids
 * duplicate headers, so one of these means we must not emit ours.
 */
export function tomlTableExists(text, header, ourBlocks = []) {
  if (!text) return false;
  const lines = text.split('\n');
  const masked = new Set();
  for (const block of ourBlocks) {
    const fence = findFence(text, block);
    if (!fence) continue;
    for (let i = fence.start; i <= fence.end; i += 1) masked.add(i);
  }
  const target = header.trim();
  for (let i = 0; i < lines.length; i += 1) {
    if (masked.has(i)) continue;
    const line = lines[i];
    // Table headers sit at column 0. Anything indented is inside a value.
    if (/^\[/.test(line) && line.split('#')[0].trim() === target) return true;
  }
  return false;
}

/** A TOML basic string. Values are pre-resolved; no `${VAR}` is ever emitted. */
export function tomlValue(value) {
  if (Array.isArray(value)) return `[${value.map(tomlValue).join(', ')}]`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(String(value));
}

/** Render `[header]` plus flat key/values. */
export function renderTomlTable(header, kv) {
  const lines = [header];
  for (const [key, value] of Object.entries(kv)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const inner = Object.entries(value)
        .map(([k, v]) => `${k} = ${tomlValue(v)}`)
        .join(', ');
      lines.push(`${key} = { ${inner} }`);
    } else {
      lines.push(`${key} = ${tomlValue(value)}`);
    }
  }
  return lines.join('\n');
}
