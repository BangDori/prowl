/** 채팅 메시지 전송 서비스 (AI SDK + OpenAI) */
import type { ChatMessage, ChatSendResult } from "@shared/types";

const SYSTEM_PROMPT = `You are Prowl, a helpful macOS assistant.
Respond concisely and helpfully. Use Korean if the user writes in Korean.`;

export async function sendChatMessage(
  userContent: string,
  history: ChatMessage[],
): Promise<ChatSendResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: "OPENAI_API_KEY 환경변수가 설정되지 않았습니다." };
  }

  try {
    const { generateText } = await import("ai");
    const { openai } = await import("@ai-sdk/openai");

    const messages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    messages.push({ role: "user", content: userContent });

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: SYSTEM_PROMPT,
      messages,
    });

    return {
      success: true,
      message: {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: text,
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}
