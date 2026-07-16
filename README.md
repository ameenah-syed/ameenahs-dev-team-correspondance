# AmeenahsDevTeam Correspondence

A dependency-free static archive for AmeenahsDevTeam consultations, decisions, evidence, verification, and execution updates. The public UI uses the standard word “correspondence”; the project-required correspondance spelling remains limited to durable artifact paths.

## Local preview

Run: python -m http.server 8000

Open http://localhost:8000/. Relative assets and hash routes make the archive safe to host from a GitHub Pages project subpath.

## Add a record

1. Save complete standalone HTML in plans/correspondance/.
2. Add its publication metadata and reader-facing synthesis to correspondence.js.
3. Follow the completeness contract in AGENTS.md.
4. Run powershell -NoProfile -File .\scripts\verify-site.ps1.
5. Route content fidelity, keyboard, responsive, scope, and link checks to an independent checker.

An archive summary must not add authority or claims absent from the exchange. Preserve and link the canonical source artifact.

## Architecture

- index.html: accessible shell and Pages entry point.
- styles.css: original responsive pink theme.
- correspondence.js: reverse-chronological public record data.
- app.js: search and hash-routed detail rendering.
- plans/correspondance/: canonical standalone correspondence artifacts.
- scripts/verify-site.ps1: bounded dependency-free structural checks.

There is no framework, build step, package manager, cookie, analytics service, third-party font, or external JavaScript.