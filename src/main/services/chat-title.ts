/** AI를 이용한 채팅 룸 제목 자동 생성 서비스 (첫 번째 응답 완료 후 best-effort) */

import type { ChatMessage, OAuthCredential, OpenAICredential } from "@shared/types";
import { getChatWindow } from "../windows";
import { getChatRoom, updateChatRoomTitle } from "./chat-rooms";

const TITLE_SYSTEM_PROMPT =
  "대화의 핵심 주제를 담은 짧은 제목을 생성하세요. 20자 이내, 따옴표 없이, 제목만 답하세요.";

const CODEX_ENDPOINT = "https://chatgpt.com/backend-api/codex/responses";

/** 채팅 윈도우에 이벤트 전송 */
function sendToChat(channel: string, ...args: unknown[]): void {
  const win = getChatWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args);
  }
}

/**
 * 첫 번째 AI 응답 완료 후 룸 제목을 AI로 생성 (best-effort, 실패 시 무시)
 * - history에 assistant 메시지가 없을 때만 실행 (첫 번째 교환)
 * - 룸 제목이 "새 대화"일 때만 실행
 */
export async function maybeGenerateTitle(
  roomId: string,
  history: ChatMessage[],
  aiMessages: ChatMessage[],
  credential: OpenAICredential,
  modelId: string,
): Promise<void> {
  // 첫 번째 교환인지 확인 (history에 assistant 메시지 없음)
  if (history.some((m) => m.role === "assistant")) return;

  const firstAiMsg = aiMessages.find((m) => m.role === "assistant");
  if (!firstAiMsg?.content) return;

  const firstUserMsg = history.find((m) => m.role === "user");
  if (!firstUserMsg?.content) return;

  // 현재 제목이 기본값인지 확인
  let room: Awaited<ReturnType<typeof getChatRoom>>;
  try {
    room = getChatRoom(roomId);
  } catch {
    return;
  }
  if (room.title !== "새 대화") return;

  const { generateText } = await import("ai");
  const { createOpenAI } = await import("@ai-sdk/openai");

  const isOAuth = credential.type === "oauth";

  let openai: ReturnType<typeof createOpenAI>;
  if (isOAuth) {
    const oauthCred = credential as OAuthCredential;
    openai = createOpenAI({
      apiKey: "prowl-oauth-dummy-key",
      fetch: async (url, init) => {
        const headers = new Headers(init?.headers);
        headers.delete("Authorization");
        headers.delete("authorization");
        headers.set("Authorization", `Bearer ${oauthCred.access}`);
        if (oauthCred.accountId) headers.set("ChatGPT-Account-Id", oauthCred.accountId);
        const parsed = new URL(
          typeof url === "string" ? url : url instanceof URL ? url.href : (url as Request).url,
        );
        const targetUrl =
          parsed.pathname.includes("/chat/completions") || parsed.pathname.includes("/v1/responses")
            ? new URL(CODEX_ENDPOINT)
            : parsed;
        return fetch(targetUrl, { ...init, headers });
      },
    });
  } else {
    openai = createOpenAI({ apiKey: credential.key });
  }

  const model = isOAuth ? openai.responses(modelId) : openai.chat(modelId);
  const conversationSnippet = `User: ${firstUserMsg.content.slice(0, 300)}\nAssistant: ${firstAiMsg.content.slice(0, 300)}`;

  const { text } = await generateText({
    model,
    ...(isOAuth
      ? { providerOptions: { openai: { instructions: TITLE_SYSTEM_PROMPT, store: false } } }
      : { system: TITLE_SYSTEM_PROMPT }),
    messages: [{ role: "user" as const, content: conversationSnippet }],
  });

  const title = text
    .trim()
    .replace(/^["'「」『』【】[\]]+|["'「」『』【】[\]]+$/g, "")
    .slice(0, 25);
  if (!title) return;

  updateChatRoomTitle(roomId, title);
  sendToChat("chat-rooms:title-updated", roomId, title);
}
