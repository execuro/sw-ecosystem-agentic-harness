// Shared test harness. Deliberately not named *.test.mjs so `node --test
// test/*.test.mjs` does not try to run it as a suite.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CLI = join(PKG_ROOT, 'bin', 'cli.mjs');

/** Run the real CLI. Never throws on a non-zero exit — the exit code is data. */
export function run(args, { cwd = PKG_ROOT, env } = {}) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: env ?? process.env,
    });
    return { code: 0, stdout, stderr: '' };
  } catch (e) {
    return { code: e.status ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

/** Parse the CLI's single JSON object and assert the contract holds. */
export function parse(result) {
  const body = JSON.parse(result.stdout);
  if (body.ok === true && typeof body.next_step !== 'string') {
    throw new Error('a successful result carried no next_step');
  }
  return body;
}

/** A throwaway repository with the given marker directories and files. */
export function hostRepo({ dirs = [], files = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'sw-harness-'));
  for (const dir of dirs) mkdirSync(join(root, ...dir.split('/')), { recursive: true });
  for (const [path, content] of Object.entries(files)) {
    const abs = join(root, ...path.split('/'));
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return root;
}

export function cleanup(root) {
  rmSync(root, { recursive: true, force: true });
}

export const ALL_MARKERS = ['.claude', '.codex', '.github', '.cursor'];

/** path -> sha256 for every file under a root. */
export function snapshot(root) {
  const out = {};
  const visit = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = join(dir, entry.name);
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) visit(child, rel);
      else out[rel] = createHash('sha256').update(readFileSync(child)).digest('hex');
    }
  };
  visit(root, '');
  return out;
}

/** path -> mtime, so "rewrote it identically" is distinguishable from "skipped". */
export function mtimes(root, skip = /harness\.lock\.json$/) {
  const out = {};
  for (const [path] of Object.entries(snapshot(root))) {
    if (skip.test(path)) continue;
    out[path] = statSync(join(root, ...path.split('/'))).mtimeMs;
  }
  return out;
}

export function readLock(root) {
  try {
    return JSON.parse(readFileSync(join(root, '.sw-ai-sdk', 'harness.lock.json'), 'utf8'));
  } catch {
    return null;
  }
}

export function readJson(root, path) {
  return JSON.parse(readFileSync(join(root, ...path.split('/')), 'utf8'));
}

export function readText(root, path) {
  return readFileSync(join(root, ...path.split('/')), 'utf8');
}

export function exists(root, path) {
  try {
    statSync(join(root, ...path.split('/')));
    return true;
  } catch {
    return false;
  }
}

/**
 * A fake `npx` on `PATH` that answers `--no-install <spec> install-skill
 * --print` for the extra-component ids named in `bodies` (keyed by id, e.g.
 * `sw-specs-editor`) and exits 1 for everything else — the shape of a real
 * `npx --no-install` against a package that is not installed locally. Every
 * invocation's argv is appended to `logFile` as one JSON array per line, so a
 * test can assert what was — or was not — spawned.
 */
export function fakeNpx({ bodies = {} } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'sw-fakenpx-'));
  const logFile = join(dir, 'argv.log');
  writeFileSync(logFile, '');
  const script = `#!/usr/bin/env node
const fs = require('fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(logFile)}, JSON.stringify(args) + '\\n');
const bodies = ${JSON.stringify(bodies)};
const spec = args[1] || '';
const id = spec.replace(/^.*\\//, '').replace(/@\\d+\\.\\d+\\.\\d+$/, '');
if (args[0] === '--no-install' && args[2] === 'install-skill' && args[3] === '--print'
    && Object.prototype.hasOwnProperty.call(bodies, id)) {
  process.stdout.write(bodies[id]);
  process.exit(0);
}
process.stderr.write('npm error 404 Not Found - ' + spec + ' is not in this registry\\n');
process.exit(1);
`;
  const bin = join(dir, 'npx');
  writeFileSync(bin, script);
  chmodSync(bin, 0o755);
  return { dir, logFile };
}

/** `PATH` with the fake `npx` shim ahead of everything else. */
export function withNpx(shimDir) {
  return { ...process.env, PATH: `${shimDir}${sep === '\\' ? ';' : ':'}${process.env.PATH}` };
}

/** Read a fake-npx argv log back as an array of argv arrays. */
export function readArgvLog(logFile) {
  return readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

export { join, sep };
