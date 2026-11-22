import { describe, it, expect } from "vitest";
import { parseEnv } from "./env";

/**
 * These test the FUNCTIONAL CORE — `parseEnv` is pure, so there is no mocking of `process.env`
 * anywhere here. If you find yourself needing to stub a global to test logic, the seam is in the
 * wrong place: extract the decision into a function that takes values.
 */

const valid = {
  DATABASE_URL: "mongodb://localhost:27017",
  DB_NAME: "app",
};

describe("parseEnv", () => {
  it("accepts a minimal valid environment", () => {
    const env = parseEnv(valid);
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
  });

  it("applies defaults for optional variables", () => {
    const env = parseEnv(valid);
    expect(env.NODE_ENV).toBe("development");
    expect(env.APP_URL).toBe("http://localhost:3000");
  });

  it("keeps explicit values over defaults", () => {
    const env = parseEnv({ ...valid, NODE_ENV: "production", APP_URL: "https://example.com" });
    expect(env.NODE_ENV).toBe("production");
    expect(env.APP_URL).toBe("https://example.com");
  });

  it("throws when a required variable is missing", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("names the offending variable in the message", () => {
    // The whole point of fail-fast validation: the error says which variable, not just "invalid".
    expect(() => parseEnv({ DATABASE_URL: "not-a-url" })).toThrow(/DATABASE_URL/);
  });

  it("points at .env.example so the fix is obvious", () => {
    expect(() => parseEnv({})).toThrow(/\.env\.example/);
  });

  it("rejects an unknown NODE_ENV rather than passing it through", () => {
    expect(() => parseEnv({ ...valid, NODE_ENV: "staging" })).toThrow(/NODE_ENV/);
  });

  it("reports every problem at once, not just the first", () => {
    // One run should surface all misconfiguration — fixing them one deploy at a time is the
    // failure mode this avoids.
    try {
      parseEnv({ DATABASE_URL: "nope", NODE_ENV: "staging" });
      expect.unreachable("should have thrown");
    } catch (err) {
      const msg = String(err);
      expect(msg).toMatch(/DATABASE_URL/);
      expect(msg).toMatch(/NODE_ENV/);
    }
  });
});
