/**
 * Database access for antinet-pwa.
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
