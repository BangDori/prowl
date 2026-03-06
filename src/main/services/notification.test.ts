/** formatNotificationBody 단위 테스트 */
import { describe, expect, it } from "vitest";
import { formatNotificationBody } from "./notification-format";

describe("formatNotificationBody", () => {
  it("15자 이하면 그대로 반환", () => {
    expect(formatNotificationBody("안녕하세요")).toBe("안녕하세요");
  });

  it("15자 초과 시 ... 추가", () => {
    const input = "이것은 매우 긴 AI 응답 메시지입니다";
    const result = formatNotificationBody(input);
    expect(result).toBe(`${input.slice(0, 15)}...`);
    expect(result.endsWith("...")).toBe(true);
  });

  it("볼드 마커 제거 (**text**)", () => {
    expect(formatNotificationBody("**ㅇㅇ** 입니다")).toBe("ㅇㅇ 입니다");
  });

  it("코드 블럭 내용 추출 (```...```)", () => {
    expect(formatNotificationBody("```hi``` 입니다")).toBe("hi 입니다");
  });

  it("인라인 코드 내용 추출 (`code`)", () => {
    expect(formatNotificationBody("결과: `value` 확인")).toBe("결과: value 확인");
  });

  it("이탤릭 마커 제거 (*text*)", () => {
    expect(formatNotificationBody("*강조* 텍스트")).toBe("강조 텍스트");
  });

  it("헤더 마커 제거 (# 제목)", () => {
    expect(formatNotificationBody("# 안녕하세요")).toBe("안녕하세요");
  });

  it("코드 블럭만 있으면 내용 반환", () => {
    expect(formatNotificationBody("```code only```")).toBe("code only");
  });

  it("복합 마크다운 + 트런케이션", () => {
    const result = formatNotificationBody("**굵은 텍스트**와 일반 텍스트가 함께");
    expect(result).toBe(`${"굵은 텍스트와 일반 텍스트가 함께".slice(0, 15)}...`);
  });
});
