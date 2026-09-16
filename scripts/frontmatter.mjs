// Shared frontmatter reader for the agent adapter generators.
//
// Every generator in this directory turns `agents/<name>.md` into some other
// host's agent format, so they all need the same two things: the `---` block
// split off the front, and a reader for the flat `key: value` YAML those files
// actually use.

/** Split a `---`-delimited frontmatter block off the front of a file. */
export function splitFrontmatter(text, file) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) throw new Error(`${file}: no frontmatter block`);
  return { frontmatter: m[1], body: text.slice(m[0].length) };
}

/**
 * Minimal YAML reader for the flat `key: value` frontmatter these agents use.
 * Values spanning lines are not supported and not present; a continuation line
 * would be a silent truncation, so it is rejected instead.
 */
export function parseFrontmatter(src, file) {
  const out = {};
  for (const line of src.split(/\r?\n/)) {
    if (line.trim() === '') continue;
    const m = /^([A-Za-z_][\w-]*):\s?(.*)$/.exec(line);
    if (!m) throw new Error(`${file}: frontmatter line is not a flat key: value pair: ${line}`);
    out[m[1]] = m[2].trim();
  }
  return out;
}

/** Read `agents/<name>.md`, validate the shared invariants, return the parts. */
export function readAgent(dir, file, readFileSync) {
  const raw = readFileSync(`${dir}/${file}`, 'utf8');
  const { frontmatter, body } = splitFrontmatter(raw, file);
  const fm = parseFrontmatter(frontmatter, file);
  if (!fm.name) throw new Error(`${file}: frontmatter has no name`);
  if (!fm.description) throw new Error(`${file}: frontmatter has no description`);
  if (fm.name !== file.replace(/\.md$/, '')) {
    throw new Error(`${file}: frontmatter name "${fm.name}" does not match the filename`);
  }
  return { file, fm, body, raw };
}

/** Split a frontmatter `tools:` list into trimmed names. Absent -> null (all tools). */
export function toolList(value) {
  if (value === undefined || value === null || value.trim() === '') return null;
  return value.split(',').map((t) => t.trim()).filter(Boolean);
}
