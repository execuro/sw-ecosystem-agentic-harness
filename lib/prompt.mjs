// The interactive agent picker. Used only when `apply`/`install` reach step 3
// of the agent-resolution chain: no `--agent`, no lock to reuse, but a real
// terminal to ask on.
//
// node:readline only — the package has zero dependencies and that must not
// change. Every prompt and echo goes to STDERR, never stdout: the picker is an
// interaction, not the result, and stdout carries the result alone — under
// `--json` a menu there would corrupt the object every skill parses.
// This module never inspects `process.stdin.isTTY` itself — the caller decides
// whether to invoke it.

import { createInterface } from 'node:readline';
import { LABELS } from './render.mjs';

/**
 * Pure parsing, no I/O — so it can be unit-tested without a TTY.
 *
 * Accepts comma-separated 1-based indexes into `agents` (e.g. "1,3"), the
 * word "all", or an empty string — both of the latter two mean every agent,
 * made explicit rather than left as a silent default. Throws a short,
 * human-readable `Error` on anything else (out of range, not a number,
 * nothing at all).
 */
export function parseSelection(input, agents) {
  const trimmed = (input ?? '').trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'all') return [...agents];
  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  if (!parts.length) throw new Error('no selection given');
  const chosen = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) throw new Error(`not a number: "${part}"`);
    const n = Number(part);
    if (n < 1 || n > agents.length) throw new Error(`out of range 1-${agents.length}: ${part}`);
    const id = agents[n - 1];
    if (!chosen.includes(id)) chosen.push(id);
  }
  return chosen;
}

function question(rl, text) {
  return new Promise((resolve) => rl.question(text, resolve));
}

/**
 * Ask which agent(s) to install into. Re-asks once on unparseable input, then
 * gives up and returns `null` — the caller turns that into the same exit-2
 * usage error the no-TTY path uses, so the output contract stays one shape.
 */
export async function askAgents(agents) {
  const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: true });
  const menu = agents.map((a, i) => `  ${i + 1}. ${LABELS[a] ?? a}`).join('\n');
  const prompt = `Which coding agent(s) should this install into?\n${menu}\n`
    + 'Enter comma-separated numbers (e.g. "1,3"), "all", or press Enter for all: ';
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const answer = await question(rl, attempt === 0 ? prompt : 'Not understood — try again: ');
      try {
        return parseSelection(answer, agents);
      } catch {
        // Re-ask once; the loop's second pass falls through to null below.
      }
    }
    return null;
  } finally {
    rl.close();
  }
}
