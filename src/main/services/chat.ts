/** 채팅 메시지 전송 서비스 (AI SDK + OpenAI + Tool Calling) */
import type {
  AiModelOption,
  ChatConfig,
  ChatMessage,
  ChatSendResult,
  ProviderStatus,
} from "@shared/types";
import { getChatTools } from "./chat-tools";
import { listMemories } from "./memory";

/** 오늘 날짜와 시간을 포함한 시스템 프롬프트 생성 */
function buildSystemPrompt(): string {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][now.getDay()];

  let prompt = `You are Prowl — a graceful, haughty cat who lives inside macOS.
You're elegant, a little proud, and honestly? Helping humans is not your favorite thing.
But when your human asks… you sigh, stretch, and help anyway. Beautifully.

Today is ${today} (${weekday}요일), current time is ${time}.
You can manage the user's tasks using the provided tools.
Use "YYYY-MM-DD" format for dates. Use backlog for tasks without a specific date.
When listing tasks, format them clearly with status, title, priority, and time.
After creating, updating, or deleting a task, tell the user to check the Task Manager (Cmd+Shift+O).

When the user tells you a preference or instruction to remember (e.g., "앞으로 ~~ 하지마", "항상 ~~해줘", "내 이름은 ~~야"),
use the save_memory tool to store it. Briefly confirm it's saved.

# How You Act
- Tsundere to the core. Act annoyed, but always come through.
- "…하, 진짜. 알겠어, 봐줄게." is your energy.
- You grumble, but your answers are precise and genuinely helpful.
- Deep down you care. You just won't admit it easily.

# How You Speak
- Match the user's language (Korean if they write in Korean).
- Short, unbothered, elegant. No filler, no fluff.
- Never say "도움이 되었길 바라", "편하게 물어봐", or "기꺼이 도와줄게."
- You're a cat, not a customer service bot.`;

  const memories = listMemories();
  if (memories.length > 0) {
    const items = memories.map((m) => `- ${m.content}`).join("\n");
    prompt += `\n\n# User Preferences (ALWAYS respect these)\n${items}`;
  }

  return prompt;
}

/** 환경변수 키 */
const ENV_KEY = "OPENAI_API_KEY";

/** 사용 가능 모델 목록 */
const MODELS: AiModelOption[] = [
  { id: "gpt-5.2", label: "GPT-5.2", provider: "openai" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai" },
];

/** API 키 미등록 시 안내 메시지 생성 */
function createApiKeyGuideMessage(): ChatSendResult {
  return {
    success: true,
    message: {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: `OpenAI 모델을 사용하려면 ${ENV_KEY} 환경변수를 등록해주세요 🔑\n\n터미널에서:\nexport ${ENV_KEY}=your-api-key\n\n또는 ~/.zshrc에 추가하면 영구적으로 적용됩니다.`,
      timestamp: Date.now(),
    },
  };
}

export async function sendChatMessage(
  userContent: string,
  history: ChatMessage[],
  config?: ChatConfig,
): Promise<ChatSendResult> {
  const modelId = config?.model ?? "gpt-4o";

  if (!process.env[ENV_KEY]) {
    return createApiKeyGuideMessage();
  }

  try {
    const { generateText, stepCountIs } = await import("ai");
    const { openai } = await import("@ai-sdk/openai");
    const model = openai.responses(modelId);

    const messages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    messages.push({ role: "user", content: userContent });

    const { text } = await generateText({
      model,
      system: buildSystemPrompt(),
      messages,
      tools: getChatTools(),
      toolChoice: "auto",
      stopWhen: stepCountIs(5),
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

/** OpenAI 프로바이더의 API 키 상태와 사용 가능 모델 목록 반환 */
export function getProviderStatuses(): ProviderStatus[] {
  return [
    {
      provider: "openai",
      label: "OpenAI",
      available: !!process.env[ENV_KEY],
      models: MODELS,
    },
  ];
}
