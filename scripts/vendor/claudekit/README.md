# Project-local ClaudeKit CLI adaptations

User-approved maintenance snapshot (2026-10-16) of seven optional local ClaudeKit
`brand` / `design-system` CLI scripts, metadata version 1.0.0. Original author:
ClaudeKit. Existing notices are retained; no new license or ownership of upstream
copyright is asserted. The local brand package declares no license; design-system
metadata declares MIT. Confirm distribution rights before external redistribution.
No upstream repository/revision could be established from the local package;
`manifest.json` pins the exact reviewed input bytes by SHA-256 instead.

Changes are limited to native ESM imports/exports, import-safe `main` entry points
and removal of one unused binding. CLI arguments, working-directory resolution,
validation failures and generated output are preserved. `extract-colors` pure
helpers are now named ESM exports; legacy synchronous CommonJS module imports are
not supported by the CLI compatibility launchers (no repository consumer found).
Optional ImageMagick behavior is not an acceptance dependency of TASK-005.

Run tracked CLIs directly with `node scripts/vendor/claudekit/<skill>/<name>.mjs`.
For an already installed **project-local** `.cursor` package, explicitly run
`npm run skills:adapt-local`. Only seven hash-matching originals are replaced by
small dynamic-import CLI launchers, and each original is retained as `.upstream`.
Unknown/local edits, symlinks outside the project and differing backups fail closed.
Missing packages are not installed. There is no postinstall/global-agent hook.
Repeated installation is idempotent; upstream updates need a reviewed manifest and
port update, not a forced overwrite. Restore an original from its `.upstream`
snapshot if reverting this optional adaptation.

The adapter, ports and regression tests are versioned; lint covers both the existing
application scope (including optional `.cursor` files) and the new tracked sources.
`npm run test:ci` runs the regression tests without depending on ignored skill files.
This is a reproducible source fix, not an ignore/rule exception or CI bypass.
