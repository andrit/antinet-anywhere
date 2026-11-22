import { describe, it, expect } from "vitest";
import { newIndexCard, type IndexCardInput } from "./index-card";

const NOW = new Date("2026-11-22T00:00:00.000Z");

describe("newIndexCard", () => {
  it("builds a valid document, normalizing keyword and entry points", () => {
    const card = newIndexCard(
      { _id: "  Cognitive Bias ", displayTerm: "Cognitive Bias", entryPoints: ["3200/4b", "3200/9"] },
      NOW,
    );
    expect(card._id).toBe("cognitive bias"); // trimmed + lowercased
    expect(card.entryPoints).toEqual(["3200/4B", "3200/9"]); // normalized
    expect(card.updatedAt).toEqual(NOW);
  });

  it("de-duplicates entry points after normalization", () => {
    const card = newIndexCard(
      { _id: "x", displayTerm: "X", entryPoints: ["3200/4B", "3200/4b", "  3200/4B "] },
      NOW,
    );
    expect(card.entryPoints).toEqual(["3200/4B"]);
  });

  it("allows exactly 4 entry points", () => {
    const card = newIndexCard(
      { _id: "x", displayTerm: "X", entryPoints: ["3200/1", "3200/2", "3200/3", "3200/4"] },
      NOW,
    );
    expect(card.entryPoints).toHaveLength(4);
  });

  const invalid: IndexCardInput[] = [
    { _id: "x", displayTerm: "X", entryPoints: [] }, // no entry points
    { _id: "x", displayTerm: "X", entryPoints: ["3200/1", "3200/2", "3200/3", "3200/4", "3200/5"] }, // > 4
    { _id: "x", displayTerm: "X", entryPoints: ["nope"] }, // bad address
    { _id: "x", displayTerm: " ", entryPoints: ["3200/1"] }, // empty displayTerm
    { _id: "   ", displayTerm: "X", entryPoints: ["3200/1"] }, // empty keyword
  ];
  it.each(invalid)("rejects invalid input #%#", (input) => {
    expect(() => newIndexCard(input, NOW)).toThrow();
  });
});
