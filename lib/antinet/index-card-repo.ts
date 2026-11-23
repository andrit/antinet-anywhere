/**
 * IndexCard repository — imperative shell for the Index Box. Database I/O only; `Db` is injected.
 * Excluded from coverage like the other repositories.
 */
import type { Db } from "mongodb";
import { indexCards } from "./collections";
import type { IndexCard } from "./index-card";

/* v8 ignore start -- database I/O only. */

/** Insert a built (already-validated) Index card. */
export async function insertIndexCard(db: Db, card: IndexCard): Promise<void> {
  await indexCards(db).insertOne(card);
}

/** Fetch one Index card by keyword. */
export async function getIndexCard(db: Db, id: string): Promise<IndexCard | null> {
  return indexCards(db).findOne({ _id: id });
}

/* v8 ignore stop */
