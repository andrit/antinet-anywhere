import { describe, it, expect } from "vitest";
import { newMainCard, MainCardSchema, CitationRefSchema, type MainCardInput } from "./main-card";

const NOW = new Date("2026-11-22T00:00:00.000Z");

describe("newMainCard", () => {
  it("builds a valid document with a derived sortKey and injected timestamps", () => {
    const card = newMainCard(
      {
        _id: "3200/4b1",
        title: "  System 1 jumps  ",
        body: "An atomic idea in my own words.",
        citations: [{ bibId: "kahneman_2011", page: "85" }],
      },
      NOW,
    );
    expect(card._id).toBe("3200/4B1"); // normalized
    expect(card.sortKey).toBe("N003200.N000004.L000002.N000001"); // derived
    expect(card.title).toBe("System 1 jumps"); // trimmed
    expect(card.links).toEqual([]); // defaulted
    expect(card.citations).toEqual([{ bibId: "kahneman_2011", page: "85" }]);
    expect(card.createdAt).toEqual(NOW);
    expect(card.updatedAt).toEqual(NOW);
  });

  it("normalizes link addresses", () => {
    const card = newMainCard({ _id: "3200/4", title: "t", body: "b", links: ["1100/2a"] }, NOW);
    expect(card.links).toEqual(["1100/2A"]);
  });

  const invalid: MainCardInput[] = [
    { _id: "3200/B", title: "t", body: "b" }, // bad address
    { _id: "3200/4", title: "   ", body: "b" }, // empty title
    { _id: "3200/4", title: "x".repeat(121), body: "b" }, // title too long
    { _id: "3200/4", title: "t", body: "x".repeat(601) }, // body too long
    { _id: "3200/4", title: "t", body: "b", citations: [{ bibId: "" }] }, // citation without bibId
    { _id: "3200/4", title: "t", body: "b", links: ["nope"] }, // bad link address
  ];
  it.each(invalid)("rejects invalid input #%#", (input) => {
    expect(() => newMainCard(input, NOW)).toThrow();
  });
});

describe("MainCardSchema integrity", () => {
  it("rejects a document whose sortKey was not derived from _id", () => {
    const result = MainCardSchema.safeParse({
      _id: "3200/4",
      title: "t",
      body: "b",
      links: [],
      citations: [],
      sortKey: "WRONG",
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(result.success).toBe(false);
  });
});

describe("CitationRefSchema", () => {
  it("allows an omitted page", () => {
    expect(CitationRefSchema.parse({ bibId: "kahneman_2011" })).toEqual({ bibId: "kahneman_2011" });
  });
});
