# TODO — antinet-pwa resume pointer

_Overwritten each session. Read first on resume. Not the only copy of anything._

## Last step (2026-11-24)
- **Slice-1 API routes BUILT** (`app/api/{main,bib,index}/…`): POST create each box; GET traverse the
  circuit (main/<address> catch-all → card+backlinks+children+prev/next; bib/<slug> → who-cites;
  index/<keyword> → resolved entry points). Pure `lib/antinet/api-errors.ts` (`toApiError`) tested.
  Builders widened to accept `unknown` (validation boundary) so handlers pass the raw body.
  150 tests; `npm run verify` green; lib/antinet 100% lines/funcs, ~97.3% branch.
- (Prior: initial commit `22718fd`; collection access `71eb5c4`; CHANGELOG added.)

- **OpenAPI contract DONE** — `lib/antinet/openapi.ts` generates it from the Zod schemas (via
  `zod-to-json-schema`); served at `GET /api/openapi`; `openapi.test.ts` guards it.
- **Slice-1 UI DONE (build-verified)** — light Design pass `design/ui-slice-1.md`; page `/` =
  `app/_components/` (atoms, forms, viewers, `antinet-app`) + `lib/antinet/api-client.ts` + semantic
  tokens in `app/globals.css`. `/` prerenders. 155 tests, verify green.
- **Slice-1 circuit now complete end-to-end**: schemas → repos → routes → OpenAPI → UI; API verified
  live via `npm run smoke`.

## Verified / deferred
- **Circuit VERIFIED LIVE** via `npm run smoke` (`lib/antinet/circuit.smoke.ts` + `vitest.smoke.config.ts`):
  in-memory Mongo (`mongodb-memory-server`, devDep), drives the real API handlers end-to-end. Out of
  `verify`. arm64 handled in-file (pins Ubuntu 22.04 / Mongo 7.0.14).
- **ensureAntinetIndexes not auto-wired at startup** (deferred; Mongo auto-indexes `_id` so create/409
  works; sortKey/text/authorSort are perf/feature-only). Wire via a migrate/seed script later.

## Next step
- **Human/browser QA of slice 1** (roadmap phase 8 QA gate): stand up Mongo + `npm run dev`, click the
  circuit in a browser. The UI is build-verified only (no browser/Mongo in-container).
- Then pick the next slice: Bib→Main **promote** workflow, A–Z browsing, the address **suggester**, or
  **referential integrity** (dangling refs currently allowed). Also wire `ensureAntinetIndexes` at startup.

## Load first on resume
1. `TODO.md` (this)
2. memory `antinet-pwa-status`
3. `design/bounded-contexts.md` + `design/antinet-address-grammar.md`

## Key decisions locked
- Data: mongodb driver + Zod + pure functions (NOT Mongoose).
- First slice = wired closed circuit (all 3 boxes, min depth), NOT Main-only.
- Deferred: suggester (fast-follow; slice 1 = neighbor context + dup-address reject), promote, A–Z, referential integrity (dangling refs allowed slice 1), full-text. Neo4j = Phase 2.
- Term is **section** (not stem); **neighbor** (American). NOT git yet.
