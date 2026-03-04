/** memory 서비스 유닛 테스트 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockExistsSync, mockReadFileSync, mockWriteFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadFileSync: vi.fn(),
  mockWriteFileSync: vi.fn(),
}));

vi.mock("node:fs", () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
}));

vi.mock("./personalize", () => ({
  ensurePersonalizeDir: vi.fn().mockReturnValue("/home/test/.prowl/personalize"),
}));

import { addMemory, deleteMemory, listMemories, updateMemory } from "./memory";

describe("memory 서비스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
  });

  describe("listMemories", () => {
    it("파일 없으면 빈 배열 반환", () => {
      expect(listMemories()).toEqual([]);
    });

    it("파일 있으면 파싱 후 반환", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify([{ id: "m1", content: "메모 내용", createdAt: "2025-01-01T00:00:00.000Z" }]),
      );
      const result = listMemories();
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("메모 내용");
    });

    it("파일 파싱 실패 시 빈 배열 반환", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("invalid json");
      expect(listMemories()).toEqual([]);
    });
  });

  describe("addMemory", () => {
    it("메모리를 추가하고 Memory 객체를 반환한다", () => {
      const mem = addMemory("새 메모");
      expect(mem.content).toBe("새 메모");
      expect(mem.id).toBeTruthy();
      expect(mem.createdAt).toBeTruthy();
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it("기존 메모리에 append한다", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify([{ id: "existing", content: "기존", createdAt: "" }]),
      );
      addMemory("새로운 메모");
      const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
      expect(written).toHaveLength(2);
    });
  });

  describe("updateMemory", () => {
    it("id로 메모리 내용을 수정한다", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify([{ id: "m1", content: "기존 내용", createdAt: "" }]),
      );
      updateMemory("m1", "수정된 내용");
      const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
      expect(written[0].content).toBe("수정된 내용");
    });

    it("없는 id면 에러 throw", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify([]));
      expect(() => updateMemory("not-exist", "내용")).toThrow("Memory not found");
    });
  });

  describe("deleteMemory", () => {
    it("id로 메모리를 삭제한다", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify([
          { id: "m1", content: "첫 번째", createdAt: "" },
          { id: "m2", content: "두 번째", createdAt: "" },
        ]),
      );
      deleteMemory("m1");
      const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
      expect(written).toHaveLength(1);
      expect(written[0].id).toBe("m2");
    });

    it("없는 id 삭제 시 기존 목록 그대로 저장", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify([{ id: "m1", content: "메모", createdAt: "" }]),
      );
      deleteMemory("not-exist");
      const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
      expect(written).toHaveLength(1);
    });
  });
});
