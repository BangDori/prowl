/** update_task AI 도구 단위 테스트 — patch 시맨틱 및 빈 문자열 가드 검증 */
import type { Task } from "@shared/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ai SDK: tool()은 pass-through이므로 동일하게 모킹
vi.mock("ai", () => ({ tool: vi.fn((c) => c) }));

vi.mock("./tasks", () => ({
  listBacklogTasks: vi.fn(),
  getDateTasks: vi.fn(),
  deleteBacklogTask: vi.fn(),
  deleteTask: vi.fn(),
  addTaskToBacklog: vi.fn(),
  addDateTask: vi.fn(),
  updateBacklogTask: vi.fn(),
  updateTask: vi.fn(),
}));

vi.mock("./chat-tools-shared", () => ({
  generateId: vi.fn(() => "gen-id"),
  getCurrentRoomId: vi.fn(() => "room-1"),
  notifyTasksChanged: vi.fn(),
  sendToChat: vi.fn(),
}));

vi.mock("./task-reminder", () => ({ refreshReminders: vi.fn() }));
vi.mock("./approval", () => ({ waitForApproval: vi.fn().mockResolvedValue(true) }));

import {
  addDateTask,
  addTaskToBacklog,
  deleteBacklogTask,
  getDateTasks,
  listBacklogTasks,
  updateBacklogTask,
  updateTask,
} from "./tasks";
import { toolRegistry } from "./tool-registry";
// side effect: update_task 등 도구를 toolRegistry에 등록
import "./chat-tools-tasks";

const execute = (toolRegistry.getAllTools().update_task as { execute: Function }).execute;

const BASE_TASK: Task = {
  id: "task-1",
  title: "익주님이 전달해주신 2개 안건 검토",
  category: "업무",
  description: "중요한 안건",
  dueTime: "14:00",
  completed: false,
  createdAt: "2026-02-20T00:00:00.000Z",
};

describe("update_task — 빈 문자열 필드 가드", () => {
  beforeEach(() => vi.clearAllMocks());

  it("backlog→날짜 이동 시 빈 문자열 필드는 기존 값을 유지한다", async () => {
    vi.mocked(listBacklogTasks).mockReturnValue([BASE_TASK]);

    const result = await execute({
      taskId: "task-1",
      backlog: true,
      newDate: "2026-02-26",
      // LLM이 "제공 안함" 의도로 빈 문자열을 채운 상황 (버그 재현)
      title: "",
      category: "",
      description: "",
      dueTime: "",
    });

    expect(result.success).toBe(true);
    expect(deleteBacklogTask).toHaveBeenCalledWith("task-1");
    expect(addDateTask).toHaveBeenCalledWith(
      "2026-02-26",
      expect.objectContaining({
        title: "익주님이 전달해주신 2개 안건 검토",
        category: "업무",
        description: "중요한 안건",
        dueTime: "14:00",
      }),
    );
  });

  it("날짜→날짜 이동 시 빈 문자열 필드는 기존 값을 유지한다", async () => {
    vi.mocked(getDateTasks).mockReturnValue([BASE_TASK]);

    const result = await execute({
      taskId: "task-1",
      date: "2026-02-25",
      newDate: "2026-02-26",
      title: "",
      category: "",
    });

    expect(result.success).toBe(true);
    expect(addDateTask).toHaveBeenCalledWith(
      "2026-02-26",
      expect.objectContaining({
        title: "익주님이 전달해주신 2개 안건 검토",
        category: "업무",
      }),
    );
  });

  it("실제 값이 주어지면 기존 값을 덮어쓴다", async () => {
    vi.mocked(listBacklogTasks).mockReturnValue([BASE_TASK]);

    const result = await execute({
      taskId: "task-1",
      backlog: true,
      title: "수정된 제목",
      category: "개인",
    });

    expect(result.success).toBe(true);
    expect(updateTask).not.toHaveBeenCalled();
    expect(addTaskToBacklog).not.toHaveBeenCalled();
    const calledWith = vi.mocked(updateBacklogTask).mock.calls[0]?.[0];
    expect(calledWith?.title).toBe("수정된 제목");
    expect(calledWith?.category).toBe("개인");
  });

  it("backlog→backlog 이동 시 dueTime이 제거된다", async () => {
    vi.mocked(getDateTasks).mockReturnValue([BASE_TASK]);

    const result = await execute({
      taskId: "task-1",
      date: "2026-02-25",
      newDate: "backlog",
    });

    expect(result.success).toBe(true);
    expect(addTaskToBacklog).toHaveBeenCalledWith(expect.objectContaining({ dueTime: undefined }));
  });

  it("태스크를 찾지 못하면 error를 반환한다", async () => {
    vi.mocked(listBacklogTasks).mockReturnValue([]);

    const result = await execute({ taskId: "not-exist", backlog: true });

    expect(result.error).toMatch("Task not found");
  });
});
