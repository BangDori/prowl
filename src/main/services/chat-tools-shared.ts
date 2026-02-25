/** 채팅 도구 공유 헬퍼 — ID 생성, 알림, HITL 이벤트 */
import { getChatWindow, getCompactWindow, getDashboardWindow } from "../windows";

/** 고유 ID 생성 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

/** 현재 스트리밍 중인 채팅 룸 ID — HITL 메시지 전송 시 사용 */
let currentRoomId = "";

/** 도구 실행 전 roomId 설정 (chat.ts에서 streamChatMessage 시작 시 호출) */
export function setCurrentRoomId(roomId: string): void {
  currentRoomId = roomId;
}

/** 현재 roomId 반환 */
export function getCurrentRoomId(): string {
  return currentRoomId;
}

/** 채팅 윈도우에 이벤트 전송 */
export function sendToChat(channel: string, ...args: unknown[]): void {
  const win = getChatWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args);
  }
}

/** 대시보드에 메모리 변경 알림 */
export function notifyMemoryChanged(): void {
  const win = getDashboardWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("memory:changed");
  }
}

/** Task Manager(Compact View) + 대시보드에 태스크 변경 알림 */
export function notifyTasksChanged(): void {
  for (const win of [getCompactWindow(), getDashboardWindow()]) {
    if (win && !win.isDestroyed()) {
      win.webContents.send("tasks:changed");
    }
  }
}

/** 모든 창에 카테고리 변경 알림 */
export function notifyCategoriesChanged(): void {
  for (const win of [getCompactWindow(), getDashboardWindow(), getChatWindow()]) {
    if (win && !win.isDestroyed()) {
      win.webContents.send("categories:changed");
    }
  }
}
