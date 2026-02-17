/** 채팅 서비스 유닛 테스트 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

const mockResponsesFn = vi.fn().mockReturnValue("mock-openai-model");
vi.mock("@ai-sdk/openai", () => ({
  openai: Object.assign(vi.fn().mockReturnValue("mock-openai-model"), {
    responses: mockResponsesFn,
  }),
}));

import { generateText } from "ai";
import { getProviderStatuses, sendChatMessage } from "./chat";

const mockGenerateText = vi.mocked(generateText);

describe("chat 서비스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("API 키가 없으면 안내 메시지를 반환한다", async () => {
    delete process.env.OPENAI_API_KEY;

    const result = await sendChatMessage("안녕", [], { provider: "openai", model: "gpt-4o" });

    expect(result.success).toBe(true);
    expect(result.message?.content).toContain("OPENAI_API_KEY");
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it("generateText를 호출하고 응답을 반환한다", async () => {
    mockGenerateText.mockResolvedValue({ text: "안녕하세요!" } as Awaited<
      ReturnType<typeof generateText>
    >);

    const result = await sendChatMessage("안녕", [], { provider: "openai", model: "gpt-4o" });

    expect(result.success).toBe(true);
    expect(result.message?.role).toBe("assistant");
    expect(result.message?.content).toBe("안녕하세요!");
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "mock-openai-model",
        messages: [{ role: "user", content: "안녕" }],
      }),
    );
  });

  it("config 없으면 OpenAI 기본값을 사용한다", async () => {
    mockGenerateText.mockResolvedValue({ text: "응답" } as Awaited<
      ReturnType<typeof generateText>
    >);

    const result = await sendChatMessage("안녕", []);

    expect(result.success).toBe(true);
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({ model: "mock-openai-model" }),
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

    await sendChatMessage("새 질문", history, { provider: "openai", model: "gpt-4o" });

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

    const result = await sendChatMessage("안녕", [], { provider: "openai", model: "gpt-4o" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Rate limit exceeded");
  });
});

describe("getProviderStatuses", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it("OpenAI 프로바이더 상태를 반환한다", () => {
    process.env.OPENAI_API_KEY = "test";

    const statuses = getProviderStatuses();

    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toMatchObject({ provider: "openai", available: true });
  });

  it("모델 목록이 포함된다", () => {
    const statuses = getProviderStatuses();

    expect(statuses[0].models.length).toBeGreaterThan(0);
    for (const model of statuses[0].models) {
      expect(model.provider).toBe("openai");
    }
  });
});
