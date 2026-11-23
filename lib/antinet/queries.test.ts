import { describe, it, expect } from "vitest";
import { segmentDepth, subtreeRange, selectDirectChildren } from "./queries";
import { generateSortKey } from "./address";
import { newMainCard, type MainCard } from "./main-card";

const NOW = new Date("2026-11-22T00:00:00.000Z");
const card = (id: string): MainCard => newMainCard({ _id: id, title: "t", body: "b" }, NOW);

describe("segmentDepth", () => {
  it.each([
    ["3200", 1],
    ["3200/4", 2],
    ["3200/4B", 3],
    ["3200/4B1A", 5],
  ])("%s has depth %i", (address, depth) => {
    expect(segmentDepth(generateSortKey(address))).toBe(depth);
  });
});

describe("subtreeRange", () => {
  it("brackets exactly the descendants of an address", () => {
    const range = subtreeRange("3200/4B");
    const inSubtree = (address: string): boolean => {
      const key = generateSortKey(address);
      return key >= range.$gte && key < range.$lt;
    };
    // Descendants fall inside:
    expect(inSubtree("3200/4B1")).toBe(true);
    expect(inSubtree("3200/4B1A")).toBe(true);
    expect(inSubtree("3200/4B1A1")).toBe(true);
    // The card itself, siblings, and cousins fall outside:
    expect(inSubtree("3200/4B")).toBe(false);
    expect(inSubtree("3200/4C")).toBe(false);
    expect(inSubtree("3200/4BA")).toBe(false); // a later letter-sibling (BA), not a child of 4B
    expect(inSubtree("3200/4A9")).toBe(false);
    expect(inSubtree("3200/5")).toBe(false);
  });
});

describe("selectDirectChildren", () => {
  it("keeps only the anchor's direct children, not grandchildren", () => {
    const descendants = [card("3200/4A"), card("3200/4A1"), card("3200/4B"), card("3200/4B1")];
    const direct = selectDirectChildren("3200/4", descendants).map((c) => c._id);
    expect(direct).toEqual(["3200/4A", "3200/4B"]);
  });

  it("treats a section header's root notes as its direct children", () => {
    const descendants = [card("3200/1"), card("3200/4"), card("3200/4A")];
    const direct = selectDirectChildren("3200", descendants).map((c) => c._id);
    expect(direct).toEqual(["3200/1", "3200/4"]);
  });

  it("returns nothing when there are no children", () => {
    expect(selectDirectChildren("3200/4", [])).toEqual([]);
  });
});
