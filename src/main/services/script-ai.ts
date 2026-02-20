/** 자연어 → 스크립트+스케줄 AI 생성 서비스 */
import type { ScriptDraft } from "@shared/types";
import { getSettings } from "./settings";

const ENV_KEY = "OPENAI_API_KEY";

function getApiKey(): string | undefined {
  return getSettings().openaiApiKey || process.env[ENV_KEY] || undefined;
}

const SYSTEM_PROMPT = `You are a macOS shell script generator. Given a user's natural language description, generate a shell script and schedule.

Respond ONLY with a JSON object (no markdown, no explanation) matching this schema:
{
  "name": "short name (Korean ok, max 20 chars)",
  "description": "what this script does (Korean ok)",
  "script": "#!/bin/bash\\n... the actual shell script ...",
  "schedule": one of:
    { "type": "daily", "hour": 0-23, "minute": 0-59 }
    { "type": "weekly", "weekday": 0-6, "hour": 0-23, "minute": 0-59 }
    { "type": "interval", "seconds": number }
    { "type": "manual" }
  "scheduleText": "human readable schedule in Korean (e.g. '매일 오전 09:00', '매주 월요일 18:00', '5분마다')"
}

weekday: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
If no schedule is mentioned, use { "type": "manual" } and scheduleText "수동 실행".
Write safe, minimal shell scripts. Use ~/path style for home directory paths.`;

/** 자연어 입력을 스크립트 초안으로 변환 */
export async function generateScriptFromPrompt(prompt: string): Promise<ScriptDraft> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("OpenAI API 키가 설정되지 않았습니다. Settings에서 API 키를 입력해주세요.");
  }

  const { generateText } = await import("ai");
  const { createOpenAI } = await import("@ai-sdk/openai");
  const openai = createOpenAI({ apiKey });

  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: 800,
  });

  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as ScriptDraft;

  if (!parsed.name || !parsed.script || !parsed.schedule) {
    throw new Error("AI 응답 형식이 올바르지 않습니다.");
  }

  return parsed;
}
