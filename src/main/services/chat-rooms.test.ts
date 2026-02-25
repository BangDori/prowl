/** chat-rooms 서비스 유닛 테스트 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted로 mock 팩토리보다 먼저 선언
const { mockReaddirSync, mockExistsSync, mockMkdirSync, mockReadFileSync } = vi.hoisted(() => ({
  mockReaddirSync: vi.fn(),
  mockExistsSync: vi.fn(),
  mockMkdirSync: vi.fn(),
  mockReadFileSync: vi.fn(),
}));

vi.mock("node:fs", () => ({
  readdirSync: mockReaddirSync,
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  readFileSync: mockReadFileSync,
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

vi.mock("electron", () => ({
  app: { getPath: vi.fn().mockReturnValue("/home/test") },
}));

import { listChatRooms } from "./chat-rooms";

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
