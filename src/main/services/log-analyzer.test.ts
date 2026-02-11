/** 로그 분석기 유닛 테스트 */
import { describe, expect, it } from "vitest";
import { analyzeLogContent } from "./log-analyzer";

describe("analyzeLogContent", () => {
  it("빈 로그는 성공으로 판단", () => {
    expect(analyzeLogContent([])).toEqual({ success: true, message: undefined });
  });

  it("실패 패턴 감지", () => {
    const lines = ["Starting job...", "Processing...", "Error: something failed"];
    const result = analyzeLogContent(lines);
    expect(result.success).toBe(false);
    expect(result.message).toContain("Error");
  });

  it("성공 패턴이 실패를 덮어씀", () => {
    const lines = ["Error: temporary issue", "Retrying...", "Task complete"];
    const result = analyzeLogContent(lines);
    expect(result.success).toBe(true);
  });

  it("성공 패턴만 있으면 성공", () => {
    const lines = ["Starting...", "Processing...", "리포트 완료"];
    expect(analyzeLogContent(lines).success).toBe(true);
  });

  it("에러 메시지를 100자로 자름", () => {
    const longError = `Error: ${"a".repeat(200)}`;
    const result = analyzeLogContent([longError]);
    expect(result.message?.length).toBeLessThanOrEqual(100);
  });
});
