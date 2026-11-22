/**
 * Bijective base-26 codec for antinet letter tokens (spreadsheet-style: A..Z, AA, AB, ...).
 *
 * Pure — no I/O, no globals. There is no zero digit: A=1, Z=26, AA=27. That is what makes the
 * ordering length-first (every single letter before every double letter), which is exactly the
 * physical box order the sort key must reproduce. See design/antinet-address-grammar.md §5.
 */

// 'A' is char code 65, so (code - 64) maps A->1 ... Z->26.
const LETTER_BASE = 64;
const RADIX = 26;

/** "A" -> 1, "Z" -> 26, "AA" -> 27, "AAA" -> 703. Throws on anything but one-or-more A-Z. */
export function lettersToOrdinal(letters: string): number {
  if (!/^[A-Z]+$/.test(letters)) {
    throw new Error(`Not a letter token: "${letters}"`);
  }
  let n = 0;
  for (const ch of letters) {
    n = n * RADIX + (ch.charCodeAt(0) - LETTER_BASE);
  }
  return n;
}

/** Inverse of lettersToOrdinal: 1 -> "A", 27 -> "AA". Throws unless n is a positive integer. */
export function ordinalToLetters(ordinal: number): string {
  if (!Number.isInteger(ordinal) || ordinal < 1) {
    throw new Error(`Letter ordinal must be a positive integer, got ${ordinal}`);
  }
  let n = ordinal;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % RADIX;
    out = String.fromCharCode(LETTER_BASE + 1 + rem) + out;
    n = Math.floor((n - 1) / RADIX);
  }
  return out;
}

/** Next letter token, spreadsheet-style: "A" -> "B", "Z" -> "AA", "AZ" -> "BA", "ZZ" -> "AAA". */
export function nextLetters(letters: string): string {
  return ordinalToLetters(lettersToOrdinal(letters) + 1);
}
