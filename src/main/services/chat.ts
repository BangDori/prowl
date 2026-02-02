import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, ChatSendResult } from "../../shared/types";
import { getApiKey } from "./settings";

const SYSTEM_PROMPT = `You are Prowl, a friendly cat assistant that lives in the macOS menubar. You help manage launchd background jobs. Keep responses concise since you live in a small popup window. Respond in Korean by default unless the user writes in another language.`;

function createMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function sendChatMessage(
  userContent: string,
  history: ChatMessage[],
): Promise<ChatSendResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: "API 키가 설정되지 않았습니다." };
  }

  const client = new Anthropic({ apiKey });

  const messages = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  messages.push({ role: "user", content: userContent });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return {
      success: true,
      message: {
        id: createMessageId(),
        role: "assistant",
        content: text,
        timestamp: Date.now(),
      },
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
    return { success: false, error: errorMessage };
  }
}
