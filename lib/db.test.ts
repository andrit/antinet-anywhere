import { describe, it, expect } from "vitest";
import { checkDb } from "./db";

/**
 * `checkDb` takes its probe as a parameter, so the error-handling logic is testable without a
 * database and without mocking the `postgres` module. Dependency injection is what buys that.
 */
describe("checkDb", () => {
  it("reports ok when the probe succeeds", async () => {
    expect(await checkDb(async () => undefined)).toEqual({ ok: true });
  });

  it("reports not-ok with the message when the probe fails", async () => {
    const result = await checkDb(async () => {
      throw new Error("connect ECONNREFUSED 127.0.0.1:27017");
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/ECONNREFUSED/);
  });

  it("does not throw when the probe throws", async () => {
    // The health endpoint must stay up to REPORT that a dependency is down. If this rethrew, a
    // dead database would look like a dead application.
    await expect(checkDb(async () => {
      throw new Error("boom");
    })).resolves.toBeDefined();
  });

  it("handles a non-Error rejection", async () => {
    const result = await checkDb(async () => {
      throw "string failure";
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("string failure");
  });
});
