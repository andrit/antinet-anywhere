/**
 * Pure helpers for A–Z browsing. The browse letter comes from the client and flows into a RegExp, so
 * it is escaped (no regex injection) and anchored to a case-insensitive prefix. The repositories use
 * `prefixMatcher`; the Mongo query itself is the I/O shell. See design/slice-4-az-browsing.md.
 */

/** Escape every RegExp metacharacter in a string so it matches literally. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A case-insensitive, anchored "starts with" matcher for a (trimmed, escaped) prefix. */
export function prefixMatcher(value: string): RegExp {
  return new RegExp("^" + escapeRegExp(value.trim()), "i");
}
