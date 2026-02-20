/** 채팅 메시지 스트리밍 서비스 (AI SDK + OpenAI + Tool Calling) */
import type { AiModelOption, ChatConfig, ChatMessage, ProviderStatus } from "@shared/types";
import { getChatWindow, isChatWindowActive } from "../windows";
import { updateTrayBadge } from "./chat-read-state";
import { saveChatMessages } from "./chat-rooms";
import { getChatTools } from "./chat-tools";
import { listMemories } from "./memory";
import { sendChatNotification } from "./notification";
import { getSettings } from "./settings";

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

Respond in multiple short messages like a messenger chat.
Put "---" on its own line between messages.
Keep each message to 1-3 sentences.
Never put "---" as a separator inside code blocks (\`\`\`).
Do not split lists, tables, or code blocks across messages.`;

  const memories = listMemories();
  if (memories.length > 0) {
    const items = memories.map((m) => `- ${m.content}`).join("\n");
    prompt += `\n\n# User Preferences (ALWAYS respect these)\n${items}`;
  }

  return prompt;
}

/** 구분자 위치가 코드 블록 내부인지 판별 (``` 개수가 홀수면 내부) */
function isInsideCodeBlock(text: string, pos: number): boolean {
  const before = text.slice(0, pos);
  const count = (before.match(/```/g) || []).length;
  return count % 2 === 1;
}

/** 채팅 윈도우에 이벤트 전송 (윈도우 없으면 무시) */
function sendToChat(channel: string, ...args: unknown[]): void {
  const win = getChatWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args);
  }
}

/** 환경변수 키 (fallback용) */
const ENV_KEY = "OPENAI_API_KEY";

/** 앱 설정 또는 환경변수에서 API 키 조회 */
function getOpenAiApiKey(): string | undefined {
  return getSettings().openaiApiKey || process.env[ENV_KEY] || undefined;
}

/** 사용 가능 모델 목록 */
const MODELS: AiModelOption[] = [
  { id: "gpt-5.2", label: "GPT-5.2", provider: "openai" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai" },
];

/** 스트리밍 채팅 메시지 전송 (fire-and-forget, 완료 후 main에서 직접 저장) */
export async function streamChatMessage(
  roomId: string,
  _userContent: string,
  history: ChatMessage[],
  config?: ChatConfig,
): Promise<void> {
  const modelId = config?.model ?? "gpt-4o";
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
    sendToChat("chat:stream-message", msg);
    aiMessages.push(msg);
    persistAfterStream(roomId, history, aiMessages);
    sendToChat("chat:stream-done");
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
    let msgIndex = 0;
    const baseTs = Date.now();
    const delimiterRegex = /\n+\s*---\s*\n+/;

    for await (const chunk of result.textStream) {
      buffer += chunk;

      let match = delimiterRegex.exec(buffer);
      while (match) {
        if (!isInsideCodeBlock(buffer, match.index)) {
          const content = buffer.slice(0, match.index).trim();
          if (content) {
            const msg: ChatMessage = {
              id: `msg_${baseTs}_${msgIndex}`,
              role: "assistant",
              content,
              timestamp: baseTs + msgIndex,
            };
            sendToChat("chat:stream-message", msg);
            aiMessages.push(msg);
            msgIndex++;
          }
          buffer = buffer.slice(match.index + match[0].length);
          match = delimiterRegex.exec(buffer);
        } else {
          break;
        }
      }
    }

    const remaining = buffer.trim();
    if (remaining) {
      const msg: ChatMessage = {
        id: `msg_${baseTs}_${msgIndex}`,
        role: "assistant",
        content: remaining,
        timestamp: baseTs + msgIndex,
      };
      sendToChat("chat:stream-message", msg);
      aiMessages.push(msg);
    }

    persistAfterStream(roomId, history, aiMessages);
    sendToChat("chat:stream-done");
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
    sendToChat("chat:stream-error", message);
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
    const lastMessage = aiMessages[aiMessages.length - 1].content;
    sendChatNotification(lastMessage);
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
