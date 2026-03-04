/** Task CRUD 서비스 유닛 테스트 */
import type { Task } from "@shared/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockExistsSync, mockReadFileSync, mockWriteFileSync, mockReaddirSync, mockMkdirSync } =
  vi.hoisted(() => ({
    mockExistsSync: vi.fn(),
    mockReadFileSync: vi.fn(),
    mockWriteFileSync: vi.fn(),
    mockReaddirSync: vi.fn(),
    mockMkdirSync: vi.fn(),
    mockCopyFileSync: vi.fn(),
  }));

vi.mock("node:fs", () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  readdirSync: mockReaddirSync,
  mkdirSync: mockMkdirSync,
  copyFileSync: vi.fn(),
}));

vi.mock("@main/lib/prowl-home", () => ({
  getDataHome: vi.fn().mockReturnValue("/home/test"),
}));

import {
  addDateTask,
  addTaskToBacklog,
  deleteBacklogTask,
  deleteTask,
  getDateTasks,
  listBacklogTasks,
  listTasksByDateRange,
  listTasksByMonth,
  toggleBacklogComplete,
  toggleTaskComplete,
  updateBacklogTask,
  updateTask,
} from "./tasks";

const BASE_TASK: Task = {
  id: "t1",
  title: "테스트 태스크",
  completed: false,
  createdAt: "2025-01-15T00:00:00.000Z",
};

