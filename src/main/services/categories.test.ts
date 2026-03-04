/** 카테고리 CRUD 서비스 유닛 테스트 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockExistsSync, mockReadFileSync, mockWriteFileSync, mockReaddirSync, mockMkdirSync } =
  vi.hoisted(() => ({
    mockExistsSync: vi.fn(),
    mockReadFileSync: vi.fn(),
    mockWriteFileSync: vi.fn(),
    mockReaddirSync: vi.fn(),
    mockMkdirSync: vi.fn(),
  }));

vi.mock("node:fs", () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  readdirSync: mockReaddirSync,
  mkdirSync: mockMkdirSync,
}));

vi.mock("@main/lib/prowl-home", () => ({
  getDataHome: vi.fn().mockReturnValue("/home/test"),
}));

import {
  addCategory,
  deleteCategory,
  listCategories,
  renameCategory,
  resolveCategory,
} from "./categories";

const DEFAULT_CATS = JSON.stringify([{ name: "기타", color: "#6b7280" }]);
const TWO_CATS = JSON.stringify([
  { name: "기타", color: "#6b7280" },
  { name: "업무", color: "#6366f1" },
]);

describe("categories 서비스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([]);
    mockReadFileSync.mockReturnValue(DEFAULT_CATS);
  });

  describe("listCategories", () => {
    it("파일 없으면 DEFAULT_CATEGORIES 반환", () => {
      mockExistsSync.mockReturnValue(false);
      const cats = listCategories();
      expect(cats).toEqual([{ name: "기타", color: "#6b7280" }]);
    });

    it("파일 있으면 파싱 결과 반환", () => {
      mockReadFileSync.mockReturnValue(TWO_CATS);
      expect(listCategories()).toHaveLength(2);
    });

    it("빈 배열이면 DEFAULT_CATEGORIES 반환", () => {
      mockReadFileSync.mockReturnValue(JSON.stringify([]));
      expect(listCategories()).toEqual([{ name: "기타", color: "#6b7280" }]);
    });

    it("파싱 실패 시 DEFAULT_CATEGORIES 반환", () => {
      mockReadFileSync.mockReturnValue("invalid json");
      expect(listCategories()).toEqual([{ name: "기타", color: "#6b7280" }]);
    });
  });

  describe("resolveCategory", () => {
    it("대소문자 무시로 정확한 카테고리 이름을 반환한다", () => {
      mockReadFileSync.mockReturnValue(TWO_CATS);
      expect(resolveCategory("업무")).toBe("업무");
    });

    it("trim 후 대소문자 무시 매칭", () => {
      mockReadFileSync.mockReturnValue(TWO_CATS);
      expect(resolveCategory("  업무  ")).toBe("업무");
    });

    it("없는 카테고리면 undefined 반환", () => {
      mockReadFileSync.mockReturnValue(DEFAULT_CATS);
      expect(resolveCategory("없는카테고리")).toBeUndefined();
    });
  });

  describe("addCategory", () => {
    it("새 카테고리를 추가하고 반환한다", () => {
      mockReadFileSync.mockReturnValue(DEFAULT_CATS);
      const cat = addCategory("업무");
      expect(cat.name).toBe("업무");
      expect(cat.color).toBeTruthy();
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it("빈 이름은 에러", () => {
      expect(() => addCategory("")).toThrow("비어 있습니다");
      expect(() => addCategory("   ")).toThrow("비어 있습니다");
    });

    it("중복 이름 추가 시 에러 (대소문자 무시)", () => {
      mockReadFileSync.mockReturnValue(TWO_CATS);
      expect(() => addCategory("업무")).toThrow("이미 존재");
    });
  });

  describe("renameCategory", () => {
    it("카테고리 이름을 변경한다", () => {
      mockReadFileSync.mockReturnValue(TWO_CATS);
      renameCategory("업무", "Work");
      const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
      expect(written.some((c: { name: string }) => c.name === "Work")).toBe(true);
      expect(written.some((c: { name: string }) => c.name === "업무")).toBe(false);
    });

    it("'기타' 이름 변경 시 에러", () => {
      mockReadFileSync.mockReturnValue(DEFAULT_CATS);
      expect(() => renameCategory("기타", "Other")).toThrow("변경할 수 없습니다");
    });

    it("없는 카테고리 변경 시 에러", () => {
      mockReadFileSync.mockReturnValue(DEFAULT_CATS);
      expect(() => renameCategory("없음", "있음")).toThrow("찾을 수 없음");
    });

    it("새 이름이 빈 문자열이면 에러", () => {
      mockReadFileSync.mockReturnValue(TWO_CATS);
      expect(() => renameCategory("업무", "")).toThrow("비어 있습니다");
    });

    it("새 이름이 기존 카테고리와 중복이면 에러", () => {
      mockReadFileSync.mockReturnValue(TWO_CATS);
      expect(() => renameCategory("업무", "기타")).toThrow("이미 존재");
    });
  });

  describe("deleteCategory", () => {
    it("카테고리를 삭제한다", () => {
      mockReadFileSync.mockReturnValue(TWO_CATS);
      deleteCategory("업무");
      const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
      expect(written.some((c: { name: string }) => c.name === "업무")).toBe(false);
      expect(written.some((c: { name: string }) => c.name === "기타")).toBe(true);
    });

    it("'기타' 삭제 시 에러", () => {
      mockReadFileSync.mockReturnValue(DEFAULT_CATS);
      expect(() => deleteCategory("기타")).toThrow("삭제할 수 없습니다");
    });

    it("없는 카테고리 삭제 시 에러", () => {
      mockReadFileSync.mockReturnValue(DEFAULT_CATS);
      expect(() => deleteCategory("없음")).toThrow("찾을 수 없음");
    });
  });
});
