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

- **Slice 3 — Deletion & referential integrity DONE** (plan `design/slice-3-referential-integrity.md`):
  pure `lib/antinet/integrity.ts` `partitionIndexRefs` (+tests); repo delete/pull ops; `DELETE` on all
  three routes (bib blocked-if-cited 409; main cascade heals links + pulls entry points + drops emptied
  Index cards; index unconditional); OpenAPI (per-resource buildPaths refactor) + smoke extended; UI
  Delete buttons. 168 tests; verify + smoke green; lib/antinet 100% lines/funcs. Create-time forward refs
  still allowed by design.
- **Slice 2 — Promote (Bib→Main) workflow DONE** (plan `design/slice-2-promote.md`): pure core
  `lib/antinet/promote.ts` (+tests) + `HttpError` in `api-errors.ts`; repo `addReadingNote`/`markNotePromoted`;
  routes `POST /api/bib/[id]/notes` + `/promote`; OpenAPI + smoke extended; UI `app/_components/bib-notes.tsx`.
  165 tests; `npm run verify` + `npm run smoke` green; lib/antinet 100% lines/funcs. Note identity = array index.

## Verified / deferred
- **Circuit VERIFIED LIVE** via `npm run smoke` (`lib/antinet/circuit.smoke.ts` + `vitest.smoke.config.ts`):
  in-memory Mongo (`mongodb-memory-server`, devDep), drives the real API handlers end-to-end. Out of
  `verify`. arm64 handled in-file (pins Ubuntu 22.04 / Mongo 7.0.14).
- **ensureAntinetIndexes not auto-wired at startup** (deferred; Mongo auto-indexes `_id` so create/409
  works; sortKey/text/authorSort are perf/feature-only). Wire via a migrate/seed script later.

## Next step
- **Human/browser QA** (roadmap phase 8): stand up Mongo + `npm run dev`, click slices 1–2 in a browser.
  All UI is build-verified only (no browser/Mongo in-container); the APIs are smoke-verified.
- Then pick the next slice: address **suggester** or **A–Z browsing** (referential integrity is now
  done for deletes). Also wire `ensureAntinetIndexes` at startup; consider Atlas + Vercel deploy docs.

## Load first on resume
1. `TODO.md` (this)
2. memory `antinet-pwa-status`
3. `design/bounded-contexts.md` + `design/antinet-address-grammar.md`

## Key decisions locked
- Data: mongodb driver + Zod + pure functions (NOT Mongoose).
- First slice = wired closed circuit (all 3 boxes, min depth), NOT Main-only.
- Deferred: suggester (fast-follow; slice 1 = neighbor context + dup-address reject), promote, A–Z, referential integrity (dangling refs allowed slice 1), full-text. Neo4j = Phase 2.
- Term is **section** (not stem); **neighbor** (American). NOT git yet.
