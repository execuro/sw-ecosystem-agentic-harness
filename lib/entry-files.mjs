// Which entry file each coding agent reads, and so where the router block goes.
//
// A pure function of the project's files: it extends the file an agent already
// reads and never invents a second one. It never targets `CLAUDE.local.md` or
// `AGENTS.override.md` — both are personal, uncommitted files.
//
// Re-resolved on every status / plan / apply, so a CLAUDE.md added later moves
// Claude Code's block to it, and the block left behind is removed.

import { abs, exists, readTextMaybe } from './fsx.mjs';
import { entries } from './lock.mjs';

const ORDER = ['claude-code', 'codex', 'copilot', 'cursor'];

/** Cursor's own always-on rule, written only when no AGENTS.md is in play. */
export const CURSOR_RULE = '.cursor/rules/sw-shopware-knowledge.mdc';

const IMPORTS_AGENTS_MD = /^\s*@(?:\.\/)?AGENTS\.md\b/m;

function has(root, path) {
  return exists(abs(root, path));
}

function importsAgentsMd(root) {
  return ['CLAUDE.md', '.claude/CLAUDE.md', 'CLAUDE.local.md'].some((path) => {
    const found = readTextMaybe(abs(root, path));
    return found !== null && IMPORTS_AGENTS_MD.test(found.text);
  });
}

function claudeTarget(root) {
  if (importsAgentsMd(root)) {
    return { target: 'AGENTS.md', reason: 'a CLAUDE file imports @AGENTS.md' };
  }
  if (has(root, 'CLAUDE.md')) return { target: 'CLAUDE.md', reason: 'Claude Code reads CLAUDE.md' };
  if (has(root, '.claude/CLAUDE.md')) {
    return { target: '.claude/CLAUDE.md', reason: 'Claude Code reads .claude/CLAUDE.md' };
  }
  if (has(root, 'CLAUDE.local.md')) {
    return {
      target: 'CLAUDE.md',
      reason: 'only CLAUDE.local.md exists; it is personal, so a shared CLAUDE.md is created',
    };
  }
  return {
    target: 'AGENTS.md',
    reason: 'no CLAUDE.md; Claude Code reads AGENTS.md from v2.1.277 (older versions need a CLAUDE.md)',
  };
}

/**
 * `agents` is a list of agent ids. Returns
 * `{files: [{target, kind, reaches[], reason, create}], warnings[]}`, where
 * `kind` is `fence` (a managed block in a text file) or `file` (Cursor's rule).
 */
export function resolveEntryFiles(root, agents) {
  const picked = ORDER.filter((id) => agents.includes(id));
  const files = [];
  const warnings = [];

  const add = (id, target, reason, kind = 'fence') => {
    let file = files.find((f) => f.target === target);
    if (!file) {
      file = { target, kind, reaches: [], reason: '', create: !has(root, target) };
      files.push(file);
    }
    file.reaches.push(id);
    if (!file.reason.includes(reason)) file.reason = file.reason ? `${file.reason}; ${reason}` : reason;
  };

  for (const id of picked) {
    if (id === 'claude-code') {
      const { target, reason } = claudeTarget(root);
      add(id, target, reason);
    } else if (id === 'codex') {
      add(id, 'AGENTS.md', 'Codex reads AGENTS.md');
      if (has(root, 'AGENTS.override.md')) {
        warnings.push('AGENTS.override.md in the project root replaces AGENTS.md for Codex, so the router block is not read there. Merge or remove the override.');
      }
    } else if (id === 'copilot') {
      if (has(root, '.github/copilot-instructions.md')) {
        add(id, '.github/copilot-instructions.md', 'Copilot reads .github/copilot-instructions.md');
      } else {
        add(id, 'AGENTS.md', 'Copilot reads AGENTS.md');
      }
    } else if (id === 'cursor') {
      if (has(root, 'AGENTS.md') || files.some((f) => f.target === 'AGENTS.md')) {
        add(id, 'AGENTS.md', 'Cursor reads AGENTS.md');
      } else {
        add(id, CURSOR_RULE, 'no AGENTS.md; Cursor reads its own always-on rule', 'file');
      }
    }
  }
  return { files, warnings };
}

/**
 * Lock entries the current resolution no longer wants: a router block in a file
 * that is not chosen any more, or Cursor's rule once an AGENTS.md covers it.
 */
export function staleEntries(lock, files) {
  if (!lock) return [];
  const wanted = new Set(files.map((f) => f.target));
  return entries(lock).filter((e) => !wanted.has(e.target) && (
    (e.kind === 'text-fence' && e.block === 'harness') || (e.kind === 'file-copy' && e.target === CURSOR_RULE)
  ));
}

