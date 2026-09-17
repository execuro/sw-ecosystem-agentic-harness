// The interactive host picker. Used only when `apply`/`install` reach step 3
// of the host-resolution chain: no `--host`, no lock to reuse, but a real
// terminal to ask on.
//
// node:readline only — the package has zero dependencies and that must not
// change. Every prompt and echo goes to STDERR, never stdout: stdout carries
// exactly one JSON object per run and every skill parses it, so a menu on
// stdout would corrupt that contract. This module never inspects
// `process.stdin.isTTY` itself — the caller decides whether to invoke it.

import { createInterface } from 'node:readline';

const LABELS = {
  'claude-code': 'Claude Code',
  codex: 'Codex',
  copilot: 'GitHub Copilot',
  cursor: 'Cursor',
};

/**
 * Pure parsing, no I/O — so it can be unit-tested without a TTY.
 *
 * Accepts comma-separated 1-based indexes into `hosts` (e.g. "1,3"), the
 * word "all", or an empty string — both of the latter two mean every host,
 * made explicit rather than left as a silent default. Throws a short,
 * human-readable `Error` on anything else (out of range, not a number,
 * nothing at all).
 */
export function parseSelection(input, hosts) {
  const trimmed = (input ?? '').trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'all') return [...hosts];
  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  if (!parts.length) throw new Error('no selection given');
  const chosen = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) throw new Error(`not a number: "${part}"`);
    const n = Number(part);
    if (n < 1 || n > hosts.length) throw new Error(`out of range 1-${hosts.length}: ${part}`);
    const id = hosts[n - 1];
    if (!chosen.includes(id)) chosen.push(id);
  }
  return chosen;
}

function question(rl, text) {
  return new Promise((resolve) => rl.question(text, resolve));
}

/**
 * Ask which host(s) to install into. Re-asks once on unparseable input, then
 * gives up and returns `null` — the caller turns that into the same exit-2
 * usage error the no-TTY path uses, so the output contract stays one shape.
 */
export async function askHosts(hosts) {
  const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: true });
  const menu = hosts.map((h, i) => `  ${i + 1}. ${LABELS[h] ?? h}`).join('\n');
  const prompt = `Which coding agent(s) should this install into?\n${menu}\n`
    + 'Enter comma-separated numbers (e.g. "1,3"), "all", or press Enter for all: ';
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const answer = await question(rl, attempt === 0 ? prompt : 'Not understood — try again: ');
      try {
        return parseSelection(answer, hosts);
      } catch {
        // Re-ask once; the loop's second pass falls through to null below.
      }
    }
    return null;
  } finally {
    rl.close();
  }
}
