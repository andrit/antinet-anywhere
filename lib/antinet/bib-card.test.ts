import { describe, it, expect } from "vitest";
import { newBibCard, type BibCardInput } from "./bib-card";

const NOW = new Date("2026-11-22T00:00:00.000Z");

describe("newBibCard", () => {
  it("builds a valid document, normalizing the slug and defaulting fields", () => {
    const card = newBibCard(
      { _id: "Kahneman_2011", authorSort: "Kahneman, Daniel", title: "Thinking, Fast and Slow" },
      NOW,
    );
    expect(card._id).toBe("kahneman_2011"); // lowercased
    expect(card.sourceType).toBe("book"); // default
    expect(card.readingNotes).toEqual([]); // default
    expect(card.year).toBeUndefined(); // optional, absent (not null)
    expect(card.createdAt).toEqual(NOW);
  });

  it("accepts a disambiguated slug, a year, and reading notes with a processed pointer", () => {
    const card = newBibCard(
      {
        _id: "kahneman_2011a",
        authorSort: "Kahneman, Daniel",
        title: "A Second 2011 Source",
        year: 2011,
        sourceType: "article",
        readingNotes: [{ page: "85", note: "System 1 jumps to conclusions", processedToMainId: "3200/4b" }],
      },
      NOW,
    );
    expect(card.year).toBe(2011);
    expect(card.readingNotes[0].processedToMainId).toBe("3200/4B"); // normalized
  });

  const invalid: BibCardInput[] = [
    { _id: "kahneman", authorSort: "K", title: "T" }, // slug without underscore
    { _id: "k_2011", authorSort: " ", title: "T" }, // empty authorSort
    { _id: "k_2011", authorSort: "K", title: "" }, // empty title
    { _id: "k_2011", authorSort: "K", title: "T", readingNotes: [{ page: "", note: "x" }] }, // note missing page
  ];
  it.each(invalid)("rejects invalid input #%#", (input) => {
    expect(() => newBibCard(input, NOW)).toThrow();
  });

  it("rejects an unknown sourceType", () => {
    const bad = { _id: "k_2011", authorSort: "K", title: "T", sourceType: "tweet" } as unknown as BibCardInput;
    expect(() => newBibCard(bad, NOW)).toThrow();
  });
});
