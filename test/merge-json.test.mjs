// The JSON merge primitives. Pure functions, so this is where the hostile
// inputs live: malformed files, JSONC, odd roots, formatting to preserve.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canonical, deletePointer, getPointer, mergeArrayUnique, parseJsonLoose,
  removeArrayValues, serializeJson, setPointer,
} from '../lib/merge.mjs';

test('parseJsonLoose accepts well-formed JSON', () => {
  const r = parseJsonLoose('{"a":1}');
  assert.equal(r.valid, true);
  assert.equal(r.hasComments, false);
  assert.deepEqual(r.value, { a: 1 });
});

test('parseJsonLoose reports invalid JSON rather than throwing', () => {
  for (const bad of ['{', '{"a":1,}', '{a:1}', '']) {
    const r = parseJsonLoose(bad);
    assert.equal(r.valid, false, `expected ${JSON.stringify(bad)} to be invalid`);
  }
});

test('parseJsonLoose flags JSONC so it is never rewritten', () => {
  assert.equal(parseJsonLoose('{\n  // a note\n  "a": 1\n}').hasComments, true);
  assert.equal(parseJsonLoose('{\n  /* block */ "a": 1\n}').hasComments, true);
  assert.equal(parseJsonLoose('{"a": [1, 2,]}').hasComments, true);
});

test('a // inside a string is not a comment', () => {
  assert.equal(parseJsonLoose('{"url":"https://example.com"}').hasComments, false);
});

test('scalar and array roots are tolerated', () => {
  for (const text of ['null', '[]', '"str"', '42']) {
    assert.equal(parseJsonLoose(text).valid, true);
  }
});

test('getPointer distinguishes absent from null', () => {
  const doc = { a: { b: null } };
  assert.deepEqual(getPointer(doc, '/a/b'), { found: true, value: null });
  assert.equal(getPointer(doc, '/a/c').found, false);
  assert.equal(getPointer(doc, '/x/y').found, false);
});

test('setPointer does not mutate its input', () => {
  const doc = Object.freeze({ a: Object.freeze({ b: 1 }) });
  const { next } = setPointer(doc, '/a/c', 2);
  assert.deepEqual(doc, { a: { b: 1 } });
  assert.deepEqual(next, { a: { b: 1, c: 2 } });
});

test('setPointer records only the containers it had to create', () => {
  const fresh = setPointer({}, '/sandbox/network/allowLocalBinding', true);
  assert.deepEqual(fresh.createdContainers, ['/sandbox', '/sandbox/network']);

  const partial = setPointer({ sandbox: {} }, '/sandbox/network/allowLocalBinding', true);
  assert.deepEqual(partial.createdContainers, ['/sandbox/network']);
});

test('deletePointer prunes only the containers we created', () => {
  const { next, createdContainers } = setPointer({}, '/a/b/c', 1);
  assert.deepEqual(deletePointer(next, '/a/b/c', createdContainers), {});

  const withSibling = setPointer({ a: { keep: 1 } }, '/a/b/c', 1);
  const after = deletePointer(withSibling.next, '/a/b/c', withSibling.createdContainers);
  assert.deepEqual(after, { a: { keep: 1 } });
});

test('mergeArrayUnique appends and never reorders or removes', () => {
  const r = mergeArrayUnique(['x', 'y'], ['y', 'z']);
  assert.deepEqual(r.next, ['x', 'y', 'z']);
  assert.deepEqual(r.added, ['z']);
  assert.deepEqual(r.alreadyPresent, ['y']);
});

test('mergeArrayUnique treats a non-array as empty', () => {
  assert.deepEqual(mergeArrayUnique(undefined, ['a']).next, ['a']);
  assert.deepEqual(mergeArrayUnique('nope', ['a']).next, ['a']);
});

test('removeArrayValues removes only what it is given', () => {
  const r = removeArrayValues(['mine', 'theirs'], ['mine', 'absent']);
  assert.deepEqual(r.next, ['theirs']);
  assert.deepEqual(r.removed, ['mine']);
});

test('canonical is key-order independent', () => {
  assert.equal(canonical({ b: 1, a: 2 }), canonical({ a: 2, b: 1 }));
  assert.notEqual(canonical({ a: 1 }), canonical({ a: 2 }));
  assert.equal(canonical([1, { b: 2, a: 1 }]), '[1,{"a":1,"b":2}]');
});

test('serializeJson preserves indent and trailing newline', () => {
  assert.equal(serializeJson({ a: 1 }, { indent: '    ' }), '{\n    "a": 1\n}\n');
  assert.equal(serializeJson({ a: 1 }, { indent: '\t' }), '{\n\t"a": 1\n}\n');
  assert.equal(serializeJson({ a: 1 }, { indent: '  ', trailingNewline: false }), '{\n  "a": 1\n}');
});

test('key insertion order survives a round trip', () => {
  const doc = parseJsonLoose('{"z":1,"a":2}').value;
  const { next } = setPointer(doc, '/m', 3);
  assert.deepEqual(Object.keys(next), ['z', 'a', 'm']);
});
