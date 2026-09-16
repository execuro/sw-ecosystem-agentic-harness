# Toolchain conformance

Entered while drafting, before finalizing the spec. Decides how the spec is written so code conforms to Shopware's linters/static analysis on first write.

### 5. Toolchain conformance

Shopware's linters/static analysis (PHPStan, ESLint, Stylelint — Shopware's rule packages) run via `shopware-cli extension validate --full`. Write the spec so code conforms on first write. Known shapes, not exhaustive: `services.yaml` not `services.xml` (deprecated); never a `snippets` object to `Shopware.Module.register` (`shopware-admin/no-snippet-import`) — use `snippet/`. Unlisted mechanism → never guess, note it for `sw-implement-feature`'s check.

One plan line: not done until `shopware-cli extension validate --full --exclude sw-cli` reports zero errors — `sw-verify-feature` checks this.
