import { describe, it, expect } from "vitest";
import type { Db } from "mongodb";
import { COLLECTIONS, mainCards, bibCards, indexCards } from "./collections";
import * as mainRepo from "./main-card-repo";
import * as bibRepo from "./bib-card-repo";
import * as indexRepo from "./index-card-repo";

// A fake Db that records which collection name each getter asked for. The getters take `db` as a
// parameter precisely so this needs no real database.
const fakeDb = {
  collection: (name: string) => ({ requestedName: name }),
} as unknown as Db;

describe("collection getters (dependency-injected)", () => {
  it("map to the names fixed in bounded-contexts.md", () => {
    expect(COLLECTIONS).toEqual({ main: "main_cards", bib: "bib_cards", index: "index_cards" });
  });

  it.each([
    [mainCards, "main_cards"],
    [bibCards, "bib_cards"],
    [indexCards, "index_cards"],
  ])("resolves the right collection", (getter, name) => {
    const collection = getter(fakeDb) as unknown as { requestedName: string };
    expect(collection.requestedName).toBe(name);
  });
});

// Smoke: the repositories are I/O shells (excluded from coverage), but we assert the circuit's
// surface exists so a rename or accidental deletion is caught by the suite.
describe("repository surface", () => {
  it("exposes the Main Box circuit operations", () => {
    for (const fn of ["insertMainCard", "getMainCard", "nextCard", "prevCard", "childrenOf", "backlinksTo", "mainCardsCiting"]) {
      expect(typeof (mainRepo as Record<string, unknown>)[fn]).toBe("function");
    }
  });

  it("exposes the Bib and Index operations", () => {
    expect(typeof bibRepo.insertBibCard).toBe("function");
    expect(typeof bibRepo.getBibCard).toBe("function");
    expect(typeof indexRepo.insertIndexCard).toBe("function");
    expect(typeof indexRepo.getIndexCard).toBe("function");
  });
});
