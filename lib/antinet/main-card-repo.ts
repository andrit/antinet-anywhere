/**
 * MainCard repository — the imperative shell for the Main Box. Every function here touches the
 * database and takes the `Db` as a parameter. The decisions (sort-key ranges, direct-child
 * selection) live in the pure, unit-tested helpers in queries.ts and address.ts; this file is only
 * the glue that runs them, so it is excluded from coverage like lib/db.ts.
 */
import type { Db, Filter } from "mongodb";
import { mainCards } from "./collections";
import { generateSortKey } from "./address";
import { subtreeRange, selectDirectChildren } from "./queries";
import type { MainCard } from "./main-card";

/* v8 ignore start -- database I/O only; logic is tested in queries.test.ts / address.test.ts. */

/** Insert a built (already-validated) Main card. */
export async function insertMainCard(db: Db, card: MainCard): Promise<void> {
  await mainCards(db).insertOne(card);
}

/** Fetch one Main card by address. */
export async function getMainCard(db: Db, id: string): Promise<MainCard | null> {
  return mainCards(db).findOne({ _id: id });
}

/** Box-flipping: the card immediately after this one in physical order. */
export async function nextCard(db: Db, id: string): Promise<MainCard | null> {
  const key = generateSortKey(id);
  return mainCards(db).find({ sortKey: { $gt: key } }).sort({ sortKey: 1 }).limit(1).next();
}

/** Box-flipping: the card immediately before this one in physical order. */
export async function prevCard(db: Db, id: string): Promise<MainCard | null> {
  const key = generateSortKey(id);
  return mainCards(db).find({ sortKey: { $lt: key } }).sort({ sortKey: -1 }).limit(1).next();
}

// ponytail: fetches the whole subtree then filters to direct children in memory. Fine at personal-
// antinet scale. ceiling: a very deep or wide branch. upgrade: store depth as a field and index it.
/** The anchor's direct children — the Create-modal neighbor context. */
export async function childrenOf(db: Db, id: string): Promise<MainCard[]> {
  const descendants = await mainCards(db)
    .find({ sortKey: subtreeRange(id) })
    .sort({ sortKey: 1 })
    .toArray();
  return selectDirectChildren(id, descendants);
}

/** Incoming links: every Main card that links TO this address (backlinks). */
export async function backlinksTo(db: Db, address: string): Promise<MainCard[]> {
  return mainCards(db).find({ links: address }).sort({ sortKey: 1 }).toArray();
}

/** Provenance: every Main card that cites a given Bib source. */
export async function mainCardsCiting(db: Db, bibId: string): Promise<MainCard[]> {
  const filter = { "citations.bibId": bibId } as Filter<MainCard>;
  return mainCards(db).find(filter).sort({ sortKey: 1 }).toArray();
}

/* v8 ignore stop */
