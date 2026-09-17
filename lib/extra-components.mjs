// The two optional extra components, probed rather than installed by us.
//
// Read-then-copy, not `install-skill --target`: the engine's whole safety
// story is "hash what we intend to write, compare, record". A foreign binary
// that writes on its own cannot be previewed, so `plan` would lie and
// `uninstall` would have to guess. Reading the body with `--print` and
// copying it ourselves through `writeAtomic` keeps every extra-component
// skill on the same adopt/conflict/drift/update ladder as everything else
// this CLI writes, and makes `uninstall` exact even after the user has
// removed the extra component — the common case, since it is optional.
//
// `--no-install` plus `npm_config_yes=false` are two independent guards that
// this can never reach the network: the first tells npx not to fetch a
// missing package, the second refuses the prompt that would offer to.

import { spawnSync } from 'node:child_process';
import { sha256 } from './fsx.mjs';
import { wrapCommand } from './content.mjs';

export const EXTRA_COMPONENTS = [
  {
    id: 'sw-specs-editor', pkg: '@execuro-sw-ecosystem/sw-specs-editor', version: '0.1.0',
    label: 'Specs Editor',
  },
  {
    id: 'sw-tender-discovery-tool', pkg: '@execuro-sw-ecosystem/sw-tender-discovery-tool', version: '0.1.0',
    label: 'Tender Discovery Tool',
  },
];

/** The argv `probe` would spawn, without spawning it — for tests. */
export function probeArgs(component, platform) {
  const spec = `${component.pkg}@${component.version}`;
  const wrapped = wrapCommand(
    { command: 'npx', args: ['--no-install', spec, 'install-skill', '--print'] },
    platform,
  );
  return [wrapped.command, ...wrapped.args];
}

// One probe per `<pkg>@<version>` per process. `status`/`plan`/`apply` each
// ask this question once per host, and the answer never changes mid-run.
const cache = new Map();

export function resetProbeCache() {
  cache.clear();
}

function lastLine(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  return lines.length ? lines[lines.length - 1] : '';
}

function doProbe(component, platform) {
  const spec = `${component.pkg}@${component.version}`;
  const base = { id: component.id, pkg: component.pkg, version: component.version, spec, label: component.label };
  const wrapped = wrapCommand(
    { command: 'npx', args: ['--no-install', spec, 'install-skill', '--print'] },
    platform,
  );

  const res = spawnSync(wrapped.command, wrapped.args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 20000,
    windowsHide: true,
    env: { ...process.env, npm_config_yes: 'false', npm_config_audit: 'false' },
  });

  if (res.error) {
    if (res.error.code === 'ENOENT') {
      return { ...base, available: false, state: 'probe-failed', reason: 'npx was not found on PATH' };
    }
    return {
      ...base, available: false, state: 'probe-failed',
      reason: `probing ${spec} failed: ${res.error.message}`,
    };
  }
  if (res.signal) {
    return {
      ...base, available: false, state: 'probe-failed',
      reason: `probing ${spec} was killed (${res.signal}), possibly a timeout`,
    };
  }
  if (res.status !== 0) {
    return {
      ...base, available: false, state: 'absent', reason: `${spec} is not installed locally`,
      detail: lastLine((res.stderr ?? Buffer.alloc(0)).toString('utf8')),
    };
  }
  const stdout = res.stdout ?? Buffer.alloc(0);
  if (stdout.length === 0) {
    return {
      ...base, available: false, state: 'probe-failed',
      reason: `${spec} install-skill --print returned nothing`,
    };
  }
  if (!stdout.toString('utf8').startsWith('---')) {
    return {
      ...base, available: false, state: 'probe-failed',
      reason: `${spec} install-skill --print did not return a skill document`,
    };
  }
  return { ...base, available: true, state: 'available', body: stdout, hash: sha256(stdout), bytes: stdout.length };
}

/** Probe one extra component. Never throws. */
export function probe(component, { platform = process.platform } = {}) {
  const key = `${component.pkg}@${component.version}`;
  if (cache.has(key)) return cache.get(key);
  const result = doProbe(component, platform);
  cache.set(key, result);
  return result;
}

export function probeAll(opts) {
  return EXTRA_COMPONENTS.map((c) => probe(c, opts));
}
