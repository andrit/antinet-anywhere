/**
 * BibCard repository — imperative shell for the Bib Box. Database I/O only; `Db` is injected.
 * Excluded from coverage like the other repositories.
 */
import type { Db } from "mongodb";
import { bibCards } from "./collections";
import type { BibCard } from "./bib-card";

/* v8 ignore start -- database I/O only. */

/** Insert a built (already-validated) Bib card. */
export async function insertBibCard(db: Db, card: BibCard): Promise<void> {
  await bibCards(db).insertOne(card);
}

/** Fetch one Bib card by slug. */
export async function getBibCard(db: Db, id: string): Promise<BibCard | null> {
  return bibCards(db).findOne({ _id: id });
}

/* v8 ignore stop */
