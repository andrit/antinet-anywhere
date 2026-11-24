import { describe, it, expect } from "vitest";
import { partitionIndexRefs } from "./integrity";

describe("partitionIndexRefs", () => {
  it("deletes keywords whose only entry point is the removed address, pulls from the rest", () => {
    const refs = [
      { _id: "sole", entryPoints: ["3200/4A"] },
      { _id: "shared", entryPoints: ["3200/4A", "3200/9"] },
    ];
    expect(partitionIndexRefs(refs)).toEqual({ deleteKeywords: ["sole"], pullKeywords: ["shared"] });
  });

  it("handles an empty reference list", () => {
    expect(partitionIndexRefs([])).toEqual({ deleteKeywords: [], pullKeywords: [] });
  });

  it("treats every multi-entry card as a pull", () => {
    const refs = [
      { _id: "a", entryPoints: ["x", "y"] },
      { _id: "b", entryPoints: ["x", "y", "z"] },
    ];
    expect(partitionIndexRefs(refs).pullKeywords).toEqual(["a", "b"]);
    expect(partitionIndexRefs(refs).deleteKeywords).toEqual([]);
  });
});
