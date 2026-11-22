/**
 * The MainCard aggregate (collection `main_cards`): a permanent, atomic note at a branched address.
 *
 * Zod is the single source of truth — types are `z.infer`red, never hand-written beside it. The
 * schema validates; the pure `newMainCard` builder derives the sortKey and takes the clock as a
 * parameter so it stays testable without mocking time. See design/bounded-contexts.md §1.
 */
import { z } from "zod";
import { addressSchema, generateSortKey } from "./address";

/** A provenance pointer embedded in a Main card (a value object within the aggregate). */
export const CitationRefSchema = z.object({
  bibId: z.string().trim().min(1, "citation bibId is required"),
  page: z.string().trim().min(1).optional(),
});
export type CitationRef = z.infer<typeof CitationRefSchema>;

/** The fields a caller supplies when creating a Main card. */
export const MainCardInputSchema = z.object({
  _id: addressSchema,
  title: z.string().trim().min(1, "title is required").max(120, "title must be ≤ 120 characters"),
  body: z
    .string()
    .trim()
    .min(1, "body is required")
    .max(600, "body exceeds the 4×6 card capacity (≤ 600 chars) — branch into a child note instead"),
  links: z.array(addressSchema).default([]),
  citations: z.array(CitationRefSchema).default([]),
});
export type MainCardInput = z.input<typeof MainCardInputSchema>;

/** The stored document: the input plus the derived sortKey and timestamps. */
export const MainCardSchema = MainCardInputSchema.extend({
  sortKey: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
}).refine((doc) => doc.sortKey === generateSortKey(doc._id), {
  message: "sortKey must be derived from _id via generateSortKey",
  path: ["sortKey"],
});
export type MainCard = z.infer<typeof MainCardSchema>;

/**
 * Build a valid Main-card document from caller input. Pure: `now` is injected rather than read, so
 * the imperative shell owns the clock and this function needs no mocks.
 */
export function newMainCard(input: MainCardInput, now: Date): MainCard {
  const parsed = MainCardInputSchema.parse(input);
  return MainCardSchema.parse({
    ...parsed,
    sortKey: generateSortKey(parsed._id),
    createdAt: now,
    updatedAt: now,
  });
}
