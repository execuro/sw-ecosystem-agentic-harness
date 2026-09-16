---
title: "Shopware Project Wiki"
nav_exclude: true
tags: [readme, meta]
---

# Shopware Project Wiki

**→ Start reading at [index.md](index.md).** This page explains what the wiki is and how it is
published; the documentation itself starts at the index.

This is the living documentation for one Shopware 6 project. It is structured and atomic so that
coding agents (MCP/LLM tooling) can consume it page by page, and written so that the whole team —
PMs, architects, developers, QA — can read the same pages without a translation layer.

## What is inside

| Folder | What lives there |
|---|---|
| [`domains/`](domains/index.md) | Feature documentation, one page per surface (`administration/`, `storefront/`) |
| [`domains/platform/`](domains/platform/index.md) | Cross-cutting infrastructure: extensions, configuration, logging, debugging, environments |
| [`baseline/`](baseline/tech-stack.md) | The project's tech stack and its glossary |
| [`adr/`](adr/index.md) | Accepted architecture and process decisions |
| [`guidelines/`](guidelines/index.md) | This project's coding rules, inherited from Shopware unless overridden, plus [documentation guidelines](guidelines/documentation-guidelines.md) — the rules every page follows |

Pages are kept in sync by the `sw-document-feature` skill after each feature verification
(`sw-verify-feature`).

## Publishing with GitHub Pages

The wiki uses [Just the Docs](https://just-the-docs.com/) for its sidebar navigation and search.
It is pulled in with `remote_theme:`, which GitHub Pages supports on an ordinary branch deploy — no
Actions workflow and no local build are needed. Which of the two setups applies depends on where
this folder lives:

**A. Published as its own repository** (this folder is the repository root — the simplest case):

1. Push the folder to its own GitHub repository.
2. Settings → Pages → Build and deployment: Source **Deploy from a branch**, branch `main` (or
   `master`), folder **/ (root)**.
3. `_config.yml` here is the site config, so the theme applies automatically. Set its
   `baseurl` to the repository name (`/<repo>`), or the theme's CSS and JS will 404.

**B. Published from the parent project repository** (`docs/project-wiki/` inside a larger repo):

GitHub Pages only reads `_config.yml` from the Pages source root (`/` or `/docs`), never from a
nested folder — so a branch deploy from `/docs` renders these pages **unthemed**, without the
sidebar. To keep the theme, either publish the wiki as its own repository (setup A), or switch
Source to **GitHub Actions** and point a Jekyll build at this folder (`actions/jekyll-build-pages`
with `source: docs/project-wiki`).

**The site renders as unstyled HTML — plain bullet lists and blue links?** The theme loaded but its
assets 404'd: `baseurl` in `_config.yml` must be `/<repo>` for a project site
(`https://<org>.github.io/<repo>/`), and empty only for a user/org site or an Actions build. The
navigation still renders correctly in that state, so the page looks structurally right and entirely
unstyled.

## Previewing locally

```sh
gem install bundler jekyll
cd docs/project-wiki
bundle exec jekyll serve      # or: jekyll serve
# open http://127.0.0.1:4000
```

Minimal `Gemfile` — `github-pages` pins the exact versions GitHub Pages runs, so a local preview
matches the published site:

```ruby
source "https://rubygems.org"
gem "github-pages", group: :jekyll_plugins
```

---

*Generated {{DATE}} · verified against Shopware {{SHOPWARE_VERSION}} · the rules for pages live in
[guidelines/documentation-guidelines.md](guidelines/documentation-guidelines.md).*
