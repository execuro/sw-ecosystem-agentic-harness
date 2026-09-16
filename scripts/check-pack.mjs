#!/usr/bin/env node
// Asserts the published tarball carries exactly what the `files` allow-list
// says it does — no stray test fixture, no scratch file, nothing missing.
//
//   node scripts/check-pack.mjs

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(`${ROOT}/package.json`, 'utf8'));

const listed = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: ROOT, encoding: 'utf8' }),
)[0].files.map((f) => f.path).sort();

// npm always includes these regardless of `files`.
const ALWAYS = new Set(['package.json', 'README.md', 'LICENSE', 'CHANGELOG.md']);

const allowed = pkg.files.filter((f) => f.endsWith('/'));
const allowedFiles = new Set(pkg.files.filter((f) => !f.endsWith('/')));

const strays = listed.filter((path) => {
  if (ALWAYS.has(path) || allowedFiles.has(path)) return false;
  return !allowed.some((dir) => path.startsWith(dir));
});

if (strays.length) {
  console.error('files outside the allow-list would be published:');
  for (const path of strays) console.error(`  ${path}`);
  process.exit(1);
}

// And the reverse: every declared directory must actually contribute something.
const empty = allowed.filter((dir) => !listed.some((path) => path.startsWith(dir)));
if (empty.length) {
  console.error('declared in `files` but nothing was packed:');
  for (const dir of empty) console.error(`  ${dir}`);
  process.exit(1);
}

// Nothing may run on a consumer's machine at install time.
for (const hook of ['preinstall', 'install', 'postinstall', 'prepare', 'prepack']) {
  if (pkg.scripts?.[hook]) {
    console.error(`package.json declares a ${hook} script; it would run on a registry install`);
    process.exit(1);
  }
}

console.log(`tarball ok — ${listed.length} files, all within the allow-list`);
