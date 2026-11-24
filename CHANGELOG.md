# Changelog

All notable changes to antinet-pwa are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). The Conventional-Commit git history is
the per-commit record; this file is the human-readable summary, grouped by release.

## [Unreleased]

### Added

- User guide (`docs/user-guide.md`): starting MongoDB and the app, doing the core tasks in the UI and
  via the API, querying the database with `mongosh`, and troubleshooting.
- Slice-1 web UI at `/`: a single page with Main / Bib / Index panels — create a card in each box and
  traverse the whole circuit by clicking addresses (children, links, backlinks, citations, box-flip;
  Index → Main; Bib → who-cites). Semantic design tokens (light + dark via `prefers-color-scheme`);
  the client talks to the API through a typed `api-client`. Light Design pass in `design/ui-slice-1.md`.
- Slice-1 API routes wiring the closed circuit: create a card in each box
  (`POST /api/main`, `/api/bib`, `/api/index`) and traverse it — `GET /api/main/<address>`
  (card + backlinks + direct children + prev/next for box-flipping), `GET /api/bib/<slug>`
  (the source plus every Main card that cites it), and `GET /api/index/<keyword>` (entry points
  resolved to Main cards). Shared pure error mapping (`toApiError`): 400 validation / 409 duplicate
  / 404 / 500.
- OpenAPI 3.0 contract generated from the Zod schemas (not hand-maintained, so it cannot drift),
  served live at `GET /api/openapi` and checked by a unit test.
- Integration smoke test (`npm run smoke`): stands up an in-memory MongoDB and drives the API routes
  end-to-end (create across all three boxes, the 409/400/404 paths, and every traversal). Kept out of
  `npm run verify` so CI stays fast and dependency-free.
- Collection-access layer for the Main Box circuit over MongoDB: dependency-injected collection
  getters, startup index creation (`ensureAntinetIndexes`), and repositories covering the full
  circuit — insert/get, box-flipping (`nextCard`/`prevCard`), direct children (the Create-modal
  neighbor context), backlinks, and citation provenance.
- Pure, tested sort-key query logic (`segmentDepth`, `subtreeRange`, `selectDirectChildren`).

## [0.1.0] - 2026-11-23

### Added

- Project scaffold (Next.js 14 App Router, TypeScript, Vitest, CI `verify`) on the official MongoDB
  driver, swapped in from the stock Postgres scaffold.
- Phase 0 domain design (DDD): antinet address grammar + base-26 sort key, ubiquitous language,
  bounded contexts / aggregates, and domain events.
- Pure antinet domain core: a bijective base-26 letter codec; address parse/validate, sort-key
  generation, and the sibling/child/parent operations.
- Zod card schemas for the three aggregates (MainCard, BibCard, IndexCard) with clock-injected pure
  builders; Zod is the single source of truth, with types inferred via `z.infer`.
