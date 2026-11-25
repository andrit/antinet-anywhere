# TODO — antinet-pwa resume pointer

_Overwritten each session. Read first on resume. Not the only copy of anything._

## Last session (through 2026-11-25)
- **Core feature set COMPLETE**: Phase-0 DDD → address engine → 3 Zod card aggregates → repos → full
  REST API (create / read / traverse / delete / promote / A–Z browse / suggest) → OpenAPI generated
  from Zod (`GET /api/openapi`) → UI (`/`) → live integration smoke (`npm run smoke`).
- **All 4 deferred slices done**: promote (Bib→Main), referential integrity (deletes), A–Z browsing,
  address suggester. Startup indexes wired (`instrumentation.ts` + `instrumentation.node.ts`).
- **DEPLOYED LIVE**: Vercel `antinet-anywhere.vercel.app` + Atlas M0; `/api/health` ok local + prod.
- Wrote `docs/qa-walkthrough.md` (Phase-8 human QA). **Human QA walkthrough IN PROGRESS.**

## Next step
- **Finish the QA walkthrough** (`docs/qa-walkthrough.md`); if any step's *Expect* fails, report the
  step and fix it.
- Then **roadmap polish**: real UI / E2E tests (the real gap — only unit + live API smoke today),
  a11y, mobile audit, performance.
- Loose ends: `APP_URL` set-but-unused; forward references allowed by design; custom domain later.

## Load first on resume
1. This `TODO.md` + memory `antinet-pwa-status`
2. `docs/qa-walkthrough.md` (if continuing QA) · `CHANGELOG.md` (what shipped, newest first)
3. `design/` for slice detail — `design/antinet-address-grammar.md` is the load-bearing spec

## Key facts / conventions
- Gate: `npm run verify` (typecheck + lint + test + build). Live-DB test: `npm run smoke` (in-memory Mongo).
- Data layer: `mongodb` driver + **Zod single source** (NOT Mongoose). `lib/antinet/` = pure core (tested)
  + repos (I/O shells, v8-ignored) + api-client (browser I/O, coverage-excluded).
- Vocab: **section** (not stem), **neighbor** (American). Addresses: section + `/` + alternating
  number→letter branch; sortKey = base-26 value.
- Git: stage only, user commits; **commit message = plain text code block** (no `git commit`/heredoc),
  no Co-Authored-By trailer.
- Hosting: env vars in the Vercel dashboard (NOT `.env`, which is gitignored); Atlas SRV string needs
  `user:password@`; redeploy after changing env vars.
