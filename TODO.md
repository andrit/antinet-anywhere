# TODO — antinet-pwa resume pointer

_Overwritten each session. Read first on resume. Not the only copy of anything._

## Last step (2026-11-22)
- Phase 0 DDD docs **ratified/gated** (grammar, ubiquitous-language, bounded-contexts, domain-events in `design/`).
- **Address core + Zod card schemas BUILT test-first** — all in `lib/antinet/` (pure, no Mongo/React):
  `letters.ts`, `address.ts` (+`addressSchema`), `main-card.ts`, `bib-card.ts`, `index-card.ts`.
  Pattern: InputSchema → `.extend` Document schema → pure `newX(input, now)` builder (clock injected).
  114 tests; `npm run verify` green; lib/antinet 100% lines/funcs, ~97% branch.

## Next step
- **Collection access** — thin imperative shell over `db()` (from `lib/db.ts`) for `main_cards`/`bib_cards`/`index_cards`:
  insert a built card, find by `_id`, neighbor/children queries by `sortKey` (box-flipping + Create-modal context),
  backlinks (`find({ links })`), "who cites this" (`find({ 'citations.bibId' })`).
- **Startup indexes**: `main_cards` sortKey asc + text(title,body); `bib_cards` authorSort.
- Then wire the thin **closed circuit** (slice 1 API routes + minimal UI).

## Load first on resume
1. `TODO.md` (this)
2. memory `antinet-pwa-status`
3. `design/bounded-contexts.md` + `design/antinet-address-grammar.md`

## Key decisions locked
- Data: mongodb driver + Zod + pure functions (NOT Mongoose).
- First slice = wired closed circuit (all 3 boxes, min depth), NOT Main-only.
- Deferred: suggester (fast-follow; slice 1 = neighbor context + dup-address reject), promote, A–Z, referential integrity (dangling refs allowed slice 1), full-text. Neo4j = Phase 2.
- Term is **section** (not stem); **neighbor** (American). NOT git yet.
