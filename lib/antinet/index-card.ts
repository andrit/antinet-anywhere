/**
 * The IndexCard aggregate (collection `index_cards`): one keyword pointing to 1–4 entry points in
 * the Main Box. The dedup + cap are pure transforms in the schema (not ORM hooks), which is the
 * antinet discipline that keeps the Index Box from becoming a tag cloud. See bounded-contexts.md §3.
 */
import { z } from "zod";
import { addressSchema } from "./address";

const MAX_ENTRY_POINTS = 4;

/** Normalized keyword identity: trimmed, lowercased, non-empty. */
export const keywordSchema = z
  .string()
  .transform((s) => s.trim().toLowerCase())
  .refine((s) => s.length > 0, "keyword is required");

/** 1–4 Main-card addresses, normalized then de-duplicated (so case/format variants collapse). */
export const entryPointsSchema = z
  .array(addressSchema)
  .transform((addresses) => Array.from(new Set(addresses)))
  .refine((addresses) => addresses.length >= 1, "an Index card needs at least 1 entry point")
  .refine(
    (addresses) => addresses.length <= MAX_ENTRY_POINTS,
    `an Index card may list at most ${MAX_ENTRY_POINTS} entry points — link deeper notes in the Main Box instead`,
  );

export const IndexCardInputSchema = z.object({
  _id: keywordSchema,
  displayTerm: z.string().trim().min(1, "displayTerm is required"),
  entryPoints: entryPointsSchema,
});
export type IndexCardInput = z.input<typeof IndexCardInputSchema>;

/** The stored document: updated-only timestamp (Index cards have no createdAt). */
export const IndexCardSchema = IndexCardInputSchema.extend({
  updatedAt: z.date(),
});
export type IndexCard = z.infer<typeof IndexCardSchema>;

/** Build a valid Index-card document. Pure: the clock is injected as `now`. */
export function newIndexCard(input: unknown, now: Date): IndexCard {
  const parsed = IndexCardInputSchema.parse(input);
  return IndexCardSchema.parse({ ...parsed, updatedAt: now });
}
