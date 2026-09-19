// Every install/update instruction for THIS package must anchor to
// `@latest`, never a bare package name (which can resolve to a stale copy
// already in the npx cache or node_modules) and never a frozen exact
// version (which goes stale the moment a new version ships).

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PKG_NAME, PKG_ROOT } from '../lib/content.mjs';

function markdownFiles(dir) {
  const out = [];
  const visit = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const child = join(d, entry.name);
      if (entry.isDirectory()) visit(child);
      else if (entry.name.endsWith('.md')) out.push(child);
    }
  };
  visit(dir);
  return out;
}

test('every npx invocation of this package is pinned to @latest', () => {
  const files = [
    join(PKG_ROOT, 'README.md'),
    // Generated from scripts/gen-agents-md.mjs, and it lands in a consumer's
    // own AGENTS.md — a version baked in there outlives every upgrade.
    join(PKG_ROOT, 'content', 'AGENTS.md'),
    ...markdownFiles(join(PKG_ROOT, 'skills')),
  ];
  const escaped = PKG_NAME.replace(/[/@]/g, '\\$&');
  // An `npx` invocation of this package: the bin form (`npx -y <pkg> ...`,
  // `npx --no-install <pkg> ...`) or the Bash(...) permission-grant form
  // (`Bash(npx -y <pkg> ...)`). Anything not preceded by `npx` is prose
  // naming the package and is out of scope for this check.
  const invocation = new RegExp(`npx[^\\n]*?${escaped}(@\\S+)?\\b`, 'g');
  const offenders = [];
  for (const file of files) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      for (const match of line.matchAll(invocation)) {
        const version = match[1];
        if (version === '@latest') continue;
        offenders.push(`${file.replace(PKG_ROOT + '/', '')}:${i + 1}  ${line.trim().slice(0, 100)}`);
      }
    });
  }
  assert.deepEqual(offenders, [],
    `npx invocations of ${PKG_NAME} not pinned to @latest:\n${offenders.join('\n')}`);
});

// lib/guide.mjs is deliberately exempt: its RUN constant interpolates
// `${PKG_VERSION}` because the guide describes the CLI that is actually
// running (a skill invoking a stale copy would print a stale guide), not
// the newest published version. It carries its own separate "run @latest to
// upgrade" instruction instead, checked below.
test('lib/guide.mjs names @latest as the upgrade path, without repinning RUN', () => {
  const text = readFileSync(join(PKG_ROOT, 'lib', 'guide.mjs'), 'utf8');
  assert.match(text, /\$\{PKG_NAME\}@latest install/,
    'guide.mjs does not tell the reader how to reach the newest published version');
  assert.match(text, /RUN = `npx -y \$\{PKG_NAME\}@\$\{PKG_VERSION\}`/,
    'guide.mjs RUN constant changed shape — it must keep interpolating the running CLI\'s own version');
});

// Every OTHER `@execuro-sw-ecosystem/*` package a skill invokes — the Specs
// Editor and the Tender Discovery Tool — must be `@latest` too. They are
// installed and updated by `sw-setup`, not pinned by this package, so a
// frozen version here would invoke a copy older than the skill the user has.
const ECOSYSTEM = /npx[^\n]*?(@execuro-sw-ecosystem\/[a-z0-9-]+)(@[A-Za-z0-9.-]+)?/g;

test('every npx invocation of a sibling ecosystem package is pinned to @latest', () => {
  const offenders = [];
  for (const file of markdownFiles(join(PKG_ROOT, 'skills'))) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      for (const match of line.matchAll(ECOSYSTEM)) {
        if (match[2] === '@latest') continue;
        offenders.push(`${file.replace(PKG_ROOT + '/', '')}:${i + 1}  ${line.trim().slice(0, 120)}`);
      }
    });
  }
  assert.deepEqual(offenders, [],
    `ecosystem npx invocations not pinned to @latest:\n${offenders.join('\n')}`);
});

// The `allowed-tools:` frontmatter line is a permission grant, matched
// literally by the host: `Bash(npx -y <pkg>@0.1.0 *)` DENIES an `@latest`
// call, silently, at runtime. It drifted once because the checks above only
// ever looked at prose, so it is asserted on its own here.
test('every Bash(npx ...) grant in a skill\'s allowed-tools is pinned to @latest', () => {
  const offenders = [];
  for (const file of markdownFiles(join(PKG_ROOT, 'skills'))) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (!line.startsWith('allowed-tools:')) continue;
      for (const grant of line.matchAll(/Bash\(npx[^)]*\)/g)) {
        for (const match of grant[0].matchAll(/(@execuro-sw-ecosystem\/[a-z0-9-]+)(@[A-Za-z0-9.-]+)?/g)) {
          if (match[2] === '@latest') continue;
          offenders.push(`${file.replace(PKG_ROOT + '/', '')}  ${grant[0]}`);
        }
      }
    }
  }
  assert.deepEqual(offenders, [],
    `allowed-tools npx grants not pinned to @latest:\n${offenders.join('\n')}`);
});
