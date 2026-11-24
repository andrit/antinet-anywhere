import { describe, it, expect } from "vitest";
import { escapeRegExp, prefixMatcher } from "./browse";

describe("escapeRegExp", () => {
  it("escapes regex metacharacters", () => {
    expect(escapeRegExp("a.b*c+(d)")).toBe("a\\.b\\*c\\+\\(d\\)");
  });
  it("leaves plain letters alone", () => {
    expect(escapeRegExp("Kahneman")).toBe("Kahneman");
  });
});

describe("prefixMatcher", () => {
  it("matches a case-insensitive prefix", () => {
    expect(prefixMatcher("K").test("Kahneman, Daniel")).toBe(true);
    expect(prefixMatcher("k").test("Kahneman, Daniel")).toBe(true);
    expect(prefixMatcher("K").test("Ariely, Dan")).toBe(false);
  });
  it("anchors to the start, not anywhere", () => {
    expect(prefixMatcher("hneman").test("Kahneman")).toBe(false);
  });
  it("treats an injected pattern as a literal prefix (no regex injection)", () => {
    const m = prefixMatcher(".*");
    expect(m.source).toBe("^\\.\\*");
    expect(m.test(".*cognitive")).toBe(true);
    expect(m.test("cognitive")).toBe(false);
  });
  it("trims surrounding whitespace", () => {
    expect(prefixMatcher("  C ").test("Cognitive Bias")).toBe(true);
  });
});
