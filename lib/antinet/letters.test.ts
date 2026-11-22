import { describe, it, expect } from "vitest";
import { lettersToOrdinal, ordinalToLetters, nextLetters } from "./letters";

const TO_ORDINAL: [string, number][] = [
  ["A", 1],
  ["B", 2],
  ["Z", 26],
  ["AA", 27],
  ["AB", 28],
  ["AZ", 52],
  ["BA", 53],
  ["ZZ", 702],
  ["AAA", 703],
];

describe("lettersToOrdinal", () => {
  it.each(TO_ORDINAL)("%s -> %i", (letters, ordinal) => {
    expect(lettersToOrdinal(letters)).toBe(ordinal);
  });

  it.each(["", "A1", "a", "4", "A B"])("rejects %j", (bad) => {
    expect(() => lettersToOrdinal(bad)).toThrow();
  });
});

describe("ordinalToLetters", () => {
  it.each(TO_ORDINAL)("%i <- %s", (letters, ordinal) => {
    expect(ordinalToLetters(ordinal)).toBe(letters);
  });

  it("is the exact inverse of lettersToOrdinal across a range", () => {
    for (let n = 1; n <= 1000; n++) {
      expect(lettersToOrdinal(ordinalToLetters(n))).toBe(n);
    }
  });

  it.each([0, -1, 1.5])("rejects non-positive / non-integer %j", (bad) => {
    expect(() => ordinalToLetters(bad)).toThrow();
  });
});

describe("nextLetters", () => {
  it.each([
    ["A", "B"],
    ["Y", "Z"],
    ["Z", "AA"],
    ["AA", "AB"],
    ["AZ", "BA"],
    ["ZZ", "AAA"],
  ])("%s -> %s", (from, to) => {
    expect(nextLetters(from)).toBe(to);
  });
});
