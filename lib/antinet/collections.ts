/**
 * Typed access to the three antinet collections, plus startup index creation.
 *
 * The collection getters take the `Db` as a parameter (dependency injection) rather than reaching
 * for a global, so callers in the imperative shell pass `db()` and tests can pass a fake. The names
 * are the ones fixed in design/bounded-contexts.md.
 */
import type { Db, Collection } from "mongodb";
import type { MainCard } from "./main-card";
import type { BibCard } from "./bib-card";
import type { IndexCard } from "./index-card";

export const COLLECTIONS = {
  main: "main_cards",
  bib: "bib_cards",
  index: "index_cards",
} as const;

export function mainCards(db: Db): Collection<MainCard> {
  return db.collection<MainCard>(COLLECTIONS.main);
}

export function bibCards(db: Db): Collection<BibCard> {
  return db.collection<BibCard>(COLLECTIONS.bib);
}

export function indexCards(db: Db): Collection<IndexCard> {
  return db.collection<IndexCard>(COLLECTIONS.index);
}

/* v8 ignore start -- imperative shell: creates indexes on a live database. Idempotent (createIndex
   is a no-op if the index already exists), so it is safe to call at startup. */
/** Create the indexes the circuit relies on. Call once at startup. */
export async function ensureAntinetIndexes(db: Db): Promise<void> {
  await mainCards(db).createIndex({ sortKey: 1 }); // box-flipping + neighbor queries
  await mainCards(db).createIndex({ title: "text", body: "text" }); // escape-hatch search (later)
  await bibCards(db).createIndex({ authorSort: 1 }); // A–Z browsing (later)
}
/* v8 ignore stop */
