/** 채팅 AI 도구 정의 — Task Manager + Memory + Prowl FS 연동, 툴 레지스트리 등록 */

import "./chat-tools-fs";
import "./chat-tools-tasks";
import "./chat-tools-memory";
import "./chat-tools-categories";
import { setCurrentRoomId } from "./chat-tools-shared";
import { listMemories } from "./memory";
import { toolRegistry } from "./tool-registry";

export { setCurrentRoomId };

/** 레지스트리에 등록된 전체 도구 반환 (chat.ts에서 사용) */
export function getChatTools() {
  return toolRegistry.getAllTools();
}

/** 시스템 프롬프트에 주입할 메모리 섹션 반환 (chat.ts가 memory.ts를 직접 참조하지 않도록) */
export function getMemorySystemPromptSection(): string {
  const memories = listMemories();
  if (memories.length === 0) return "";
  const items = memories.map((m) => `- ${m.content}`).join("\n");
  return `\n\n# User Preferences (ALWAYS respect these)\n${items}`;
}
