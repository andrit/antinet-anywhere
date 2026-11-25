import { describe, it, expect } from "vitest";
import { firstFree } from "./suggest";
import { sibling } from "./address";

const taken = (addrs: string[]) => (a: string) => addrs.includes(a);

describe("firstFree", () => {
  it("returns the start when it is free", () => {
    expect(firstFree("3200/4A", sibling, taken([]))).toBe("3200/4A");
  });

  it("skips taken letter siblings to the next free slot", () => {
    expect(firstFree("3200/4A", sibling, taken(["3200/4A", "3200/4B"]))).toBe("3200/4C");
  });

  it("skips taken number siblings", () => {
    expect(firstFree("3200/1", sibling, taken(["3200/1", "3200/2", "3200/3"]))).toBe("3200/4");
  });

  it("rolls letters over spreadsheet-style (Z -> AA)", () => {
    expect(firstFree("3200/4Z", sibling, taken(["3200/4Z"]))).toBe("3200/4AA");
  });
});
