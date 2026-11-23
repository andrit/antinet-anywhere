# TODO — antinet-pwa resume pointer

_Overwritten each session. Read first on resume. Not the only copy of anything._

## Last step (2026-11-23)
- Initial commit `22718fd` (git init, no remote).
- **Collection access BUILT** — `lib/antinet/`: `queries.ts` (pure+tested), `collections.ts` (DI getters +
  `ensureAntinetIndexes`), repos `main-card-repo.ts`/`bib-card-repo.ts`/`index-card-repo.ts` (I/O shells, v8-ignored).
  Main repo covers the full circuit: insert/get, next/prevCard, childrenOf, backlinksTo, mainCardsCiting.
  128 tests; `npm run verify` green; lib/antinet 100% lines/funcs, ~97.7% branch.
- (Prior: Phase 0 docs ratified; address core + Zod card schemas built.)

## Next step — wire the thin closed circuit (slice 1): API + minimal UI
- **API routes** (imperative shell: `import { db } from "@/lib/db"`, pass `db()` into repos):
  create a card in each box; get a Main card + its citations/links/backlinks; Index keyword → entry-point Main cards;
  Bib card → who-cites (mainCardsCiting). Validate request bodies with the Zod Input schemas; build via `newX(input, now)`.
- Call `ensureAntinetIndexes(db())` at startup.
- **Minimal UI** for the above (create + view across the three boxes; box-flip prev/next).
- Generate/validate the OpenAPI contract for the routes (CLAUDE.md API-doc requirement).

## Load first on resume
1. `TODO.md` (this)
2. memory `antinet-pwa-status`
3. `design/bounded-contexts.md` + `design/antinet-address-grammar.md`

## Key decisions locked
- Data: mongodb driver + Zod + pure functions (NOT Mongoose).
- First slice = wired closed circuit (all 3 boxes, min depth), NOT Main-only.
- Deferred: suggester (fast-follow; slice 1 = neighbor context + dup-address reject), promote, A–Z, referential integrity (dangling refs allowed slice 1), full-text. Neo4j = Phase 2.
- Term is **section** (not stem); **neighbor** (American). NOT git yet.