describe("tasks 서비스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본: 폴더 존재, 파일 없음, 빈 목록
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([]);
    mockReadFileSync.mockReturnValue("[]");
  });

  // ── 날짜 기반 CRUD ───────────────────────────────────────────────

  describe("addDateTask", () => {
    it("날짜 파일이 없으면 빈 배열에서 시작해 태스크를 저장한다", () => {
      // 폴더는 있고 파일은 없음
      mockExistsSync.mockImplementation((p: string) => !p.endsWith(".json"));

      addDateTask("2025-01-15", BASE_TASK);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("2025-01-15.json"),
        expect.stringContaining("테스트 태스크"),
        "utf-8",
      );
    });

    it("기존 태스크가 있으면 append한다", () => {
      const existing = { ...BASE_TASK, id: "t0", title: "기존" };
      mockReadFileSync.mockReturnValue(JSON.stringify([existing]));

      addDateTask("2025-01-15", BASE_TASK);

      const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
      expect(written).toHaveLength(2);
    });
  });

  describe("getDateTasks", () => {
    it("파일 없으면 빈 배열 반환", () => {
      mockExistsSync.mockImplementation((p: string) => !p.endsWith(".json"));
      expect(getDateTasks("2025-01-15")).toEqual([]);
    });

    it("파일 있으면 태스크 목록 반환", () => {
      mockReadFileSync.mockReturnValue(JSON.stringify([BASE_TASK]));
      expect(getDateTasks("2025-01-15")).toHaveLength(1);
    });

    it("파싱 실패 시 빈 배열 반환", () => {
      mockReadFileSync.mockReturnValue("invalid json");
      expect(getDateTasks("2025-01-15")).toEqual([]);
    });
  });

  describe("updateTask", () => {
    it("id로 태스크를 찾아 수정한다", () => {
      mockReadFileSync.mockReturnValue(JSON.stringify([BASE_TASK]));
      const updated = { ...BASE_TASK, title: "수정된 제목" };

      updateTask("2025-01-15", updated);

      const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
      expect(written[0].title).toBe("수정된 제목");
    });

    it("없는 태스크 수정 시 에러", () => {
      mockReadFileSync.mockReturnValue(JSON.stringify([]));
      expect(() => updateTask("2025-01-15", BASE_TASK)).toThrow("Task not found");
    });

    it("완료된 태스크 수정 시 에러", () => {
      mockReadFileSync.mockReturnValue(JSON.stringify([{ ...BASE_TASK, completed: true }]));
      expect(() => updateTask("2025-01-15", BASE_TASK)).toThrow("완료된 태스크");
    });
  });

  describe("toggleTaskComplete", () => {
    it("미완료 → 완료 토글 시 completedAt이 설정된다", () => {
      mockReadFileSync.mockReturnValue(JSON.stringify([BASE_TASK]));

      toggleTaskComplete("2025-01-15", "t1");

      const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
      expect(written[0].completed).toBe(true);
      expect(written[0].completedAt).toBeTruthy();
    });

    it("완료 → 미완료 토글 시 completedAt이 제거된다", () => {
      const completedTask = {
        ...BASE_TASK,
        completed: true,
        completedAt: "2025-01-15T00:00:00.000Z",
      };
      mockReadFileSync.mockReturnValue(JSON.stringify([completedTask]));

      toggleTaskComplete("2025-01-15", "t1");

      const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
      expect(written[0].completed).toBe(false);
      expect(written[0].completedAt).toBeUndefined();
    });

    it("없는 태스크 토글 시 에러", () => {
      mockReadFileSync.mockReturnValue(JSON.stringify([]));
      expect(() => toggleTaskComplete("2025-01-15", "not-exist")).toThrow("Task not found");
    });
  });

  describe("deleteTask", () => {
    it("태스크를 삭제한다", () => {
      mockReadFileSync.mockReturnValue(JSON.stringify([BASE_TASK]));

      deleteTask("2025-01-15", "t1");

      const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
      expect(written).toHaveLength(0);
    });

    it("완료된 태스크 삭제 시 에러", () => {
      mockReadFileSync.mockReturnValue(JSON.stringify([{ ...BASE_TASK, completed: true }]));
      expect(() => deleteTask("2025-01-15", "t1")).toThrow("완료된 태스크");
    });

    it("없는 태스크 삭제 시 나머지 목록만 저장 (에러 없음)", () => {
      mockReadFileSync.mockReturnValue(JSON.stringify([BASE_TASK]));
      deleteTask("2025-01-15", "not-exist");
      const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
      expect(written).toHaveLength(1); // BASE_TASK 유지
    });
  });

  // ── 월 단위 조회 ────────────────────────────────────────────────

  describe("listTasksByMonth", () => {
    it("해당 월의 파일만 읽어 반환한다", () => {
      mockReaddirSync.mockReturnValue(["2025-01-15.json", "2025-02-01.json", "2025-01-20.json"]);
      mockReadFileSync.mockReturnValue(JSON.stringify([BASE_TASK]));

      const result = listTasksByMonth(2025, 0); // month=0 → January

      expect(Object.keys(result)).toContain("2025-01-15");
      expect(Object.keys(result)).toContain("2025-01-20");
      expect(Object.keys(result)).not.toContain("2025-02-01");
    });

    it("태스크 없는 날짜는 결과에 포함하지 않는다", () => {
      mockReaddirSync.mockReturnValue(["2025-01-15.json"]);
      mockReadFileSync.mockReturnValue(JSON.stringify([]));

      const result = listTasksByMonth(2025, 0);

      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  // ── 날짜 범위 조회 ──────────────────────────────────────────────

  describe("listTasksByDateRange", () => {
    it("범위 내 날짜 파일만 반환한다", () => {
      mockReaddirSync.mockReturnValue(["2025-01-10.json", "2025-01-15.json", "2025-01-20.json"]);
      mockReadFileSync.mockReturnValue(JSON.stringify([BASE_TASK]));

      const result = listTasksByDateRange("2025-01-12", "2025-01-18");

      expect(Object.keys(result)).toEqual(["2025-01-15"]);
    });

    it("경계 날짜도 포함한다 (inclusive)", () => {
      mockReaddirSync.mockReturnValue(["2025-01-10.json", "2025-01-20.json"]);
      mockReadFileSync.mockReturnValue(JSON.stringify([BASE_TASK]));

      const result = listTasksByDateRange("2025-01-10", "2025-01-20");

      expect(Object.keys(result)).toHaveLength(2);
    });
  });

  // ── 백로그 CRUD ─────────────────────────────────────────────────

  describe("백로그", () => {
    describe("listBacklogTasks", () => {
      it("backlog.json 없으면 빈 배열 반환", () => {
        mockExistsSync.mockImplementation((p: string) => !p.endsWith("backlog.json"));
        expect(listBacklogTasks()).toEqual([]);
      });

      it("backlog.json 있으면 태스크 목록 반환", () => {
        mockReadFileSync.mockReturnValue(JSON.stringify([BASE_TASK]));
        expect(listBacklogTasks()).toHaveLength(1);
      });
    });

    describe("addTaskToBacklog", () => {
      it("백로그에 태스크를 추가한다", () => {
        mockExistsSync.mockImplementation((p: string) => !p.endsWith("backlog.json"));

        addTaskToBacklog(BASE_TASK);

        const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
        expect(written).toHaveLength(1);
        expect(written[0].id).toBe("t1");
      });
    });

    describe("updateBacklogTask", () => {
      it("id로 백로그 태스크를 수정한다", () => {
        mockReadFileSync.mockReturnValue(JSON.stringify([BASE_TASK]));
        const updated = { ...BASE_TASK, title: "수정됨" };

        updateBacklogTask(updated);

        const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
        expect(written[0].title).toBe("수정됨");
      });

      it("없는 태스크 수정 시 에러", () => {
        mockReadFileSync.mockReturnValue(JSON.stringify([]));
        expect(() => updateBacklogTask(BASE_TASK)).toThrow("Backlog task not found");
      });

      it("완료된 태스크 수정 시 에러", () => {
        mockReadFileSync.mockReturnValue(JSON.stringify([{ ...BASE_TASK, completed: true }]));
        expect(() => updateBacklogTask(BASE_TASK)).toThrow("완료된 태스크");
      });
    });

    describe("toggleBacklogComplete", () => {
      it("미완료 → 완료 토글", () => {
        mockReadFileSync.mockReturnValue(JSON.stringify([BASE_TASK]));

        toggleBacklogComplete("t1");

        const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
        expect(written[0].completed).toBe(true);
      });

      it("없는 태스크 토글 시 에러", () => {
        mockReadFileSync.mockReturnValue(JSON.stringify([]));
        expect(() => toggleBacklogComplete("not-exist")).toThrow("Backlog task not found");
      });
    });

    describe("deleteBacklogTask", () => {
      it("백로그 태스크를 삭제한다", () => {
        mockReadFileSync.mockReturnValue(JSON.stringify([BASE_TASK]));

        deleteBacklogTask("t1");

        const written = JSON.parse(vi.mocked(mockWriteFileSync).mock.calls[0][1] as string);
        expect(written).toHaveLength(0);
      });

      it("완료된 백로그 태스크 삭제 시 에러", () => {
        mockReadFileSync.mockReturnValue(JSON.stringify([{ ...BASE_TASK, completed: true }]));
        expect(() => deleteBacklogTask("t1")).toThrow("완료된 태스크");
      });
    });
  });
});
