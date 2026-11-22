# antinet-pwa — fullstack scaffold

What the workbench wired up, and what you own from here.

## Run it

```bash
cp .env.example .env     # fill in DATABASE_URL
npm install
npm run dev              # http://localhost:3000
npm run verify           # typecheck + lint + build — run this before pushing
```

`npm run verify` is the same sequence CI runs, so a green local run means a green pipeline.

## What is already wired

- **Next.js App Router + TypeScript strict.** `noUnusedLocals` and `noUnusedParameters` are on; `next.config.mjs` states explicitly that type and lint errors fail the build, so nobody "fixes" a red build by disabling the check.
- **Fail-fast env validation** (`lib/env.ts`). Every required variable is declared in one Zod schema and validated at first access, failing with a message that names the variable. Validation is **lazy, not import-time** — `next build` imports modules without a production environment, and eager validation would make the build require one.
- **Database access** (`lib/db.ts`). One lazily-created pool, cached on `globalThis` in development because Next's hot reload re-evaluates modules and would otherwise leak a pool per reload until Postgres refuses connections.
- **Health endpoint** (`app/api/health/route.ts`). Proves the database connection *from application code*, which is what the Scaffold phase's advance criteria require — not a psql prompt. Returns 200 when serving, 503 when a dependency is down, so a monitor can tell "process alive" from "actually working". It stays useful later as the uptime-monitor target.
- **CI** (`.github/workflows/ci.yml`). Typecheck, lint, and build as separate steps so a failure names the gate that broke. The build step supplies a syntactically valid `DATABASE_URL` — it must never need a live database.
- **Build-artifact hygiene.** `.next/`, `out/`, `next-env.d.ts`, `.vercel` are ignored here; `node_modules/`, `.env`, `db-backups/`, `dist/`, `coverage/` come from the workbench base ignores.

## Two rules worth keeping

1. **`.env.example` and `lib/env.ts` must not drift.** Adding a variable means editing both. The schema is what fails at runtime; the example is what a new developer copies.
2. **The build must never require a live database.** Keep connections lazy. The moment `next build` needs Postgres, CI needs a database service and every contributor needs one to check their types.

## What you own next

The Scaffold phase is complete when the dev server starts, `npm run build` exits 0, TypeScript compiles clean, and the database connection is verified from application code — all of which this scaffold satisfies out of the box. Phase 2 (Core Schema) is yours: migrations, models, and a seed script, before any feature work.

Pick a migration tool deliberately and write the decision down. `postgres` is included as the driver only — it is not an ORM or a migration runner, and that choice was left open on purpose.
