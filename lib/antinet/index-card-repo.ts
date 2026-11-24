/**
 * IndexCard repository — imperative shell for the Index Box. Database I/O only; `Db` is injected.
 * Excluded from coverage like the other repositories.
 */
import type { Db, Filter, UpdateFilter } from "mongodb";
import { indexCards } from "./collections";
import { prefixMatcher } from "./browse";
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

/** Delete an Index card by keyword; returns how many were deleted (0 if not found). */
export async function deleteIndexCard(db: Db, keyword: string): Promise<number> {
  return (await indexCards(db).deleteOne({ _id: keyword })).deletedCount;
}

/** Every Index card that lists `address` as an entry point. */
export async function indexCardsWithEntryPoint(db: Db, address: string): Promise<IndexCard[]> {
  return indexCards(db).find({ entryPoints: address }).toArray();
}

/** Remove an address from every Index card's `entryPoints`; returns cards modified. */
export async function pullEntryPointFromAll(db: Db, address: string): Promise<number> {
  const update = { $pull: { entryPoints: address } } as UpdateFilter<IndexCard>;
  return (await indexCards(db).updateMany({ entryPoints: address }, update)).modifiedCount;
}

/** Delete Index cards left with no entry points (e.g. after a pull); returns how many. */
export async function deleteEmptyIndexCards(db: Db): Promise<number> {
  return (await indexCards(db).deleteMany({ entryPoints: { $size: 0 } })).deletedCount;
}

/** Index cards whose keyword starts with `letter` (A–Z browse); all of them if `letter` is empty. */
export async function indexCardsByLetter(db: Db, letter: string): Promise<IndexCard[]> {
  const filter: Filter<IndexCard> = letter ? { _id: prefixMatcher(letter) } : {};
  return indexCards(db).find(filter).sort({ _id: 1 }).toArray();
}

/* v8 ignore stop */
