import { describe, it, expect } from "vitest";
import {
  parseAddress,
  isValidAddress,
  formatAddress,
  generateSortKey,
  compareAddresses,
  child,
  sibling,
  parent,
  addressSchema,
} from "./address";

/**
 * The sort-key fixtures ARE the worked table in design/antinet-address-grammar.md §5, copied
 * verbatim. They are listed in exact physical box order, which the sort test below relies on.
 */
const SORT_KEY_FIXTURES: [string, string][] = [
  ["3200", "N003200"],
  ["3200/1", "N003200.N000001"],
  ["3200/4", "N003200.N000004"],
  ["3200/4A", "N003200.N000004.L000001"],
  ["3200/4A1", "N003200.N000004.L000001.N000001"],
  ["3200/4B", "N003200.N000004.L000002"],
  ["3200/4B1", "N003200.N000004.L000002.N000001"],
  ["3200/4B1A", "N003200.N000004.L000002.N000001.L000001"],
  ["3200/4C", "N003200.N000004.L000003"],
  ["3200/4Z", "N003200.N000004.L000026"],
  ["3200/4AA", "N003200.N000004.L000027"],
  ["3200/4AB", "N003200.N000004.L000028"],
  ["3200/5", "N003200.N000005"],
  ["3200/10", "N003200.N000010"],
];

describe("generateSortKey", () => {
  it.each(SORT_KEY_FIXTURES)("%s -> %s", (address, key) => {
    expect(generateSortKey(address)).toBe(key);
  });

  it("throws on an invalid address", () => {
    expect(() => generateSortKey("3200/B")).toThrow();
  });
});

describe("sort order (the whole point)", () => {
  const physical = SORT_KEY_FIXTURES.map(([addr]) => addr);

  it("sorting by sortKey reproduces physical box order", () => {
    const shuffled = [...physical].reverse();
    expect([...shuffled].sort(compareAddresses)).toEqual(physical);
  });

  it("orders numbers numerically: 5 before 10", () => {
    expect(compareAddresses("3200/5", "3200/10")).toBe(-1);
  });

  it("orders letters length-first (spreadsheet): Z before AA", () => {
    expect(compareAddresses("3200/4Z", "3200/4AA")).toBe(-1);
  });

  it("sorts a parent immediately before its children", () => {
    expect(compareAddresses("3200/4", "3200/4A")).toBe(-1);
    expect(compareAddresses("3200", "3200/1")).toBe(-1);
  });

  it("is reflexive (equal addresses compare 0)", () => {
    expect(compareAddresses("3200/4B1", "3200/4B1")).toBe(0);
  });
});

describe("parseAddress", () => {
  it("parses a bare section header", () => {
    expect(parseAddress("3200")).toEqual({ section: 3200, branch: [] });
  });

  it("parses a branched address into alternating tokens", () => {
    expect(parseAddress("3200/4B1")).toEqual({
      section: 3200,
      branch: [
        { kind: "num", value: 4 },
        { kind: "alpha", value: "B" },
        { kind: "num", value: 1 },
      ],
    });
  });

  it("normalizes case and surrounding whitespace", () => {
    expect(parseAddress("  3200/4b1a ")).toEqual(parseAddress("3200/4B1A"));
  });

  it.each([
    ["", "empty"],
    ["   ", "whitespace only"],
    ["A200", "letters before the slash"],
    ["3200/", "trailing slash"],
    ["3200//4", "double slash"],
    ["3200/4/5", "two slashes"],
    ["3200/B", "branch starts with a letter"],
    ["3200/04", "leading zero in a number token"],
    ["04/1", "leading zero in the section"],
    ["3200/4B!", "stray character"],
    ["3200/!", "branch path with no number or letter run"],
  ])("rejects %j (%s)", (bad) => {
    expect(() => parseAddress(bad)).toThrow();
  });
});

describe("isValidAddress", () => {
  it("is true for a valid address", () => {
    expect(isValidAddress("3200/4B1")).toBe(true);
  });
  it("is false for an invalid address", () => {
    expect(isValidAddress("3200/B")).toBe(false);
  });
});

describe("child", () => {
  it.each([
    ["3200", "3200/1"],
    ["3200/4", "3200/4A"],
    ["3200/4B", "3200/4B1"],
    ["3200/4B1", "3200/4B1A"],
  ])("child(%s) = %s", (from, to) => {
    expect(child(from)).toBe(to);
  });
});

describe("sibling", () => {
  it.each([
    ["3200/4", "3200/5"],
    ["3200/4B", "3200/4C"],
    ["3200/4Z", "3200/4AA"],
    ["3200/9", "3200/10"],
  ])("sibling(%s) = %s", (from, to) => {
    expect(sibling(from)).toBe(to);
  });

  it("throws for a bare section (sections are free-choice)", () => {
    expect(() => sibling("3200")).toThrow();
  });
});

describe("parent", () => {
  it.each([
    ["3200/4B1A", "3200/4B1"],
    ["3200/4B", "3200/4"],
    ["3200/4", "3200"],
  ])("parent(%s) = %s", (from, to) => {
    expect(parent(from)).toBe(to);
  });

  it("returns null for a bare section header", () => {
    expect(parent("3200")).toBeNull();
  });
});

describe("formatAddress round-trips with parseAddress", () => {
  it.each(["3200", "3200/1", "3200/4B1A", "3200/4AA", "3200/10"])("%s", (address) => {
    expect(formatAddress(parseAddress(address))).toBe(address);
  });
});

describe("addressSchema (zod field)", () => {
  it("normalizes a valid address to canonical form", () => {
    expect(addressSchema.parse("  3200/4b1 ")).toBe("3200/4B1");
  });

  it("fails validation on an invalid address", () => {
    const result = addressSchema.safeParse("3200/B");
    expect(result.success).toBe(false);
  });
});
