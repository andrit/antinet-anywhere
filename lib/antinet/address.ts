/**
 * The pure antinet address core: parse/validate, sort-key generation, and the sibling/child/parent
 * operations. No I/O, no database, no framework — everything here is a pure function of its input,
 * so it is testable without standing up the world and portable to any surface (PWA, XR, IoT).
 *
 * The grammar, the sort-key encoding, and the worked fixture table this is built against live in
 * design/antinet-address-grammar.md — that doc is the spec; this is its implementation.
 */
import { z } from "zod";
import { lettersToOrdinal, nextLetters } from "./letters";

/** One branch-path token: a number run or a letter run. */
export type Token =
  | { readonly kind: "num"; readonly value: number }
  | { readonly kind: "alpha"; readonly value: string };

/** A parsed address: a section integer and its (possibly empty) branch path. */
export interface ParsedAddress {
  readonly section: number;
  readonly branch: readonly Token[];
}

// A positive integer with no leading zero — used for both the section and each number token.
const POSITIVE_INT = /^[1-9]\d*$/;
// Maximal runs of digits OR letters; adjacent runs always differ in kind, so alternation is free.
const TOKEN_RUN = /\d+|[A-Z]+/g;

// ponytail: 6-digit zero-pad caps each encoded token at 999,999; past that the sort key mis-orders
// SILENTLY. ceiling: >999,999 per token (letter runs ~4+). upgrade: widen the pad + reindex. See
// design/antinet-address-grammar.md §7.
const SORT_KEY_WIDTH = 6;

function parseSection(raw: string): number {
  if (!POSITIVE_INT.test(raw)) {
    throw new Error(`Invalid section "${raw}": a section is a positive integer with no leading zero`);
  }
  return Number(raw);
}

function toToken(run: string): Token {
  if (/^[A-Z]+$/.test(run)) {
    return { kind: "alpha", value: run };
  }
  if (!POSITIVE_INT.test(run)) {
    throw new Error(`Invalid number token "${run}": no leading zeros, must be >= 1`);
  }
  return { kind: "num", value: Number(run) };
}

function tokenizeBranch(branch: string): Token[] {
  const runs = branch.match(TOKEN_RUN) ?? [];
  // If the runs don't rejoin to the input exactly, a stray character sat between/within them.
  if (runs.join("") !== branch) {
    throw new Error(`Invalid branch path "${branch}": only A-Z and digits are allowed`);
  }
  const tokens = runs.map(toToken);
  if (tokens.length === 0 || tokens[0].kind !== "num") {
    throw new Error(`Invalid branch path "${branch}": must start with a number`);
  }
  return tokens;
}

/** Parse and validate an address into its structured form. Throws with a specific message. */
export function parseAddress(raw: string): ParsedAddress {
  const clean = raw.trim().toUpperCase();
  if (clean.length === 0) {
    throw new Error("Invalid address: empty");
  }
  const parts = clean.split("/");
  if (parts.length > 2) {
    throw new Error(`Invalid address "${raw}": at most one "/" is allowed`);
  }
  const section = parseSection(parts[0]);
  if (parts.length === 1) {
    return { section, branch: [] };
  }
  if (parts[1].length === 0) {
    throw new Error(`Invalid address "${raw}": a trailing "/" with no branch path`);
  }
  return { section, branch: tokenizeBranch(parts[1]) };
}

/** Non-throwing predicate form of parseAddress. */
export function isValidAddress(raw: string): boolean {
  try {
    parseAddress(raw);
    return true;
  } catch {
    return false;
  }
}

/** Render a parsed address back to its canonical string form. */
export function formatAddress(parsed: ParsedAddress): string {
  if (parsed.branch.length === 0) {
    return String(parsed.section);
  }
  const path = parsed.branch.map((t) => (t.kind === "num" ? String(t.value) : t.value)).join("");
  return `${parsed.section}/${path}`;
}

function pad(n: number): string {
  return String(n).padStart(SORT_KEY_WIDTH, "0");
}

function encodeToken(token: Token): string {
  return token.kind === "num" ? `N${pad(token.value)}` : `L${pad(lettersToOrdinal(token.value))}`;
}

/**
 * The normalized sort key: a plain ascending index on it reproduces physical box order. Letters
 * encode by their base-26 VALUE (so Z=26 < AA=27), and the "." join makes every parent sort
 * immediately before its children. See design/antinet-address-grammar.md §5.
 */
export function generateSortKey(raw: string): string {
  const { section, branch } = parseAddress(raw);
  return [`N${pad(section)}`, ...branch.map(encodeToken)].join(".");
}

/** Comparator over addresses, by sort key — binary (code-point), matching a MongoDB index. */
export function compareAddresses(a: string, b: string): number {
  const ka = generateSortKey(a);
  const kb = generateSortKey(b);
  if (ka < kb) return -1;
  if (ka > kb) return 1;
  return 0;
}

/** The next card one level deeper: append the opposite-type token at its first value. */
export function child(raw: string): string {
  const { section, branch } = parseAddress(raw);
  const last = branch[branch.length - 1]; // undefined for a section header
  const appendAlpha = last !== undefined && last.kind === "num";
  const appended: Token = appendAlpha ? { kind: "alpha", value: "A" } : { kind: "num", value: 1 };
  return formatAddress({ section, branch: [...branch, appended] });
}

/** The next card at the same level: increment the last token. Section headers have no sibling. */
export function sibling(raw: string): string {
  const { section, branch } = parseAddress(raw);
  const last = branch[branch.length - 1];
  if (last === undefined) {
    throw new Error(
      `Section ${section} has no computed sibling: sections are free-choice, pick the next one deliberately`,
    );
  }
  const incremented: Token =
    last.kind === "num"
      ? { kind: "num", value: last.value + 1 }
      : { kind: "alpha", value: nextLetters(last.value) };
  return formatAddress({ section, branch: [...branch.slice(0, -1), incremented] });
}

/** The card one level shallower (drop the last token); null for a bare section header. */
export function parent(raw: string): string | null {
  const { section, branch } = parseAddress(raw);
  if (branch.length === 0) {
    return null;
  }
  return formatAddress({ section, branch: branch.slice(0, -1) });
}

/**
 * Zod field for an address string: validates via the pure core and normalizes to canonical form
 * (uppercased, trimmed). Shared by every aggregate that references an address (`_id`, `links`,
 * `entryPoints`, `processedToMainId`), so the rule lives in exactly one place.
 *
 * This deliberately uses `.transform` — the LLM-structured-output guidance says to avoid it, but
 * that is about schemas a model generates; here Zod is our runtime validation boundary, which is
 * exactly where `.transform`/`.refine` belong.
 */
export const addressSchema = z.string().transform((raw, ctx) => {
  try {
    return formatAddress(parseAddress(raw));
  } catch (err) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: err instanceof Error ? err.message : "invalid address",
    });
    return z.NEVER;
  }
});
