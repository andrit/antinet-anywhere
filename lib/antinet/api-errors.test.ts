import { describe, it, expect } from "vitest";
import { z } from "zod";
import { toApiError, isDuplicateKeyError, HttpError } from "./api-errors";

describe("isDuplicateKeyError", () => {
  it.each([
    [{ code: 11000 }, true],
    [{ code: 121 }, false],
    [{ message: "oops" }, false],
    [null, false],
    ["nope", false],
  ])("%o -> %s", (input, expected) => {
    expect(isDuplicateKeyError(input)).toBe(expected);
  });
});

describe("toApiError", () => {
  it("maps a ZodError to 400 with flattened details", () => {
    const err = z.object({ a: z.string() }).safeParse({});
    expect(err.success).toBe(false);
    const api = toApiError(err.success ? null : err.error);
    expect(api.status).toBe(400);
    expect(api.body.error).toBe("Validation failed");
    expect(api.body.details).toBeDefined();
  });

  it("maps an HttpError to its own status and message", () => {
    const api = toApiError(new HttpError(404, "Bib card not found"));
    expect(api.status).toBe(404);
    expect(api.body.error).toBe("Bib card not found");
  });

  it("maps invalid JSON (SyntaxError) to 400", () => {
    const api = toApiError(new SyntaxError("Unexpected token"));
    expect(api.status).toBe(400);
    expect(api.body.error).toBe("Invalid JSON body");
  });

  it("maps a duplicate-key error to 409", () => {
    const api = toApiError({ code: 11000, message: "E11000 dup key" });
    expect(api.status).toBe(409);
  });

  it("maps a generic Error to 500 with its message", () => {
    const api = toApiError(new Error("boom"));
    expect(api.status).toBe(500);
    expect(api.body.error).toBe("boom");
  });

  it("maps a non-Error throw to a generic 500", () => {
    const api = toApiError("string failure");
    expect(api.status).toBe(500);
    expect(api.body.error).toBe("Internal server error");
  });
});
