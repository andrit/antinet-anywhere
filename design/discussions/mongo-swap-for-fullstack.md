# Swap the default Postgres data layer for MongoDB

**For:** an agent working in a freshly scaffolded workbench `fullstack` project
(Next.js 14 App Router, the scaffold whose `lib/db.ts` imports `postgres` and whose
`lib/env.ts` validates `DATABASE_URL` with Zod).

**Goal:** replace Postgres with the official MongoDB driver, with nothing left behind
and `npm run verify` green.

**Why it's small:** the scaffold injects the database-touching "probe" into `checkDb`,
so only `lib/db.ts` actually knows which database you use. The health route and the
env functional core are database-agnostic and do not change.

---

## 0. Confirm the starting state before you touch anything

Run these. If they don't match, STOP and report what you see rather than guessing —
this doc assumes the stock scaffold.

```bash
grep -n "postgres" package.json lib/db.ts          # expect: dependency + import + usage
grep -n "DATABASE_URL" lib/env.ts                   # expect: a Zod string().url() rule
test -f app/api/health/route.ts && echo "health route present"
```

Expected: `package.json` lists `"postgres"`, `lib/db.ts` imports `postgres` and uses a
`` db()`SELECT 1` `` probe, `lib/env.ts` has a `DATABASE_URL` + `NODE_ENV` + `APP_URL`
schema. If `lib/db.ts` already imports `mongodb`, the swap is already done — stop.

---

## 1. `package.json` — swap the dependency

Remove the `postgres` line and add `mongodb`:

```jsonc
// delete:  "postgres": "^3.4.0",
// add under "dependencies":
"mongodb": "^6.9.0",
```

Leave `zod`, `next`, `react`, and all devDependencies untouched.

---

## 2. `lib/db.ts` — replace the whole file

Overwrite `lib/db.ts` with exactly this. The `checkDb` function is unchanged from the
scaffold; only the client creation and the probe are Mongo now.

```ts
/**
 * Database access for {{PROJECT_NAME}}.
 *
 * One lazily-created MongoClient for the whole process. Lazy matters in Next.js: modules are
 * imported during `next build`, and connecting at import time would make the build require a live
 * database. The driver (v5+) connects on first operation, so no explicit .connect() is needed.
 *
 * The client is stashed on `globalThis` in development because Next's hot reload re-evaluates
 * modules on every change — without this you leak a client per reload until Mongo refuses
 * connections.
 */
import { MongoClient, Db } from "mongodb";
import { env } from "./env";

const globalForDb = globalThis as unknown as { __client?: MongoClient };

/* v8 ignore start -- imperative shell: opens a real client, so it cannot be unit-tested without a
   live database. Excluded from coverage DELIBERATELY and explicitly rather than by lowering the
   threshold. Keep this block trivial; anything with a decision in it belongs in a tested pure
   function instead. */
function client(): MongoClient {
  if (!globalForDb.__client) {
    globalForDb.__client = new MongoClient(env().DATABASE_URL, {
      maxPoolSize: env().NODE_ENV === "production" ? 10 : 2,
    });
  }
  return globalForDb.__client;
}

/** The database handle callers use, e.g. `db().collection("users")`. */
export function db(): Db {
  return client().db(env().DB_NAME);
}
/* v8 ignore stop */

export interface DbCheck {
  ok: boolean;
  error?: string;
}

/* v8 ignore start -- see the note on client(): touches the network, nothing to decide. */
/** The real probe — the only part of this module that touches the network. */
const defaultProbe = async (): Promise<void> => {
  await db().command({ ping: 1 });
};
/* v8 ignore stop */

/**
 * Cheap liveness probe for the health route.
 *
 * Returns a result rather than throwing: an unreachable database is a reportable *state*, not a
 * reason for the health endpoint itself to 500 — that would make the app look entirely down when
 * only one dependency is.
 *
 * `probe` is injectable so this error-handling logic is unit-testable without a database. That is
 * the general pattern: pass the impure thing in, and the decision-making around it stays pure.
 */
export async function checkDb(probe: () => Promise<unknown> = defaultProbe): Promise<DbCheck> {
  try {
    await probe();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
```

---

## 3. `lib/env.ts` — add `DB_NAME` to the schema

Mongo needs a database name. Add it to the Zod schema object (leave everything else as-is):

```ts
const EnvSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection URL"),
  DB_NAME: z.string().min(1, "DB_NAME is required"),          // ← add this line
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
});
```

Note: `z.string().url()` accepts `mongodb://` and `mongodb+srv://` (the URL constructor
allows those schemes), so `DATABASE_URL` needs no other change. If you want to be strict,
append `.refine((v) => v.startsWith("mongodb"), "must be a mongodb:// URL")` to the
`DATABASE_URL` rule — optional.

---

## 4. `.env.example` and `.env` — update the connection values

In `.env.example` (and your local `.env` if present), set Mongo-shaped values. The schema
and `.env.example` must not drift.

```
DATABASE_URL=mongodb://localhost:27017
DB_NAME=app
```

---

## 5. `lib/env.test.ts` — update the fixture

The `valid` fixture is Postgres-shaped. Replace it:

```ts
const valid = {
  DATABASE_URL: "mongodb://localhost:27017",
  DB_NAME: "app",
};
```

Everything else in this file still passes unchanged. (Optional: the "reports every
problem at once" test can also assert `/DB_NAME/` now, since an empty env is missing it too.)

---

## 6. `lib/db.test.ts` — one cosmetic fix

The `checkDb` tests are dependency-injected and database-neutral, so they all pass as-is.
The only edit is honesty: one test throws a fake error mentioning the Postgres port.
Change `5432` to `27017`:

```ts
// before:
throw new Error("connect ECONNREFUSED 127.0.0.1:5432");
// after:
throw new Error("connect ECONNREFUSED 127.0.0.1:27017");
```

---

## 7. Verify

```bash
npm install            # pulls mongodb, drops postgres
npm run verify         # typecheck + lint + test + build — must be green
```

If `verify` passes, the swap is complete. To prove the live connection end-to-end
(optional, needs a running Mongo): start the app and hit the health route —
`GET /api/health` should return `{ "status": "ok", "checks": { "database": { "ok": true } } }`
with a 200. With no Mongo running it returns `degraded`/503, which is the intended
behavior, not a failure of the swap.

---

## What did NOT change, and why

- `app/api/health/route.ts` — imports `checkDb` only; knows nothing about the driver.
- `checkDb` itself — pure error-handling around an injected probe.
- The functional-core / imperative-shell split in `env.ts` — preserved.

## Two things to carry forward (not edits — design notes)

1. **The fullstack "Database Patterns" guidance is relational.** Migrations, foreign keys,
   "never ALTER TABLE in prod" mostly don't apply to Mongo. You get schema-on-write, no FKs
   (choose embedding vs. referencing per aggregate), and indexes created in code at startup
   rather than via migrations.
2. **Let Phase 0 DDD drive the document model.** Each aggregate root in
   `design/bounded-contexts.md` maps naturally to a document; keep an aggregate's invariants
   inside one document so a single write stays atomic. Decide boundaries before modeling
   collections.
