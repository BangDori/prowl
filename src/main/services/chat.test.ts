import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreate, mockGetApiKey } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockGetApiKey: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

vi.mock("./settings", () => ({
  getApiKey: mockGetApiKey,
}));

import type { ChatMessage } from "../../shared/types";
import { sendChatMessage } from "./chat";

describe("chat 서비스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendChatMessage", () => {
    it("API 키가 없으면 에러를 반환한다", async () => {
      mockGetApiKey.mockReturnValue("");

      const result = await sendChatMessage("안녕", []);

      expect(result).toEqual({
        success: false,
        error: "API 키가 설정되지 않았습니다.",
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("대화 내역과 새 메시지를 Claude API에 전달한다", async () => {
      mockGetApiKey.mockReturnValue("sk-ant-test-key");
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "안녕하세요! 무엇을 도와드릴까요?" }],
      });

      const history: ChatMessage[] = [
        { id: "user_1", role: "user", content: "첫 번째 메시지", timestamp: 1000 },
        { id: "msg_1", role: "assistant", content: "첫 번째 응답", timestamp: 2000 },
      ];

      const result = await sendChatMessage("두 번째 메시지", history);

      // API 호출 검증
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [
            { role: "user", content: "첫 번째 메시지" },
            { role: "assistant", content: "첫 번째 응답" },
            { role: "user", content: "두 번째 메시지" },
          ],
        }),
      );

      // 성공 응답 검증
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.message?.role).toBe("assistant");
      expect(result.message?.content).toBe("안녕하세요! 무엇을 도와드릴까요?");
      expect(result.message?.id).toMatch(/^msg_/);
      expect(result.message?.timestamp).toBeTypeOf("number");
    });

    it("빈 대화 내역으로 첫 메시지를 보낼 수 있다", async () => {
      mockGetApiKey.mockReturnValue("sk-ant-test-key");
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "반갑습니다!" }],
      });

      const result = await sendChatMessage("안녕", []);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: "user", content: "안녕" }],
        }),
      );
      expect(result.success).toBe(true);
      expect(result.message?.content).toBe("반갑습니다!");
    });

    it("API 호출 실패 시 에러 메시지를 반환한다", async () => {
      mockGetApiKey.mockReturnValue("sk-ant-test-key");
      mockCreate.mockRejectedValue(new Error("Rate limit exceeded"));

      const result = await sendChatMessage("안녕", []);

      expect(result).toEqual({
        success: false,
        error: "Rate limit exceeded",
      });
    });

    it("Error가 아닌 예외도 처리한다", async () => {
      mockGetApiKey.mockReturnValue("sk-ant-test-key");
      mockCreate.mockRejectedValue("unknown error");

      const result = await sendChatMessage("안녕", []);

      expect(result).toEqual({
        success: false,
        error: "알 수 없는 오류",
      });
    });

    it("text 타입이 아닌 응답은 빈 문자열로 처리한다", async () => {
      mockGetApiKey.mockReturnValue("sk-ant-test-key");
      mockCreate.mockResolvedValue({
        content: [{ type: "image", source: {} }],
      });

      const result = await sendChatMessage("이미지 생성해줘", []);

      expect(result.success).toBe(true);
      expect(result.message?.content).toBe("");
    });

    it("시스템 프롬프트를 포함하여 API를 호출한다", async () => {
      mockGetApiKey.mockReturnValue("sk-ant-test-key");
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "ok" }],
      });

      await sendChatMessage("테스트", []);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining("Prowl"),
        }),
      );
    });
  });
});
