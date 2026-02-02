import type { ChatMessage, ChatSendResult } from "../../shared/types";

export async function sendChatMessage(
  _userContent: string,
  _history: ChatMessage[],
): Promise<ChatSendResult> {
  // TODO: 백엔드 연동 예정
  return { success: false, error: "채팅 백엔드가 아직 연결되지 않았습니다." };
}
