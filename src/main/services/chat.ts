/** 채팅 메시지 전송 서비스 */
import type { ChatMessage, ChatSendResult } from "@shared/types";

export async function sendChatMessage(
  _userContent: string,
  _history: ChatMessage[],
): Promise<ChatSendResult> {
  // TODO: 백엔드 연동 예정
  return { success: false, error: "아직 대화할 준비가 안 됐다냥... 조금만 기다려라냥!" };
}
