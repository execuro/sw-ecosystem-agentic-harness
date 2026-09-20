# Editor install gate

Runs before the `--editor` hand-off (step 0). The Specs Editor is an **optional** add-on: it is not part of this plugin, and a host that never installed it is a supported, normal setup. `sw-setup` offers to install it.

What is checked is the **skill**, `sw-specs-editor`, because that is what `sw-setup` installs and what the hand-off calls. The skill brings the CLI with it — it invokes `npx -y @execuro-sw-ecosystem/sw-specs-editor@latest`, which fetches the package on first use.

Check: is the `sw-specs-editor` skill available in this session?

**Available** → hand off to it with the PRD path, and stop. Nothing else runs.

The session it opens serves the **PRD alone** — there is no spec tab and no way to reach the spec from it; the tech spec is a separate session with its own chat, queue and port. The filename is what picks the mode, so the path must be a PRD: given a `-spec.md` path, stop with one line — "That is a tech spec; run `sw-design-solution <path> --editor`." — and hand off nothing.

**Not available** → **stop the run here**. Say, in one line:

> The Specs Editor is not installed. Run `sw-setup` to add it, or re-run without `--editor`.

Then stop. Do not fall back to the terminal flow, do not read or write the PRD, do not continue with the normal procedure. The user asked for the page; silently giving them something else is worse than telling them they did not get it.
