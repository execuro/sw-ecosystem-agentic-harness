// Guard against the YAML-frontmatter breakage that shipped in every
// skills/*/SKILL.md and agents/*.md at once (six files: an unquoted
// argument-hint starting with `[` read as a flow sequence, and a
// description containing an unquoted ": " read as a nested mapping key).
// `claude plugin validate --strict` parses frontmatter with a real YAML
// parser and drops the whole block silently on a parse error; this
// package's own `scripts/frontmatter.mjs` does not — it is a flat
// `key: value` line reader with no YAML semantics, so it happily accepts
// the very lines that break the real host. This test reuses that reader
// for line-splitting (so a change to its shape is felt here too) and adds
// the missing strict checks on top: quoting rules for single/double
// quoted scalars, and a deny-list of YAML flow/indicator characters and
// the "colon-space" mapping separator inside plain scalars.
//
// This is not a general YAML validator. It accepts exactly the two shapes
// this package's frontmatter legitimately uses — a quoted scalar
// ('...'/"...") or a plain scalar free of YAML indicators in a forbidden
// position — and rejects everything else loudly.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { splitFrontmatter, parseFrontmatter } from '../scripts/frontmatter.mjs';

const PKG_ROOT = join(import.meta.dirname, '..');

// Characters that YAML treats as indicators when they open a plain scalar.
// A value starting with one of these is a flow sequence/mapping, an alias,
// an anchor, a tag, a block scalar, a comment or a reserved indicator —
// never a valid unquoted plain scalar in this frontmatter.
const FORBIDDEN_PLAIN_START = ['[', '{', '|', '>', '&', '*', '!', '%', '@', '`', '#', '?', ','];

/**
 * Validate one raw `key: value` frontmatter line's value against the
 * quoting/indicator rules that broke in production. Returns null if the
 * value is fine, or a reason string naming exactly what is wrong.
 */
function checkValue(value) {
  if (value === '') return null; // absent value, e.g. a bare key — not this bug class

  if (value[0] === "'" && value.at(-1) === "'" && value.length >= 2) {
    // Single-quoted scalar: only `''` may appear as an escape for `'`.
    // Strip valid `''` pairs; a lone `'` left over means an unescaped quote
    // or a quote that does not actually close the scalar.
    const inner = value.slice(1, -1);
    const stripped = inner.replace(/''/g, '');
    if (stripped.includes("'")) return "single-quoted scalar has an unescaped ' (should be '')";
    return null;
  }

  if (value[0] === '"' && value.at(-1) === '"' && value.length >= 2) {
    // Double-quoted scalar: every internal `"` must be escaped as `\"`.
    const inner = value.slice(1, -1);
    if (/(^|[^\\])"/.test(inner)) return 'double-quoted scalar has an unescaped "';
    return null;
  }

  // Plain (unquoted) scalar.
  if (FORBIDDEN_PLAIN_START.includes(value[0])) {
    return `plain scalar starts with the YAML indicator '${value[0]}' — quote it`;
  }
  if (value.includes(': ')) {
    return "plain scalar contains ': ' (colon-space), which YAML reads as a mapping separator — quote it";
  }
  if (value.includes(' #')) {
    return "plain scalar contains ' #', which YAML reads as a comment — quote it";
  }
  return null;
}

/** Collect every `file — key — why` offence across one frontmatter block. */
function checkFrontmatter(file, raw) {
  const offences = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.trim() === '') continue;
    const m = /^([A-Za-z_][\w-]*):\s?(.*)$/.exec(line);
    if (!m) {
      offences.push(`${file} — (line) — not a flat key: value pair: ${line}`);
      continue;
    }
    const [, key, rawValue] = m;
    const why = checkValue(rawValue.trim());
    if (why) offences.push(`${file} — ${key} — ${why}`);
  }
  return offences;
}

function listSkillFiles() {
  return readdirSync(join(PKG_ROOT, 'skills'))
    .filter((f) => statSync(join(PKG_ROOT, 'skills', f)).isDirectory())
    .sort()
    .map((dir) => ({ label: `skills/${dir}/SKILL.md`, path: join(PKG_ROOT, 'skills', dir, 'SKILL.md'), name: dir }));
}

function listAgentFiles() {
  return readdirSync(join(PKG_ROOT, 'agents'))
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => ({ label: `agents/${f}`, path: join(PKG_ROOT, 'agents', f), name: f.replace(/\.md$/, '') }));
}

test('every skill and agent frontmatter block is strictly-valid YAML-subset', () => {
  const offences = [];
  for (const { label, path } of [...listSkillFiles(), ...listAgentFiles()]) {
    const raw = readFileSync(path, 'utf8');
    const { frontmatter } = splitFrontmatter(raw, label);
    offences.push(...checkFrontmatter(label, frontmatter));
  }
  assert.deepEqual(offences, [], `frontmatter offences:\n${offences.join('\n')}`);
});

test('every skill and agent frontmatter has a name matching its file, and a non-empty description', () => {
  const failures = [];
  for (const { label, path, name } of [...listSkillFiles(), ...listAgentFiles()]) {
    const raw = readFileSync(path, 'utf8');
    const { frontmatter } = splitFrontmatter(raw, label);
    const fm = parseFrontmatter(frontmatter, label);
    if (fm.name !== name) failures.push(`${label} — name — "${fm.name}" does not match "${name}"`);
    if (!fm.description || fm.description.trim() === '') failures.push(`${label} — description — missing or empty`);
  }
  assert.deepEqual(failures, [], `frontmatter offences:\n${failures.join('\n')}`);
});

test('the strict checker rejects an unquoted flow-sequence argument-hint', () => {
  const offences = checkFrontmatter('fixture', 'argument-hint: [a | b] [--editor]');
  assert.equal(offences.length, 1);
  assert.match(offences[0], /starts with the YAML indicator '\['/);
});

test('the strict checker rejects an unquoted colon-space inside a description', () => {
  const offences = checkFrontmatter('fixture', 'description: no judgment: every value');
  assert.equal(offences.length, 1);
  assert.match(offences[0], /colon-space/);
});

test('the strict checker accepts the single-quoted argument-hint actually shipped, and the em-dash description restructure', () => {
  const good = [
    "argument-hint: '[specs/NNNN-slug.md | specs/NNNN-slug-spec.md] [--editor]'",
    'description: Deterministic, no judgment — every value it writes comes from a named input file.',
  ];
  for (const line of good) {
    assert.deepEqual(checkFrontmatter('fixture', line), [], line);
  }
});

test('the strict checker accepts a double-quoted scalar with escaped internal quotes', () => {
  const line = 'description: "Triggers: \\"add an entity\\", \\"create an API endpoint\\"."';
  assert.deepEqual(checkFrontmatter('fixture', line), [], line);
});
