/** 채팅 AI 도구 정의 — Task Manager + Memory + Prowl FS 연동, 툴 레지스트리 등록 */

import "./chat-tools-fs";
import type { Task, TaskPriority } from "@shared/types";
import { tool } from "ai";
import { z } from "zod";
import { getChatWindow, getCompactWindow, getDashboardWindow } from "../windows";
import { waitForApproval } from "./approval";
import { addMemory, deleteMemory, listMemories, updateMemory } from "./memory";
import { refreshReminders } from "./task-reminder";
import {
  addDateTask,
  addTaskToBacklog,
  deleteBacklogTask,
  deleteTask,
  getDateTasks,
  listBacklogTasks,
  listTasksByDateRange,
  toggleBacklogComplete,
  toggleTaskComplete,
  updateBacklogTask,
  updateTask,
} from "./tasks";
import { toolRegistry } from "./tool-registry";

/** 고유 ID 생성 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

/** 채팅 윈도우에 이벤트 전송 */
function sendToChat(channel: string, ...args: unknown[]): void {
  const win = getChatWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args);
  }
}

/** 대시보드에 메모리 변경 알림 */
function notifyMemoryChanged(): void {
  const win = getDashboardWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("memory:changed");
  }
}

/** Task Manager(Compact View) + 대시보드에 태스크 변경 알림 */
function notifyTasksChanged(): void {
  for (const win of [getCompactWindow(), getDashboardWindow()]) {
    if (win && !win.isDestroyed()) {
      win.webContents.send("tasks:changed");
    }
  }
}

const get_today_info = tool({
  description: "Get today's date, current time, and day of week.",
  inputSchema: z.object({}),
  execute: async () => {
    const now = new Date();
    return {
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      dayOfWeek: ["일", "월", "화", "수", "목", "금", "토"][now.getDay()],
    };
  },
});

