/** launchd 서비스 유닛 테스트 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs");
vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));
vi.mock("./settings", () => ({
  getPatterns: vi.fn(),
}));
vi.mock("./plist-parser", () => ({
  parsePlistFile: vi.fn(),
  extractLabel: vi.fn(),
  extractLogPath: vi.fn(),
  extractSchedule: vi.fn(),
  extractScriptPath: vi.fn(),
  getJobNameFromLabel: vi.fn(),
  scheduleToText: vi.fn(),
}));
vi.mock("./log-reader", () => ({
  getLastRunInfo: vi.fn(),
}));
vi.mock("../utils/command", () => ({
  executeCommand: vi.fn(),
}));
vi.mock("../utils/pattern-matcher", () => ({
  matchesAnyPattern: vi.fn(),
}));

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import { executeCommand } from "../utils/command";
import { matchesAnyPattern } from "../utils/pattern-matcher";
import {
  findJobById,
  findPlistFiles,
  getLoadedJobPids,
  getLoadedJobs,
  isJobLoaded,
  listAllJobs,
  loadJob,
  startJob,
  toggleJob,
  unloadJob,
} from "./launchd";
import { getLastRunInfo } from "./log-reader";
import {
  extractLabel,
  extractLogPath,
  extractSchedule,
  extractScriptPath,
  getJobNameFromLabel,
  parsePlistFile,
  scheduleToText,
} from "./plist-parser";
import { getPatterns } from "./settings";

const mockFs = vi.mocked(fs);
const mockExecSync = vi.mocked(execSync);
const mockGetPatterns = vi.mocked(getPatterns);
const mockMatchesAnyPattern = vi.mocked(matchesAnyPattern);
const mockExecuteCommand = vi.mocked(executeCommand);
const mockParsePlistFile = vi.mocked(parsePlistFile);
const mockExtractLabel = vi.mocked(extractLabel);
const mockExtractLogPath = vi.mocked(extractLogPath);
const mockExtractSchedule = vi.mocked(extractSchedule);
const mockExtractScriptPath = vi.mocked(extractScriptPath);
const mockGetJobNameFromLabel = vi.mocked(getJobNameFromLabel);
const mockScheduleToText = vi.mocked(scheduleToText);
const mockGetLastRunInfo = vi.mocked(getLastRunInfo);

describe("launchd 서비스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPatterns.mockReturnValue([]);
  });

  describe("findPlistFiles", () => {
    it("디렉토리가 없으면 빈 배열을 반환한다", () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(findPlistFiles()).toEqual([]);
    });

    it("패턴에 맞는 plist 파일만 반환한다", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        "com.test.job.plist" as unknown as fs.Dirent,
        "com.other.plist" as unknown as fs.Dirent,
        "readme.txt" as unknown as fs.Dirent,
      ]);
      mockMatchesAnyPattern.mockImplementation((name) => name === "com.test.job.plist");

      const result = findPlistFiles();

      expect(result).toHaveLength(1);
      expect(result[0]).toContain("com.test.job.plist");
    });

    it("에러 발생 시 빈 배열을 반환한다", () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error("permission denied");
      });

      expect(findPlistFiles()).toEqual([]);
    });
  });

  describe("getLoadedJobs", () => {
    it("launchctl list 출력을 파싱하여 레이블 Set을 반환한다", () => {
      mockExecSync.mockReturnValue(
        "PID\tStatus\tLabel\n123\t0\tcom.test.job\n-\t0\tcom.other.job\n",
      );
      mockMatchesAnyPattern.mockReturnValue(true);

      const result = getLoadedJobs();

      expect(result.has("com.test.job")).toBe(true);
      expect(result.has("com.other.job")).toBe(true);
    });

    it("에러 발생 시 빈 Set을 반환한다", () => {
      mockExecSync.mockImplementation(() => {
        throw new Error("fail");
      });

      expect(getLoadedJobs().size).toBe(0);
    });
  });

  describe("getLoadedJobPids", () => {
    it("PID를 숫자로 파싱한다", () => {
      mockExecSync.mockReturnValue("123\t0\tcom.test.job\n-\t0\tcom.no.pid\n");
      mockMatchesAnyPattern.mockReturnValue(true);

      const result = getLoadedJobPids();

      expect(result.get("com.test.job")).toBe(123);
      expect(result.get("com.no.pid")).toBe(0);
    });
  });

  describe("isJobLoaded", () => {
    it("로드된 작업이면 true를 반환한다", () => {
      mockExecSync.mockReturnValue("123\t0\tcom.test.job\n");
      mockMatchesAnyPattern.mockReturnValue(true);

      expect(isJobLoaded("com.test.job")).toBe(true);
    });

    it("로드되지 않은 작업이면 false를 반환한다", () => {
      mockExecSync.mockReturnValue("");

      expect(isJobLoaded("com.missing.job")).toBe(false);
    });
  });

  describe("loadJob / unloadJob / startJob", () => {
    it("loadJob은 launchctl load 명령을 실행한다", () => {
      mockExecuteCommand.mockReturnValue({ success: true, message: "ok" });

      loadJob("/path/to/test.plist");

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        'launchctl load "/path/to/test.plist"',
        expect.objectContaining({ successMessage: "작업이 활성화되었습니다." }),
      );
    });

    it("unloadJob은 launchctl unload 명령을 실행한다", () => {
      mockExecuteCommand.mockReturnValue({ success: true, message: "ok" });

      unloadJob("/path/to/test.plist");

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        'launchctl unload "/path/to/test.plist"',
        expect.objectContaining({ successMessage: "작업이 비활성화되었습니다." }),
      );
    });

    it("startJob은 launchctl start 명령을 실행한다", () => {
      mockExecuteCommand.mockReturnValue({ success: true, message: "ok" });

      startJob("com.test.job");

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        'launchctl start "com.test.job"',
        expect.objectContaining({ successMessage: "작업이 시작되었습니다." }),
      );
    });
  });

  describe("toggleJob", () => {
    it("로드된 작업이면 unload한다", () => {
      mockExecSync.mockReturnValue("123\t0\tcom.test.job\n");
      mockMatchesAnyPattern.mockReturnValue(true);
      mockExecuteCommand.mockReturnValue({ success: true, message: "비활성화" });

      toggleJob("/path.plist", "com.test.job");

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        expect.stringContaining("unload"),
        expect.anything(),
      );
    });

    it("로드되지 않은 작업이면 load한다", () => {
      mockExecSync.mockReturnValue("");
      mockExecuteCommand.mockReturnValue({ success: true, message: "활성화" });

      toggleJob("/path.plist", "com.test.job");

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        expect.stringContaining("load"),
        expect.anything(),
      );
    });
  });

  describe("listAllJobs", () => {
    it("plist 파일을 파싱하여 LaunchdJob 배열을 반환한다", () => {
      // findPlistFiles mock
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(["com.test.plist" as unknown as fs.Dirent]);
      mockMatchesAnyPattern.mockReturnValue(true);

      // getLoadedJobs mock
      mockExecSync.mockReturnValue("123\t0\tcom.test.label\n");

      // plist-parser mocks
      mockParsePlistFile.mockReturnValue({});
      mockExtractLabel.mockReturnValue("com.test.label");
      mockGetJobNameFromLabel.mockReturnValue("test");
      mockExtractSchedule.mockReturnValue({ type: "unknown" });
      mockExtractLogPath.mockReturnValue("/tmp/test.log");
      mockExtractScriptPath.mockReturnValue("/usr/local/bin/test.sh");
      mockScheduleToText.mockReturnValue("알 수 없음");
      mockGetLastRunInfo.mockReturnValue(null);

      const jobs = listAllJobs();

      expect(jobs).toHaveLength(1);
      expect(jobs[0].label).toBe("com.test.label");
      expect(jobs[0].isLoaded).toBe(true);
    });

    it("parsePlistFile이 null이면 해당 파일을 건너뛴다", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(["bad.plist" as unknown as fs.Dirent]);
      mockMatchesAnyPattern.mockReturnValue(true);
      mockExecSync.mockReturnValue("");
      mockParsePlistFile.mockReturnValue(null);

      const jobs = listAllJobs();

      expect(jobs).toHaveLength(0);
    });
  });

  describe("findJobById", () => {
    it("존재하는 ID의 작업을 반환한다", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(["job.plist" as unknown as fs.Dirent]);
      mockMatchesAnyPattern.mockReturnValue(true);
      mockExecSync.mockReturnValue("");
      mockParsePlistFile.mockReturnValue({});
      mockExtractLabel.mockReturnValue("com.find.me");
      mockGetJobNameFromLabel.mockReturnValue("find-me");
      mockExtractSchedule.mockReturnValue({ type: "unknown" });
      mockExtractLogPath.mockReturnValue(null);
      mockExtractScriptPath.mockReturnValue("/bin/test");
      mockScheduleToText.mockReturnValue("알 수 없음");

      const job = findJobById("com.find.me");

      expect(job).not.toBeNull();
      expect(job?.label).toBe("com.find.me");
    });

    it("존재하지 않는 ID이면 null을 반환한다", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([]);
      mockExecSync.mockReturnValue("");

      expect(findJobById("com.nonexistent")).toBeNull();
    });
  });
});
