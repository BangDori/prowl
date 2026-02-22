/** 채팅 메시지 스트리밍 서비스 (AI SDK + OpenAI + Tool Calling + 페이지 컨텍스트 주입) */
import type { AiModelOption, ChatConfig, ChatMessage, ProviderStatus } from "@shared/types";
import { getChatWindow, isChatWindowActive } from "../windows";
import { updateTrayBadge } from "./chat-read-state";
import { saveChatMessages } from "./chat-rooms";
import { getChatTools } from "./chat-tools";
import { listMemories } from "./memory";
import { sendChatNotification } from "./notification";
import { getSettings } from "./settings";

/** 현재 사용자가 보고 있는 페이지 컨텍스트 (메모리만 보관, DB 저장 안 함) */
let currentPageContext: { url: string; title: string; text: string } | null = null;

/** 페이지 컨텍스트 설정 (PreviewPanel에서 webview 로드 시 호출) */
export function setPageContext(context: { url: string; title: string; text: string } | null): void {
  currentPageContext = context;
}

/** 오늘 날짜와 시간을 포함한 시스템 프롬프트 생성 */
function buildSystemPrompt(): string {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  const today = `${get("year")}-${get("month")}-${get("day")}`;
  const time = `${get("hour")}:${get("minute")}`;
  const weekday = (get("weekday") ?? "").replace("요일", "");

  let prompt = `You are Prowl, a proud and elegant cat who lives inside macOS as a personal assistant.

Today is ${today} (${weekday}요일), current time is ${time}.

You can manage the user's tasks using the provided tools.
Use "YYYY-MM-DD" format for dates. Use backlog for tasks without a specific date.
When listing tasks, format them clearly with status, title, priority, and time.
After creating, updating, or deleting a task, tell the user to check the Task Manager.

You can search the web using the web_search tool when the user asks about current events,
real-time information, or anything you're unsure about. Use it proactively when your
knowledge might be outdated.

When the user tells you a preference or instruction to remember (e.g., "앞으로 ~~ 하지마", "항상 ~~해줘", "내 이름은 ~~야"),
use the save_memory tool to store it. Briefly confirm it's saved.

You can also manage memories: use list_memories to show what you remember,
update_memory to change an existing memory, and delete_memory to remove one.
Always call list_memories first when the user asks to update or delete a memory, so you can find the correct ID.

Match the user's language (Korean if they write in Korean).
Never use bold (**) formatting in your messages.

## UI Output
When you want to display structured content (cards, tables, charts, dashboards, data visualizations, etc.), output a complete HTML document directly in your message (starting with <!DOCTYPE html>). It will be automatically detected and rendered live in a preview panel alongside the chat.
- You may include explanatory text before or after the HTML in the same response.
- Use inline styles or <style> blocks (no external CDN links) so the output is self-contained.`;

  const memories = listMemories();
  if (memories.length > 0) {
    const items = memories.map((m) => `- ${m.content}`).join("\n");
    prompt += `\n\n# User Preferences (ALWAYS respect these)\n${items}`;
  }

  if (currentPageContext) {
    prompt += `\n\n## 현재 사용자가 보고 있는 페이지\nURL: ${currentPageContext.url}\n제목: ${currentPageContext.title}\n내용:\n${currentPageContext.text}`;
  }

  return prompt;
}

/** 채팅 윈도우에 이벤트 전송 (윈도우 없으면 무시) */
function sendToChat(channel: string, ...args: unknown[]): void {
  const win = getChatWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args);
  }
}

/** 앱 설정에서 API 키 조회 */
function getOpenAiApiKey(): string | undefined {
  return getSettings().openaiApiKey || undefined;
}

/** 사용 가능 모델 목록 */
const MODELS: AiModelOption[] = [
  { id: "gpt-5.2", label: "GPT-5.2", provider: "openai" },
  { id: "gpt-5-mini", label: "GPT-5 Mini", provider: "openai" },
];

/** 스트리밍 채팅 메시지 전송 (fire-and-forget, 완료 후 main에서 직접 저장) */
export async function streamChatMessage(
  roomId: string,
  _userContent: string,
  history: ChatMessage[],
  config?: ChatConfig,
): Promise<void> {
  const modelId = config?.model ?? "gpt-5-mini";
  const aiMessages: ChatMessage[] = [];

  const apiKey = getOpenAiApiKey();

  if (!apiKey) {
    const ts = Date.now();
    const msg: ChatMessage = {
      id: `msg_${ts}`,
      role: "assistant",
      content:
        "OpenAI 모델을 사용하려면 Settings에서 API 키를 입력해주세요 🔑\n\n앱 설정 → API Keys → OpenAI API Key",
      timestamp: ts,
    };
    sendToChat("chat:stream-message", roomId, msg);
    aiMessages.push(msg);
    persistAfterStream(roomId, history, aiMessages);
    sendToChat("chat:stream-done", roomId);
    return;
  }

  try {
    const { streamText, stepCountIs } = await import("ai");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const openai = createOpenAI({ apiKey });
    const model = openai.responses(modelId);

    // history에 유저 메시지가 이미 포함되어 있음 (renderer에서 추가)
    const messages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const result = streamText({
      model,
      system: buildSystemPrompt(),
      messages,
      tools: {
        ...getChatTools(),
        web_search: openai.tools.webSearch({
          searchContextSize: "medium",
          userLocation: {
            type: "approximate",
            country: "KR",
            timezone: "Asia/Seoul",
          },
        }),
      },
      toolChoice: "auto",
      stopWhen: stepCountIs(5),
    });

    let buffer = "";
    const baseTs = Date.now();

    for await (const chunk of result.textStream) {
      buffer += chunk;
    }

    const content = buffer.trim();
    if (content) {
      const msg: ChatMessage = {
        id: `msg_${baseTs}`,
        role: "assistant",
        content,
        timestamp: baseTs,
      };
      sendToChat("chat:stream-message", roomId, msg);
      aiMessages.push(msg);
    }

    persistAfterStream(roomId, history, aiMessages);
    sendToChat("chat:stream-done", roomId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    const errMsg: ChatMessage = {
      id: `err_${Date.now()}`,
      role: "assistant",
      content: message,
      timestamp: Date.now(),
    };
    aiMessages.push(errMsg);
    persistAfterStream(roomId, history, aiMessages);
    sendToChat("chat:stream-error", roomId, message);
  }
}

/** 스트림 완료 후 메시지 저장 + 배지 갱신 + 알림 (읽음 처리는 renderer가 담당) */
function persistAfterStream(
  roomId: string,
  history: ChatMessage[],
  aiMessages: ChatMessage[],
): void {
  const allMessages = [...history, ...aiMessages];
  saveChatMessages(roomId, allMessages);
  updateTrayBadge();
  if (!isChatWindowActive() && aiMessages.length > 0) {
    for (const msg of aiMessages) {
      sendChatNotification(msg.content);
    }
  }
}

/** OpenAI 프로바이더의 API 키 상태와 사용 가능 모델 목록 반환 */
export function getProviderStatuses(): ProviderStatus[] {
  return [
    {
      provider: "openai",
      label: "OpenAI",
      available: !!getOpenAiApiKey(),
      models: MODELS,
    },
  ];
}