const list_tasks = tool({
  description:
    'List tasks for a date range or the backlog. For date-based tasks, provide startDate and endDate in "YYYY-MM-DD" format. For backlog tasks, set backlog to true.',
  inputSchema: z.object({
    startDate: z.string().optional().describe('Start date "YYYY-MM-DD"'),
    endDate: z.string().optional().describe('End date "YYYY-MM-DD"'),
    backlog: z.boolean().optional().describe("If true, list backlog tasks"),
  }),
  execute: async ({ startDate, endDate, backlog }) => {
    try {
      if (backlog) return { backlog: listBacklogTasks() };
      if (!startDate || !endDate) return { error: "startDate and endDate are required" };
      return { tasksByDate: listTasksByDateRange(startDate, endDate) };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

const add_task = tool({
  description:
    'Create a new task. Provide date in "YYYY-MM-DD" for date-based tasks, or omit date (or set backlog to true) for backlog.',
  inputSchema: z.object({
    title: z.string().describe("Task title"),
    date: z.string().optional().describe('Target date "YYYY-MM-DD" (omit for backlog)'),
    backlog: z.boolean().optional().describe("If true, add to backlog"),
    description: z.string().optional(),
    dueTime: z.string().optional().describe('Time in "HH:MM" format'),
    priority: z.enum(["high", "medium", "low"]).optional().describe("Defaults to medium"),
    category: z.string().optional(),
  }),
  execute: async ({ title, date, backlog, description, dueTime, priority, category }) => {
    try {
      const task: Task = {
        id: generateId(),
        title,
        description,
        dueTime,
        priority: (priority ?? "medium") as TaskPriority,
        category,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      if (backlog || !date) {
        addTaskToBacklog(task);
      } else {
        addDateTask(date, task);
      }
      refreshReminders();
      notifyTasksChanged();
      return { success: true, task, date: date ?? "backlog" };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

const update_task = tool({
  description:
    "Update an existing task. Requires taskId and either date or backlog:true. Use newDate to move a task to a different date or backlog.",
  inputSchema: z.object({
    taskId: z.string().describe("Task ID"),
    date: z.string().optional().describe('Current date "YYYY-MM-DD"'),
    backlog: z.boolean().optional().describe("True if task is in backlog"),
    title: z.string().optional(),
    description: z.string().optional(),
    dueTime: z.string().optional().describe('"HH:MM" format'),
    priority: z.enum(["high", "medium", "low"]).optional(),
    category: z.string().optional(),
    newDate: z.string().optional().describe('Move to new date "YYYY-MM-DD" or "backlog"'),
  }),
  execute: async ({ taskId, date, backlog, newDate, ...updates }) => {
    try {
      // 현재 태스크 찾기
      let currentTask: Task | undefined;
      if (backlog) {
        currentTask = listBacklogTasks().find((t) => t.id === taskId);
      } else if (date) {
        currentTask = getDateTasks(date).find((t) => t.id === taskId);
      }
      if (!currentTask) return { error: `Task not found: ${taskId}` };

      // 필드 업데이트 (undefined가 아닌 값만 반영)
      const merged: Task = { ...currentTask };
      if (updates.title !== undefined) merged.title = updates.title;
      if (updates.description !== undefined) merged.description = updates.description;
      if (updates.dueTime !== undefined) merged.dueTime = updates.dueTime;
      if (updates.priority !== undefined) merged.priority = updates.priority as TaskPriority;
      if (updates.category !== undefined) merged.category = updates.category;

      // 날짜 이동
      if (newDate) {
        // 원본에서 제거
        if (backlog) deleteBacklogTask(taskId);
        else if (date) deleteTask(date, taskId);

        // 새 위치에 추가
        if (newDate === "backlog") {
          merged.dueTime = undefined;
          addTaskToBacklog(merged);
        } else {
          addDateTask(newDate, merged);
        }
      } else {
        // 제자리 업데이트
        if (backlog) updateBacklogTask(merged);
        else if (date) updateTask(date, merged);
      }

      refreshReminders();
      notifyTasksChanged();
      return { success: true, task: merged };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

const delete_task = tool({
  description: "Delete a task by ID. Provide date for date-based tasks or backlog:true.",
  inputSchema: z.object({
    taskId: z.string().describe("Task ID"),
    date: z.string().optional().describe('Date "YYYY-MM-DD"'),
    backlog: z.boolean().optional().describe("True if task is in backlog"),
  }),
  execute: async ({ taskId, date, backlog }) => {
    try {
      // 삭제 전 태스크 타이틀 조회
      let taskTitle = taskId;
      if (backlog) {
        taskTitle = listBacklogTasks().find((t) => t.id === taskId)?.title ?? taskId;
      } else if (date) {
        taskTitle = getDateTasks(date).find((t) => t.id === taskId)?.title ?? taskId;
      }

      const approvalId = `approval_${generateId()}`;
      sendToChat("chat:stream-message", {
        id: approvalId,
        role: "assistant",
        content: `"${taskTitle}" 태스크를 삭제할까요?`,
        timestamp: Date.now(),
        approval: {
          id: approvalId,
          status: "pending",
          toolName: "delete_task",
          displayName: taskTitle,
          args: { taskId, date, backlog },
        },
      });

      const approved = await waitForApproval(approvalId);
      if (!approved) {
        return { cancelled: true, message: "사용자가 삭제를 취소했습니다." };
      }

      if (backlog) {
        deleteBacklogTask(taskId);
      } else if (date) {
        deleteTask(date, taskId);
      } else {
        return { error: "Provide date or set backlog: true" };
      }
      refreshReminders();
      notifyTasksChanged();
      return { success: true };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

const toggle_task_complete = tool({
  description: "Toggle a task between completed and incomplete.",
  inputSchema: z.object({
    taskId: z.string().describe("Task ID"),
    date: z.string().optional().describe('Date "YYYY-MM-DD"'),
    backlog: z.boolean().optional().describe("True if task is in backlog"),
  }),
  execute: async ({ taskId, date, backlog }) => {
    try {
      if (backlog) {
        toggleBacklogComplete(taskId);
      } else if (date) {
        toggleTaskComplete(date, taskId);
      } else {
        return { error: "Provide date or set backlog: true" };
      }
      notifyTasksChanged();
      return { success: true };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

const save_memory = tool({
  description:
    "Save a user preference or instruction that should be remembered across conversations. Use when the user explicitly tells you something to always/never do, or personal info to remember.",
  inputSchema: z.object({
    content: z.string().describe("The preference or instruction to remember"),
  }),
  execute: async ({ content }) => {
    try {
      const memory = addMemory(content);
      notifyMemoryChanged();
      return { success: true, memory };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

const list_memories = tool({
  description:
    "List all saved user memories/preferences. Use when the user asks what you remember, or before updating/deleting a memory to find its ID.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      return { memories: listMemories() };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

const update_memory = tool({
  description:
    "Update the content of an existing memory. Use list_memories first to find the memory ID.",
  inputSchema: z.object({
    id: z.string().describe("Memory ID to update"),
    content: z.string().describe("New content for the memory"),
  }),
  execute: async ({ id, content }) => {
    try {
      updateMemory(id, content);
      notifyMemoryChanged();
      return { success: true };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

const delete_memory = tool({
  description: "Delete a saved memory. Use list_memories first to find the memory ID.",
  inputSchema: z.object({
    id: z.string().describe("Memory ID to delete"),
  }),
  execute: async ({ id }) => {
    try {
      // 삭제 전 메모리 내용 조회
      const memory = listMemories().find((m) => m.id === id);
      const displayName = memory ? memory.content.slice(0, 40) : id;

      const approvalId = `approval_${generateId()}`;
      sendToChat("chat:stream-message", {
        id: approvalId,
        role: "assistant",
        content: `"${displayName}" 메모리를 삭제할까요?`,
        timestamp: Date.now(),
        approval: {
          id: approvalId,
          status: "pending",
          toolName: "delete_memory",
          displayName,
          args: { id },
        },
      });

      const approved = await waitForApproval(approvalId);
      if (!approved) {
        return { cancelled: true, message: "사용자가 삭제를 취소했습니다." };
      }

      deleteMemory(id);
      notifyMemoryChanged();
      return { success: true };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

// 태스크 관리 툴 등록
toolRegistry.register(
  { name: "task-manager", label: "태스크 관리", dangerLevel: "moderate" },
  { get_today_info, list_tasks, add_task, update_task, delete_task, toggle_task_complete },
);

// 메모리 관리 툴 등록
toolRegistry.register(
  { name: "memory-manager", label: "메모리 관리", dangerLevel: "safe" },
  { save_memory, list_memories, update_memory, delete_memory },
);

/** 레지스트리에 등록된 전체 도구 반환 (chat.ts에서 사용) */
export function getChatTools() {
  return toolRegistry.getAllTools();
}
