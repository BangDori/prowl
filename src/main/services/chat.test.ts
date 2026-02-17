/** 채팅 서비스 유닛 테스트 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn().mockReturnValue("mock-model"),
}));

import { generateText } from "ai";
import { sendChatMessage } from "./chat";

const mockGenerateText = vi.mocked(generateText);

describe("chat 서비스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("API 키가 없으면 에러를 반환한다", async () => {
    delete process.env.OPENAI_API_KEY;

    const result = await sendChatMessage("안녕", []);

    expect(result.success).toBe(false);
    expect(result.error).toContain("OPENAI_API_KEY");
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it("generateText를 호출하고 응답을 반환한다", async () => {
    mockGenerateText.mockResolvedValue({ text: "안녕하세요!" } as Awaited<
      ReturnType<typeof generateText>
    >);

    const result = await sendChatMessage("안녕", []);

    expect(result.success).toBe(true);
    expect(result.message?.role).toBe("assistant");
    expect(result.message?.content).toBe("안녕하세요!");
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "mock-model",
        messages: [{ role: "user", content: "안녕" }],
      }),
    );
  });

  it("히스토리를 messages에 포함한다", async () => {
    mockGenerateText.mockResolvedValue({ text: "응답" } as Awaited<
      ReturnType<typeof generateText>
    >);

    const history = [
      { id: "1", role: "user" as const, content: "이전 질문", timestamp: 1000 },
      { id: "2", role: "assistant" as const, content: "이전 답변", timestamp: 2000 },
    ];

    await sendChatMessage("새 질문", history);

    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: "user", content: "이전 질문" },
          { role: "assistant", content: "이전 답변" },
          { role: "user", content: "새 질문" },
        ],
      }),
    );
  });

  it("API 에러 시 실패를 반환한다", async () => {
    mockGenerateText.mockRejectedValue(new Error("Rate limit exceeded"));

    const result = await sendChatMessage("안녕", []);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Rate limit exceeded");
  });
});
