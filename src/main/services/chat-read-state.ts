/** 채팅 읽음 상태 관리 서비스 (~/.prowl/chat-read-state.json) */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ChatRoom } from "@shared/types";
import { CHAT_READ_STATE_FILE, CHAT_ROOMS_SUBFOLDER, PROWL_DATA_DIR } from "@shared/types";
import { app, BrowserWindow } from "electron";

/** 읽음 상태: roomId → lastReadMessageId */
type ChatReadState = Record<string, string>;

/** 읽음 상태 파일 경로 */
function readStateFilePath(): string {
  return join(app.getPath("home"), PROWL_DATA_DIR, CHAT_READ_STATE_FILE);
}

/** 채팅 룸 폴더 경로 */
function chatRoomsFolder(): string {
  return join(app.getPath("home"), PROWL_DATA_DIR, CHAT_ROOMS_SUBFOLDER);
}

/** 읽음 상태 읽기 (파일 없으면 빈 객체) */
function readState(): ChatReadState {
  const filePath = readStateFilePath();
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return {};
  }
}

/** 읽음 상태 쓰기 */
function writeState(state: ChatReadState): void {
  writeFileSync(readStateFilePath(), JSON.stringify(state, null, 2), "utf-8");
}

/** 룸 파일에서 메시지 배열 읽기 */
function readRoomMessages(roomId: string): ChatRoom["messages"] {
  const filePath = join(chatRoomsFolder(), `${roomId}.json`);
  if (!existsSync(filePath)) return [];
  try {
    const room: ChatRoom = JSON.parse(readFileSync(filePath, "utf-8"));
    return room.messages ?? [];
  } catch {
    return [];
  }
}

/** 특정 룸의 안 읽은 메시지 수 계산 */
function getUnreadCountForRoom(roomId: string, state: ChatReadState): number {
  const messages = readRoomMessages(roomId);
  if (messages.length === 0) return 0;

  const lastReadId = state[roomId];
  // 읽음 상태 엔트리 없으면 → 모든 메시지를 안 읽은 것으로 처리
  if (lastReadId === undefined) return messages.length;

  const lastReadIndex = messages.findIndex((m) => m.id === lastReadId);
  // lastReadId를 못 찾으면 (삭제됐을 수 있음) 전부 읽은 것으로 처리
  if (lastReadIndex === -1) return 0;

  return messages.length - lastReadIndex - 1;
}

/** 모든 룸의 안 읽은 메시지 수 조회 */
export function getAllUnreadCounts(): Record<string, number> {
  const folder = chatRoomsFolder();
  if (!existsSync(folder)) return {};

  const state = readState();
  const files = readdirSync(folder).filter((f) => f.endsWith(".json"));
  const counts: Record<string, number> = {};

  for (const file of files) {
    const roomId = file.replace(".json", "");
    const count = getUnreadCountForRoom(roomId, state);
    if (count > 0) counts[roomId] = count;
  }

  return counts;
}

/** 룸 읽음 처리 */
export function markRoomAsRead(roomId: string, lastMessageId: string): void {
  const state = readState();
  state[roomId] = lastMessageId;
  writeState(state);
  updateTrayBadge();
}

/** 룸 삭제 시 읽음 상태 정리 */
export function removeRoomReadState(roomId: string): void {
  const state = readState();
  delete state[roomId];
  writeState(state);
}

/** 렌더러에 미읽음 수 변경 이벤트 전송 (트레이 배지 미표시) */
export function updateTrayBadge(): void {
  const counts = getAllUnreadCounts();
  const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send("chat-rooms:unread-changed", total);
    }
  }
}
