/**
 * The BibCard aggregate (collection `bib_cards`): one source and the raw reading notes taken from
 * it. Keyed by an author-year slug. Zod is the single source of truth. See bounded-contexts.md §2.
 */
import { z } from "zod";
import { addressSchema } from "./address";

// lastname_year, with a letter appended on collision (kahneman_2011, kahneman_2011a). Lowercased.
const SLUG_RE = /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/;

export const slugSchema = z
  .string()
  .transform((s) => s.trim().toLowerCase())
  .refine((s) => SLUG_RE.test(s), "slug must look like lastname_year (e.g. kahneman_2011, kahneman_2011a)");

/** A fleeting note captured on a Bib card while reading (embedded value object). */
export const ReadingNoteSchema = z.object({
  page: z.string().trim().min(1, "reading note page is required"),
  note: z.string().trim().min(1, "reading note text is required"),
  processedToMainId: addressSchema.optional(),
});
export type ReadingNote = z.infer<typeof ReadingNoteSchema>;

export const SOURCE_TYPES = ["book", "article", "video", "podcast", "other"] as const;

export const BibCardInputSchema = z.object({
  _id: slugSchema,
  authorSort: z.string().trim().min(1, "authorSort is required"),
  title: z.string().trim().min(1, "title is required"),
  year: z.number().int().min(0).optional(), // optional — some sources have no year
  sourceType: z.enum(SOURCE_TYPES).default("book"),
  publicationDetails: z.string().trim().min(1).optional(),
  readingNotes: z.array(ReadingNoteSchema).default([]),
});
export type BibCardInput = z.input<typeof BibCardInputSchema>;

/** The stored document: created-only timestamp (Bib cards have no updatedAt). */
export const BibCardSchema = BibCardInputSchema.extend({
  createdAt: z.date(),
});
export type BibCard = z.infer<typeof BibCardSchema>;

/** Build a valid Bib-card document. Pure: the clock is injected as `now`. */
export function newBibCard(input: BibCardInput, now: Date): BibCard {
  const parsed = BibCardInputSchema.parse(input);
  return BibCardSchema.parse({ ...parsed, createdAt: now });
}
