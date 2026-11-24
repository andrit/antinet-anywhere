/**
 * Pure core for the Promote (Bib -> Main) workflow. No I/O: the schemas, the note selection, and the
 * citation merge are all pure and unit-tested; the route handler is the thin shell that runs them
 * against the database. See design/slice-2-promote.md.
 */
import { z } from "zod";
import { ReadingNoteSchema, type BibCard, type ReadingNote } from "./bib-card";
import { MainCardInputSchema } from "./main-card";
import { HttpError } from "./api-errors";

/** Adding a reading note: just page + note (derived from the single-source ReadingNote schema). */
export const AddReadingNoteSchema = ReadingNoteSchema.pick({ page: true, note: true });
export type AddReadingNoteInput = z.input<typeof AddReadingNoteSchema>;

/** Promoting a note: which note, plus the Main card the reader writes. The citation is added from the note. */
export const PromoteSchema = z.object({
  noteIndex: z.number().int().min(0),
  main: MainCardInputSchema.omit({ citations: true }),
});
export type PromoteInput = z.input<typeof PromoteSchema>;

/** The note at `index` if it exists and is not already promoted; otherwise an HttpError. */
export function selectPromotableNote(bib: BibCard, index: number): ReadingNote {
  const note = bib.readingNotes[index];
  if (!note) {
    throw new HttpError(404, `No reading note at index ${index}`);
  }
  if (note.processedToMainId) {
    throw new HttpError(409, `That reading note was already promoted to ${note.processedToMainId}`);
  }
  return note;
}

/** Merge the source citation (from the note) into the reader's Main-card input. */
export function buildPromotedMainInput(bibId: string, note: ReadingNote, main: PromoteInput["main"]) {
  return { ...main, citations: [{ bibId, page: note.page }] };
}
