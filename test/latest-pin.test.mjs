// Every install/update instruction for THIS package must anchor to
// `@latest`, never a bare package name (which can resolve to a stale copy
// already in the npx cache or node_modules) and never a frozen exact
// version (which goes stale the moment a new version ships).

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PKG_NAME, PKG_ROOT } from '../lib/content.mjs';
import { COMPANIONS } from '../lib/companions.mjs';

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

// README.md's `npm i -D <package>@<version>` lines for the two companion
// packages must name the version COMPANIONS currently pins — otherwise the
// README tells the user to install a version the probe will reject.
test('README companion install lines are pinned to what COMPANIONS pins', () => {
  const text = readFileSync(join(PKG_ROOT, 'README.md'), 'utf8');
  for (const c of COMPANIONS) {
    const escaped = c.pkg.replace(/[/@]/g, '\\$&');
    const re = new RegExp(`npm i -D ${escaped}@(\\S+)`);
    const match = text.match(re);
    assert.ok(match, `README.md has no "npm i -D ${c.pkg}@<version>" line`);
    assert.equal(match[1], c.version,
      `README.md pins ${c.pkg} to ${match[1]}, but COMPANIONS pins ${c.version}`);
  }
});
