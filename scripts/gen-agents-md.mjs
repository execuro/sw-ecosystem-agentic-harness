#!/usr/bin/env node
// Generates content/AGENTS.md from the shipped skills and agents.
//
// Codex, GitHub Copilot and Cursor all read AGENTS.md from the *installed*
// tree, and Codex never reads CLAUDE.md — so without this file those three
// hosts get the skills and agents but no orientation. The installer writes
// this text into the consuming repo's AGENTS.md inside a managed fence.
//
// It is generated from the skill and agent frontmatter rather than hand-written
// so the inventory cannot drift from what actually ships.
//
//   node scripts/gen-agents-md.mjs           # write
//   node scripts/gen-agents-md.mjs --check   # exit 1 on any diff

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitFrontmatter, parseFrontmatter } from './frontmatter.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'content', 'AGENTS.md');

/** First sentence of a description — the full text is in the skill itself. */
function firstSentence(text) {
  const m = /^(.*?[.!?])(\s|$)/s.exec(text.trim());
  return (m ? m[1] : text.trim()).replace(/\s+/g, ' ');
}

function collect(dir, isSkill) {
  const names = readdirSync(join(ROOT, dir))
    .filter((f) => (isSkill ? statSync(join(ROOT, dir, f)).isDirectory() : f.endsWith('.md')))
    .sort();
  return names.map((entry) => {
    const file = isSkill ? join(ROOT, dir, entry, 'SKILL.md') : join(ROOT, dir, entry);
    const label = isSkill ? entry : entry.replace(/\.md$/, '');
    const { frontmatter } = splitFrontmatter(readFileSync(file, 'utf8'), label);
    const fm = parseFrontmatter(frontmatter, label);
    if (!fm.description) throw new Error(`${label}: frontmatter has no description`);
    return { name: fm.name || label, summary: firstSentence(fm.description) };
  });
}

function render() {
  const skills = collect('skills', true);
  const agents = collect('agents', false);
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

  const lines = [
    '## Shopware agentic harness',
    '',
    'This repository has the Shopware Ecosystem Agentic Harness installed:',
    `${skills.length} \`sw-*\` skills and ${agents.length} \`sw-*\` sub-agents for Shopware 6 work.`,
    '',
    'Work through a skill rather than improvising. Each one states its own',
    'procedure, and the detail lives in `reference/*.md` files beside its',
    '`SKILL.md`. Read those on demand — they are not loaded up front.',
    '',
    '### Skills',
    '',
    '| Skill | What it does |',
    '| --- | --- |',
    ...skills.map((s) => `| \`${s.name}\` | ${s.summary} |`),
    '',
    '### Sub-agents',
    '',
    'Delegate to these by role where your host supports sub-agents. Where it',
    'does not, read the agent definition and do the work yourself in the main',
    'thread — every agent file is written to be readable that way.',
    '',
    '| Agent | Role |',
    '| --- | --- |',
    ...agents.map((a) => `| \`${a.name}\` | ${a.summary} |`),
    '',
    '### Before anything else',
    '',
    'Run the `sw-setup` skill once per repository. It reports what is missing',
    'and installs the harness configuration — permission rules and the MCP',
    'server registrations — through the installer CLI:',
    '',
    '```',
    // @latest, not the packing version: this line lands in a consumer's
    // AGENTS.md and stays there. Pinned, it would route them at the version
    // they first installed forever; npx also reuses a cached copy without it.
    `npx -y ${pkg.name}@latest status`,
    '```',
    '',
    'The Shopware knowledge base is served by the `ShopwareDevKnowledgeBase`',
    'MCP server. Its tools are namespaced by your host, so a call looks like',
    '`mcp__ShopwareDevKnowledgeBase__read_doc`. Prefer it over model memory for',
    'any claim about Shopware behaviour, and cite the document path you used.',
    '',
    '### House rules',
    '',
    '- Never edit `vendor/`, `public/theme/`, `public/bundles/`, or any plugin',
    '  `Resources/public/` or storefront `dist/` directory — those are build',
    '  output. Change the source and rebuild.',
    '- Ask the user with a structured question tool if you have one (Claude',
    '  Code: `AskUserQuestion`; Codex: `request_user_input`, which is',
    '  non-blocking outside Plan mode — so end the turn after asking).',
    '',
  ];
  return lines.join('\n');
}

const check = process.argv.includes('--check');
const content = render();
const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;

if (check) {
  if (current !== content) {
    console.error(`content/AGENTS.md is ${current === null ? 'missing' : 'out of date'}.`);
    console.error('\nRun: node scripts/gen-agents-md.mjs');
    process.exit(1);
  }
  console.log('content/AGENTS.md up to date');
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, content);
  console.log(`content/AGENTS.md written (${content.length} bytes)`);
}
