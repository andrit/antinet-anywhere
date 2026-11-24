import { describe, it, expect } from "vitest";
import {
  AddReadingNoteSchema,
  PromoteSchema,
  selectPromotableNote,
  buildPromotedMainInput,
} from "./promote";
import { HttpError } from "./api-errors";
import { newBibCard, type BibCard } from "./bib-card";

const NOW = new Date("2026-11-24T00:00:00.000Z");

const bibWith = (notes: { page: string; note: string; processedToMainId?: string }[]): BibCard =>
  newBibCard({ _id: "kahneman_2011", authorSort: "Kahneman", title: "T", readingNotes: notes }, NOW);

describe("AddReadingNoteSchema", () => {
  it("accepts page + note", () => {
    expect(AddReadingNoteSchema.parse({ page: "85", note: "System 1" })).toEqual({ page: "85", note: "System 1" });
  });
  it.each([{ page: "", note: "x" }, { page: "85", note: "" }])("rejects empty fields %o", (bad) => {
    expect(AddReadingNoteSchema.safeParse(bad).success).toBe(false);
  });
});

describe("PromoteSchema", () => {
  it("accepts a note index and a Main card without citations", () => {
    const parsed = PromoteSchema.parse({ noteIndex: 0, main: { _id: "3200/4a", title: "t", body: "b" } });
    expect(parsed.main._id).toBe("3200/4A");
    expect(parsed.noteIndex).toBe(0);
  });
  it("rejects a negative index and a bad address", () => {
    expect(PromoteSchema.safeParse({ noteIndex: -1, main: { _id: "3200/4", title: "t", body: "b" } }).success).toBe(false);
    expect(PromoteSchema.safeParse({ noteIndex: 0, main: { _id: "3200/B", title: "t", body: "b" } }).success).toBe(false);
  });
});

describe("selectPromotableNote", () => {
  it("returns an unprocessed note", () => {
    const note = selectPromotableNote(bibWith([{ page: "85", note: "System 1" }]), 0);
    expect(note.note).toBe("System 1");
  });
  it("throws 404 when the index is out of range", () => {
    try {
      selectPromotableNote(bibWith([]), 0);
      expect.unreachable("should throw");
    } catch (err) {
      expect((err as HttpError).status).toBe(404);
    }
  });
  it("throws 409 when the note was already promoted", () => {
    const bib = bibWith([{ page: "85", note: "x", processedToMainId: "3200/4A" }]);
    try {
      selectPromotableNote(bib, 0);
      expect.unreachable("should throw");
    } catch (err) {
      expect((err as HttpError).status).toBe(409);
    }
  });
});

describe("buildPromotedMainInput", () => {
  it("prepends the source citation from the note", () => {
    const note = { page: "85", note: "System 1" };
    const input = buildPromotedMainInput("kahneman_2011", note, { _id: "3200/4A", title: "t", body: "b" });
    expect(input.citations).toEqual([{ bibId: "kahneman_2011", page: "85" }]);
  });
});
