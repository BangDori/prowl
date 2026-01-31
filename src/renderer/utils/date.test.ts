import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDateTime, formatRelativeTime } from "./date";

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("방금 전", () => {
    expect(formatRelativeTime(new Date("2025-01-15T11:59:30"))).toBe("방금 전");
  });

  it("N분 전", () => {
    expect(formatRelativeTime(new Date("2025-01-15T11:55:00"))).toBe("5분 전");
  });

  it("N시간 전", () => {
    expect(formatRelativeTime(new Date("2025-01-15T09:00:00"))).toBe("3시간 전");
  });

  it("N일 전", () => {
    expect(formatRelativeTime(new Date("2025-01-13T12:00:00"))).toBe("2일 전");
  });
});

describe("formatDateTime", () => {
  it("null이면 빈 문자열", () => {
    expect(formatDateTime(null)).toBe("");
  });

  it("날짜 포맷팅", () => {
    const result = formatDateTime(new Date("2025-01-15T14:30:00"));
    expect(result).toBeTruthy();
  });
});
