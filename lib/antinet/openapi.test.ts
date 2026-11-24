import { describe, it, expect } from "vitest";
import { buildOpenApiDocument } from "./openapi";

const doc = buildOpenApiDocument();

describe("OpenAPI contract", () => {
  it("is an OpenAPI 3.0 document for this app", () => {
    expect(doc.openapi).toMatch(/^3\./);
    expect(doc.info.title).toBe("antinet-pwa API");
  });

  it("documents every slice-1 route", () => {
    expect(Object.keys(doc.paths).sort()).toEqual([
      "/api/bib",
      "/api/bib/{slug}",
      "/api/bib/{slug}/notes",
      "/api/bib/{slug}/promote",
      "/api/index",
      "/api/index/{keyword}",
      "/api/main",
      "/api/main/{address}",
    ]);
  });

  it("defines the request and circuit-response schemas", () => {
    const names = Object.keys(doc.components.schemas);
    for (const name of [
      "MainCardInput",
      "MainCard",
      "MainCardView",
      "BibCardInput",
      "BibCard",
      "BibCardView",
      "IndexCardInput",
      "IndexCard",
      "IndexCardView",
      "AddReadingNote",
      "Promote",
      "PromoteResult",
      "DeleteResult",
      "MainDeleteResult",
      "Error",
    ]) {
      expect(names).toContain(name);
    }
  });

  it("is GENERATED from the Zod schemas, not hand-written (carries the 600-char body cap)", () => {
    const main = doc.components.schemas.MainCardInput as { properties: { body: { maxLength?: number } } };
    expect(main.properties.body.maxLength).toBe(600);
  });

  it("marks create request bodies as required", () => {
    expect(doc.paths["/api/main"].post.requestBody.required).toBe(true);
  });
});
