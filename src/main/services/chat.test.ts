/** 채팅 서비스 유닛 테스트 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./memory", () => ({
  listMemories: vi.fn().mockReturnValue([]),
  addMemory: vi.fn(),
}));

vi.mock("./chat-rooms", () => ({
  saveChatMessages: vi.fn(),
}));

vi.mock("./chat-read-state", () => ({
  updateTrayBadge: vi.fn(),
}));

vi.mock("./settings", () => ({
  getSettings: vi.fn().mockReturnValue({ openaiApiKey: "" }),
}));

const mockTextStream = vi.fn();
vi.mock("ai", () => ({
  streamText: vi.fn().mockImplementation(() => ({
    textStream: mockTextStream(),
  })),
  stepCountIs: vi.fn().mockReturnValue("mock-stop-condition"),
  tool: vi.fn((def: unknown) => def),
}));

const mockResponsesFn = vi.fn().mockReturnValue("mock-openai-model");
const mockWebSearch = vi.fn().mockReturnValue({ type: "web_search" });
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn().mockReturnValue(
    Object.assign(vi.fn().mockReturnValue("mock-openai-model"), {
      responses: mockResponsesFn,
      tools: { webSearch: mockWebSearch },
    }),
  ),
}));

const mockSend = vi.fn();
vi.mock("../windows", () => ({
  getChatWindow: vi.fn().mockReturnValue({
    isDestroyed: () => false,
    webContents: { send: (...args: unknown[]) => mockSend(...args) },
  }),
}));

import { streamText } from "ai";
import { getProviderStatuses, streamChatMessage } from "./chat";
import { getSettings } from "./settings";

const mockStreamText = vi.mocked(streamText);

/** async iterable 헬퍼 */
async function* toAsyncIterable(chunks: string[]) {
  for (const chunk of chunks) yield chunk;
}

describe("chat 서비스", () => {
  const mockGetSettings = vi.mocked(getSettings);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockReturnValue({ openaiApiKey: "test-key" } as ReturnType<typeof getSettings>);
    delete process.env.OPENAI_API_KEY;
  });

  it("API 키가 없으면 안내 메시지를 stream-message로 전송한다", async () => {
    mockGetSettings.mockReturnValue({ openaiApiKey: "" } as ReturnType<typeof getSettings>);

    await streamChatMessage("room1", "안녕", [], { provider: "openai", model: "gpt-4o" });

    expect(mockSend).toHaveBeenCalledWith(
      "chat:stream-message",
      expect.objectContaining({ content: expect.stringContaining("Settings") }),
    );
    expect(mockSend).toHaveBeenCalledWith("chat:stream-done");
    expect(mockStreamText).not.toHaveBeenCalled();
  });

  it("streamText를 호출하고 메시지를 전송한다", async () => {
    mockTextStream.mockReturnValue(toAsyncIterable(["안녕하세요!"]));

    await streamChatMessage(
      "room1",
      "안녕",
      [{ id: "u1", role: "user", content: "안녕", timestamp: 1 }],
      { provider: "openai", model: "gpt-4o" },
    );

    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "mock-openai-model",
        messages: [{ role: "user", content: "안녕" }],
      }),
    );
    expect(mockSend).toHaveBeenCalledWith(
      "chat:stream-message",
      expect.objectContaining({ role: "assistant", content: "안녕하세요!" }),
    );
    expect(mockSend).toHaveBeenCalledWith("chat:stream-done");
  });

  it("config 없으면 OpenAI 기본값을 사용한다", async () => {
    mockTextStream.mockReturnValue(toAsyncIterable(["응답"]));

    await streamChatMessage("room1", "안녕", [
      { id: "u1", role: "user", content: "안녕", timestamp: 1 },
    ]);

    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({ model: "mock-openai-model" }),
    );
  });

  it("히스토리를 messages에 포함한다", async () => {
    mockTextStream.mockReturnValue(toAsyncIterable(["응답"]));

    const history = [
      { id: "1", role: "user" as const, content: "이전 질문", timestamp: 1000 },
      { id: "2", role: "assistant" as const, content: "이전 답변", timestamp: 2000 },
      { id: "3", role: "user" as const, content: "새 질문", timestamp: 3000 },
    ];

    await streamChatMessage("room1", "새 질문", history, { provider: "openai", model: "gpt-4o" });

    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: "user", content: "이전 질문" },
          { role: "assistant", content: "이전 답변" },
          { role: "user", content: "새 질문" },
        ],
      }),
    );
  });

  it("API 에러 시 stream-error를 전송한다", async () => {
    mockTextStream.mockImplementation(() => {
      throw new Error("Rate limit exceeded");
    });

    await streamChatMessage(
      "room1",
      "안녕",
      [{ id: "u1", role: "user", content: "안녕", timestamp: 1 }],
      { provider: "openai", model: "gpt-4o" },
    );

    expect(mockSend).toHaveBeenCalledWith("chat:stream-error", "Rate limit exceeded");
  });
});

describe("getProviderStatuses", () => {
  const mockGetSettings = vi.mocked(getSettings);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockReturnValue({ openaiApiKey: "" } as ReturnType<typeof getSettings>);
    delete process.env.OPENAI_API_KEY;
  });

  it("OpenAI 프로바이더 상태를 반환한다", () => {
    mockGetSettings.mockReturnValue({ openaiApiKey: "test" } as ReturnType<typeof getSettings>);

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
