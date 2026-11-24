/**
 * BibCard repository — imperative shell for the Bib Box. Database I/O only; `Db` is injected.
 * Excluded from coverage like the other repositories.
 */
import type { Db, Filter, UpdateFilter } from "mongodb";
import { bibCards } from "./collections";
import { prefixMatcher } from "./browse";
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

/** Append a reading note to a Bib card; returns the updated card, or null if the slug is unknown. */
export async function addReadingNote(
  db: Db,
  slug: string,
  note: { page: string; note: string },
): Promise<BibCard | null> {
  return bibCards(db).findOneAndUpdate(
    { _id: slug },
    { $push: { readingNotes: note } },
    { returnDocument: "after" },
  );
}

/** Mark the reading note at `index` as promoted to a Main address (positional path update). */
export async function markNotePromoted(
  db: Db,
  slug: string,
  index: number,
  mainAddress: string,
): Promise<void> {
  const set: Record<string, string> = { [`readingNotes.${index}.processedToMainId`]: mainAddress };
  await bibCards(db).updateOne({ _id: slug }, { $set: set } as UpdateFilter<BibCard>);
}

/** Delete a Bib card by slug; returns how many were deleted (0 if not found). */
export async function deleteBibCard(db: Db, slug: string): Promise<number> {
  return (await bibCards(db).deleteOne({ _id: slug })).deletedCount;
}

/** Bib cards whose authorSort starts with `letter` (A–Z browse); all of them if `letter` is empty. */
export async function bibCardsByLetter(db: Db, letter: string): Promise<BibCard[]> {
  const filter: Filter<BibCard> = letter ? { authorSort: prefixMatcher(letter) } : {};
  return bibCards(db).find(filter).sort({ authorSort: 1 }).toArray();
}

/* v8 ignore stop */
