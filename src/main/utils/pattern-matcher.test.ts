import { describe, expect, it } from "vitest";
import { filterByPatterns, matchesAnyPattern } from "./pattern-matcher";

describe("matchesAnyPattern", () => {
  it("패턴이 비어있으면 항상 true", () => {
    expect(matchesAnyPattern("anything", [])).toBe(true);
  });

  it("패턴으로 시작하면 true", () => {
    expect(matchesAnyPattern("com.claude.daily", ["com.claude"])).toBe(true);
  });

  it("패턴으로 시작하지 않으면 false", () => {
    expect(matchesAnyPattern("org.other.job", ["com.claude"])).toBe(false);
  });

  it("여러 패턴 중 하나라도 매칭되면 true", () => {
    expect(matchesAnyPattern("org.other.job", ["com.claude", "org.other"])).toBe(true);
  });
});

describe("filterByPatterns", () => {
  const items = [
    { label: "com.claude.daily" },
    { label: "com.claude.weekly" },
    { label: "org.other.job" },
  ];

  it("패턴이 비어있으면 모든 항목 반환", () => {
    expect(filterByPatterns(items, [], (i) => i.label)).toHaveLength(3);
  });

  it("패턴에 매칭되는 항목만 필터링", () => {
    const result = filterByPatterns(items, ["com.claude"], (i) => i.label);
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.label.startsWith("com.claude"))).toBe(true);
  });
});
