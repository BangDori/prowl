/** 파일 기반 ChatRoom CRUD 서비스 (~/.prowl/chat-rooms/{id}.json) */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { getDataHome } from "@main/lib/prowl-home";
import type { ChatMessage, ChatRoom, ChatRoomSummary } from "@shared/types";
import { CHAT_ROOMS_SUBFOLDER, PROWL_DATA_DIR } from "@shared/types";

/** 고유 ID 생성 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

/** 채팅 룸 폴더 확보 (~/.prowl/chat-rooms) */
function ensureFolder(): string {
  const folder = join(getDataHome(), PROWL_DATA_DIR, CHAT_ROOMS_SUBFOLDER);
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
  return folder;
}

/** 룸 파일 경로 */
function roomFilePath(roomId: string): string {
  return join(ensureFolder(), `${roomId}.json`);
}

/** 룸 파일 읽기 (없거나 파싱 실패 시 null) */
function readRoomFile(roomId: string): ChatRoom | null {
  const filePath = roomFilePath(roomId);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

/** 룸 파일 쓰기 */
function writeRoomFile(room: ChatRoom): void {
  writeFileSync(roomFilePath(room.id), JSON.stringify(room, null, 2), "utf-8");
}

/** 룸 목록 조회 (summaries, 즐겨찾기 우선 → updatedAt 내림차순)
 * favoritedRoomIds: AppSettings에서 계산된 즐겨찾기 ID 목록
 */
export function listChatRooms(favoritedRoomIds: string[]): ChatRoomSummary[] {
  const folder = ensureFolder();
  const files = readdirSync(folder).filter((f) => f.endsWith(".json"));
  const summaries: ChatRoomSummary[] = [];

  for (const file of files) {
    const room = readRoomFile(file.replace(".json", ""));
    if (room) {
      summaries.push({
        id: room.id,
        title: room.title,
        lastMessage: room.messages.at(-1)?.content?.slice(0, 80),
        messageCount: room.messages.length,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        locked: room.locked,
        favorited: favoritedRoomIds.includes(room.id),
      });
    }
  }

  return summaries.sort((a, b) => {
    if (a.favorited && !b.favorited) return -1;
    if (!a.favorited && b.favorited) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

/** 룸 상세 조회 (메시지 포함) */
export function getChatRoom(roomId: string): ChatRoom {
  const room = readRoomFile(roomId);
  if (!room) throw new Error(`Chat room not found: ${roomId}`);
  return room;
}

/** 룸 생성 */
export function createChatRoom(title?: string): ChatRoom {
  const now = new Date().toISOString();
  const room: ChatRoom = {
    id: generateId(),
    title: title || "새 대화",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  writeRoomFile(room);
  return room;
}

/** 룸 삭제 (잠금 상태이면 에러) */
export function deleteChatRoom(roomId: string): void {
  const room = readRoomFile(roomId);
  if (room?.locked) throw new Error("잠금된 채팅방은 삭제할 수 없습니다.");
  const filePath = roomFilePath(roomId);
  if (existsSync(filePath)) unlinkSync(filePath);
}

/** 룸 제목 업데이트 */
export function updateChatRoomTitle(roomId: string, title: string): void {
  const room = readRoomFile(roomId);
  if (!room) throw new Error(`Chat room not found: ${roomId}`);
  room.title = title;
  room.updatedAt = new Date().toISOString();
  writeRoomFile(room);
}

/** 룸 잠금 토글 */
export function toggleChatRoomLock(roomId: string): void {
  const room = readRoomFile(roomId);
  if (!room) throw new Error(`Chat room not found: ${roomId}`);
  room.locked = !room.locked;
  writeRoomFile(room);
}

/** 메시지 저장 (전체 교체) + 자동 제목 생성 */
export function saveChatMessages(roomId: string, messages: ChatMessage[]): void {
  const room = readRoomFile(roomId);
  if (!room) throw new Error(`Chat room not found: ${roomId}`);

  room.messages = messages;
  room.updatedAt = new Date().toISOString();
  writeRoomFile(room);
}
