/**
 * Pure query logic for the Main Box: the sort-key range math and result selection behind
 * box-flipping and the Create-modal neighbor context. No database here — these take and return
 * plain values, so the logic is unit-tested without standing up Mongo. The repositories
 * (main-card-repo.ts) are the thin I/O shell that runs these against a collection.
 */
import { generateSortKey } from "./address";
import type { MainCard } from "./main-card";

/** Depth of a card == the number of dot-separated segments in its sort key (a section = 1). */
export function segmentDepth(sortKey: string): number {
  return sortKey.split(".").length;
}

/**
 * The sort-key range covering every descendant of an address, shaped for a Mongo range filter.
 *
 * The upper bound uses "/" (ASCII 0x2F) — the single code point just above the "." (0x2E) that
 * joins segments — so the range ends exactly where this address's subtree ends, including no
 * sibling or cousin. See design/antinet-address-grammar.md §5 for the encoding.
 */
export function subtreeRange(address: string): { $gte: string; $lt: string } {
  const key = generateSortKey(address);
  return { $gte: `${key}.`, $lt: `${key}/` };
}

/**
 * From an anchor's descendants, keep only its DIRECT children (exactly one level deeper). Pure, so
 * the depth rule is tested without a database; the repository fetches the subtree and calls this.
 */
export function selectDirectChildren(
  anchorAddress: string,
  descendants: readonly MainCard[],
): MainCard[] {
  const childDepth = segmentDepth(generateSortKey(anchorAddress)) + 1;
  return descendants.filter((card) => segmentDepth(card.sortKey) === childDepth);
}
