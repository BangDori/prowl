/** 로그 리더 유닛 테스트 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs");
vi.mock("./log-analyzer", () => ({
  analyzeLogContent: vi.fn(),
}));

import * as fs from "node:fs";
import { analyzeLogContent } from "./log-analyzer";
import { getLastRunInfo, readLogContent } from "./log-reader";

const mockFs = vi.mocked(fs);
const mockAnalyze = vi.mocked(analyzeLogContent);

describe("log-reader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getLastRunInfo", () => {
    it("파일이 없으면 null을 반환한다", () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(getLastRunInfo("/tmp/test.log")).toBeNull();
    });

    it("파일이 있으면 분석 결과를 반환한다", () => {
      const mtime = new Date("2025-01-01");
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ mtime } as unknown as fs.Stats);
      mockFs.readFileSync.mockReturnValue("line1\nline2\n");
      mockAnalyze.mockReturnValue({ success: true, message: "완료" });

      const result = getLastRunInfo("/tmp/test.log");

      expect(result).toEqual({
        timestamp: mtime.toISOString(),
        success: true,
        message: "완료",
      });
      expect(mockAnalyze).toHaveBeenCalledWith(["line1", "line2"]);
    });

    it("에러 발생 시 null을 반환한다", () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error("permission denied");
      });

      expect(getLastRunInfo("/tmp/test.log")).toBeNull();
    });
  });

  describe("readLogContent", () => {
    it("파일이 없으면 안내 메시지를 반환한다", () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = readLogContent("/tmp/test.log");

      expect(result).toEqual({
        content: "로그 파일이 존재하지 않습니다.",
        lastModified: null,
      });
    });

    it("파일 내용의 마지막 N줄을 반환한다", () => {
      const mtime = new Date("2025-01-01");
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ mtime } as unknown as fs.Stats);
      mockFs.readFileSync.mockReturnValue("a\nb\nc\nd\ne");

      const result = readLogContent("/tmp/test.log", 3);

      expect(result.content).toBe("c\nd\ne");
      expect(result.lastModified).toEqual(mtime.toISOString());
    });

    it("빈 내용이면 (빈 로그)를 반환한다", () => {
      const mtime = new Date("2025-01-01");
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ mtime } as unknown as fs.Stats);
      mockFs.readFileSync.mockReturnValue("");

      const result = readLogContent("/tmp/test.log");

      expect(result.content).toBe("(빈 로그)");
    });

    it("에러 발생 시 실패 메시지를 반환한다", () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error("read error");
      });

      const result = readLogContent("/tmp/test.log");

      expect(result.content).toContain("로그 읽기 실패");
      expect(result.lastModified).toBeNull();
    });
  });
});
