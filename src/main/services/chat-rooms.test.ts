/** chat-rooms 서비스 유닛 테스트 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted로 mock 팩토리보다 먼저 선언
const { mockReaddirSync, mockExistsSync, mockMkdirSync, mockReadFileSync } = vi.hoisted(() => ({
  mockReaddirSync: vi.fn(),
  mockExistsSync: vi.fn(),
  mockMkdirSync: vi.fn(),
  mockReadFileSync: vi.fn(),
}));

const { mockWriteFileSync, mockUnlinkSync } = vi.hoisted(() => ({
  mockWriteFileSync: vi.fn(),
  mockUnlinkSync: vi.fn(),
}));

vi.mock("node:fs", () => ({
  readdirSync: mockReaddirSync,
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  unlinkSync: mockUnlinkSync,
}));

vi.mock("electron", () => ({
  app: { getPath: vi.fn().mockReturnValue("/home/test") },
}));

vi.mock("@main/lib/prowl-home", () => ({
  getDataHome: vi.fn().mockReturnValue("/home/test"),
}));

import {
  createChatRoom,
  deleteChatRoom,
  getChatRoom,
  listChatRooms,
  saveChatMessages,
} from "./chat-rooms";

function makeRoomJson(id: string, updatedAt: string, extra: object = {}): string {
  return JSON.stringify({
    id,
    title: `Room ${id}`,
    messages: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt,
    ...extra,
  });
}

describe("listChatRooms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  it("즐겨찾기 방이 먼저 오고, 나머지는 updatedAt 내림차순", () => {
    mockReaddirSync.mockReturnValue(["a.json", "b.json", "c.json"]);
    mockReadFileSync
      .mockReturnValueOnce(makeRoomJson("a", "2024-01-15T00:00:00.000Z"))
      .mockReturnValueOnce(makeRoomJson("b", "2024-01-10T00:00:00.000Z"))
      .mockReturnValueOnce(makeRoomJson("c", "2024-01-05T00:00:00.000Z"));

    const result = listChatRooms(["b"]);

    expect(result[0].id).toBe("b"); // 즐겨찾기가 맨 위
    expect(result[0].favorited).toBe(true);
    expect(result[1].id).toBe("a"); // 더 최신
    expect(result[2].id).toBe("c");
  });

  it("즐겨찾기가 없으면 updatedAt 내림차순만 적용", () => {
    mockReaddirSync.mockReturnValue(["a.json", "b.json"]);
    mockReadFileSync
      .mockReturnValueOnce(makeRoomJson("a", "2024-01-10T00:00:00.000Z"))
      .mockReturnValueOnce(makeRoomJson("b", "2024-01-15T00:00:00.000Z"));

    const result = listChatRooms([]);

    expect(result[0].id).toBe("b");
    expect(result[1].id).toBe("a");
  });

  it("여러 즐겨찾기 방들도 updatedAt 내림차순으로 정렬", () => {
    mockReaddirSync.mockReturnValue(["a.json", "b.json", "c.json"]);
    mockReadFileSync
      .mockReturnValueOnce(makeRoomJson("a", "2024-01-05T00:00:00.000Z"))
      .mockReturnValueOnce(makeRoomJson("b", "2024-01-15T00:00:00.000Z"))
      .mockReturnValueOnce(makeRoomJson("c", "2024-01-10T00:00:00.000Z"));

    const result = listChatRooms(["a", "b"]);

    expect(result[0].id).toBe("b"); // 즐겨찾기 중 최신
    expect(result[1].id).toBe("a"); // 즐겨찾기 중 구형
    expect(result[2].id).toBe("c"); // 비즐겨찾기
    expect(result[0].favorited).toBe(true);
    expect(result[1].favorited).toBe(true);
    expect(result[2].favorited).toBe(false);
  });

  it("favoritedRoomIds에 없는 방은 favorited=false", () => {
    mockReaddirSync.mockReturnValue(["a.json"]);
    mockReadFileSync.mockReturnValueOnce(makeRoomJson("a", "2024-01-01T00:00:00.000Z"));

    const result = listChatRooms(["other-id"]);

    expect(result[0].favorited).toBe(false);
  });

  it("파일 읽기 실패한 룸은 목록에서 제외", () => {
    mockReaddirSync.mockReturnValue(["a.json", "bad.json"]);
    mockReadFileSync
      .mockReturnValueOnce(makeRoomJson("a", "2024-01-01T00:00:00.000Z"))
      .mockImplementationOnce(() => {
        throw new Error("read error");
      });

    const result = listChatRooms([]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });
});

describe("createChatRoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  it("기본 제목 '새 대화'로 룸을 생성하고 반환한다", () => {
    const room = createChatRoom();
    expect(room.title).toBe("새 대화");
    expect(room.id).toBeTruthy();
    expect(room.messages).toEqual([]);
    expect(mockWriteFileSync).toHaveBeenCalled();
  });

  it("지정한 제목으로 룸을 생성한다", () => {
    const room = createChatRoom("나만의 채팅방");
    expect(room.title).toBe("나만의 채팅방");
  });
});

describe("getChatRoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  it("존재하는 룸을 반환한다", () => {
    mockReadFileSync.mockReturnValue(makeRoomJson("room-1", "2024-01-01T00:00:00.000Z"));
    const room = getChatRoom("room-1");
    expect(room.id).toBe("room-1");
  });

  it("파일이 없으면 에러", () => {
    mockExistsSync.mockReturnValue(false);
    expect(() => getChatRoom("no-room")).toThrow("Chat room not found");
  });
});

describe("deleteChatRoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  it("잠금되지 않은 룸을 삭제한다", () => {
    mockReadFileSync.mockReturnValue(makeRoomJson("room-1", "2024-01-01T00:00:00.000Z"));
    deleteChatRoom("room-1");
    expect(mockUnlinkSync).toHaveBeenCalled();
  });

  it("잠금된 룸 삭제 시 에러", () => {
    mockReadFileSync.mockReturnValue(
      makeRoomJson("room-1", "2024-01-01T00:00:00.000Z", { locked: true }),
    );
    expect(() => deleteChatRoom("room-1")).toThrow("잠금된");
  });
});

describe("saveChatMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  it("메시지를 저장하고 updatedAt을 갱신한다", () => {
    const before = "2024-01-01T00:00:00.000Z";
    mockReadFileSync.mockReturnValue(makeRoomJson("room-1", before));

    const messages = [{ id: "m1", role: "user" as const, content: "안녕", timestamp: Date.now() }];
    saveChatMessages("room-1", messages);

    const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
    expect(written.messages).toHaveLength(1);
    expect(written.updatedAt).not.toBe(before);
  });

  it("존재하지 않는 룸에 저장 시 에러", () => {
    mockExistsSync.mockReturnValue(false);
    expect(() => saveChatMessages("no-room", [])).toThrow("Chat room not found");
  });
});
