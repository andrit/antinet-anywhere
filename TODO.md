# TODO — antinet-pwa resume pointer

_Overwritten each session. Read first on resume. Not the only copy of anything._

## Last step (2026-11-24)
- **Slice-1 API routes BUILT** (`app/api/{main,bib,index}/…`): POST create each box; GET traverse the
  circuit (main/<address> catch-all → card+backlinks+children+prev/next; bib/<slug> → who-cites;
  index/<keyword> → resolved entry points). Pure `lib/antinet/api-errors.ts` (`toApiError`) tested.
  Builders widened to accept `unknown` (validation boundary) so handlers pass the raw body.
  150 tests; `npm run verify` green; lib/antinet 100% lines/funcs, ~97.3% branch.
- (Prior: initial commit `22718fd`; collection access `71eb5c4`; CHANGELOG added.)

## Not yet verified / deferred
- **Routes NOT exercised against a live Mongo** (no mongod in-container). Need a real DB round-trip:
  run Mongo (`docker run -p 27017:27017 mongo`), set `.env` (DATABASE_URL, DB_NAME), `npm run dev`, curl.
- **ensureAntinetIndexes not auto-wired at startup** (fragile hook + no DB at build; Mongo auto-indexes
  `_id` so create/409 works; sortKey/text/authorSort are perf/feature-only). Wire via a migrate/seed
  script or instrumentation in a later phase.

## Next step
- **OpenAPI contract** for the routes (CLAUDE.md: a feature isn't done until its API contract is documented).
- **Minimal UI**: create + view across the three boxes; box-flip prev/next; Index→Main; Bib→who-cites.
- Live smoke test of the circuit end-to-end against Mongo.

## Load first on resume
1. `TODO.md` (this)
2. memory `antinet-pwa-status`
3. `design/bounded-contexts.md` + `design/antinet-address-grammar.md`

## Key decisions locked
- Data: mongodb driver + Zod + pure functions (NOT Mongoose).
- First slice = wired closed circuit (all 3 boxes, min depth), NOT Main-only.
- Deferred: suggester (fast-follow; slice 1 = neighbor context + dup-address reject), promote, A–Z, referential integrity (dangling refs allowed slice 1), full-text. Neo4j = Phase 2.
- Term is **section** (not stem); **neighbor** (American). NOT git yet.
