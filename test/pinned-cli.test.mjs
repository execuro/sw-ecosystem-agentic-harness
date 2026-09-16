// The editor CLIs are separate npm packages. A skill must invoke
// them through a pinned `npx`, never as a bare binary — a bare name only
// resolves on a machine where someone ran `npm link`, which is nobody's
// machine after this ships.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PKG_ROOT } from '../lib/content.mjs';

const TOOLS = {
  'sw-specs-editor': '@execuro-sw-ecosystem/sw-specs-editor',
  'sw-tender-discovery-tool': '@execuro-sw-ecosystem/sw-tender-discovery-tool',
};

// Every subcommand either editor CLI accepts. A bin name followed by one of
// these is an invocation; anything else is prose or a skill name.
const SUBCOMMANDS = [
  'start', 'status', 'stop', 'poll', 'emit', 'batch', 'diagram', 'migrate',
  'guide', 'import', 'export', 'install-skill', '--help',
].join('|');

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

test('no skill invokes an editor CLI as a bare binary', () => {
  const offenders = [];
  for (const file of markdownFiles(join(PKG_ROOT, 'skills'))) {
    const text = readFileSync(file, 'utf8');
    text.split('\n').forEach((line, i) => {
      for (const [bin, pkg] of Object.entries(TOOLS)) {
        // An invocation is the bin name followed by a subcommand. Require the
        // pinned package to appear on the same line.
        const invocation = new RegExp(`(^|[^/@\\w-])${bin}\\s+(${SUBCOMMANDS})\\b`);
        if (!invocation.test(line)) continue;
        if (line.includes(`npx -y ${pkg}@`) || line.includes(`npx --no-install ${pkg}@`)) continue;
        offenders.push(`${file.replace(PKG_ROOT + '/', '')}:${i + 1}  ${line.trim().slice(0, 100)}`);
      }
    });
  }
  assert.deepEqual(offenders, [],
    `bare editor-CLI invocations found:\n${offenders.join('\n')}`);
});

test('every editor CLI reference is pinned to an exact version', () => {
  const offenders = [];
  for (const file of markdownFiles(join(PKG_ROOT, 'skills'))) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      for (const pkg of Object.values(TOOLS)) {
        if (!line.includes(pkg)) continue;
        // A floating range would drift out from under the skill's prose.
        const pinned = new RegExp(`${pkg.replace(/[/@]/g, '\\$&')}@\\d+\\.\\d+\\.\\d+`);
        const bare = new RegExp(`${pkg.replace(/[/@]/g, '\\$&')}(?!@\\d)`);
        if (pinned.test(line)) continue;
        // A prose mention of the package name with no version is fine.
        if (!/npx|npm i|npm install/.test(line)) continue;
        if (bare.test(line)) {
          offenders.push(`${file.replace(PKG_ROOT + '/', '')}:${i + 1}  ${line.trim().slice(0, 100)}`);
        }
      }
    });
  }
  assert.deepEqual(offenders, [],
    `unpinned editor-CLI references found:\n${offenders.join('\n')}`);
});

test('the allowed-tools lines permit the pinned npx form', () => {
  const expectations = {
    // sw-specs-editor itself is not here: it ships inside its own npm package,
    // which owns the skill that drives it.
    'sw-design-requirements': '@execuro-sw-ecosystem/sw-specs-editor',
    'sw-design-solution': '@execuro-sw-ecosystem/sw-specs-editor',
    'sw-discover-tender': '@execuro-sw-ecosystem/sw-tender-discovery-tool',
  };
  for (const [skill, pkg] of Object.entries(expectations)) {
    const text = readFileSync(join(PKG_ROOT, 'skills', skill, 'SKILL.md'), 'utf8');
    const line = text.split('\n').find((l) => l.startsWith('allowed-tools:'));
    assert.ok(line, `${skill}: no allowed-tools line`);
    assert.doesNotMatch(line, new RegExp(`Bash\\((sw-specs-editor|sw-tender-discovery-tool) `),
      `${skill}: allowed-tools still permits a bare editor CLI`);
    assert.ok(line.includes(`npx -y ${pkg}@`),
      `${skill}: allowed-tools does not permit the pinned npx form for ${pkg}`);
  }
});

test('each --editor entry point stops when the optional editor is absent', () => {
  // The editors are optional add-ons whose skills ship in their own packages
  // and are installed by sw-setup. A skill asked for the
  // page must say it cannot open one - never quietly do something else.
  for (const skill of ['sw-design-requirements', 'sw-design-solution', 'sw-discover-tender']) {
    const dir = join(PKG_ROOT, 'skills', skill);
    const text = markdownFiles(dir).map((f) => readFileSync(f, 'utf8')).join('\n');
    assert.match(text, /not installed/i, `${skill}: never says the editor may be absent`);
    assert.match(text, /sw-setup/, `${skill}: does not point at sw-setup as the fix`);
    assert.match(text, /(stop|do not fall back)/i,
      `${skill}: does not stop - a silent fallback to the terminal flow is the bug`);
  }
});
