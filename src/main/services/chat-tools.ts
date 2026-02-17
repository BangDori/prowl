/** 채팅 AI 도구 정의 — Task Manager + Memory 연동 */

import type { Task, TaskPriority } from "@shared/types";
import { tool } from "ai";
import { z } from "zod";
import { getCompactWindow } from "../windows";
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

/** 고유 ID 생성 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

/** Task Manager(Compact View)에 태스크 변경 알림 */
function notifyTasksChanged(): void {
  const win = getCompactWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("tasks:changed");
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
      deleteMemory(id);
      return { success: true };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

/** 채팅에서 사용할 도구 맵 반환 */
export function getChatTools() {
  return {
    get_today_info,
    list_tasks,
    add_task,
    update_task,
    delete_task,
    toggle_task_complete,
    save_memory,
    list_memories,
    update_memory,
    delete_memory,
  };
}
