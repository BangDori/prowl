/** 태스크 마감 알림 스케줄러 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Task } from "@shared/types";
import { DEFAULT_REMINDERS, PROWL_DATA_DIR, TASK_SUBFOLDER } from "@shared/types";
import { app, Notification } from "electron";
import { navigateToChatRoom, showChatWindow } from "../windows/chat-window";
import { scanDates } from "./tasks";

function loadTasksForDate(date: string): Task[] {
  const filePath = join(app.getPath("home"), PROWL_DATA_DIR, TASK_SUBFOLDER, `${date}.json`);
  if (!existsSync(filePath)) return [];
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return [];
  }
}

const POLL_INTERVAL_MS = 30000;
const DEFAULT_REMINDER_MINUTES = DEFAULT_REMINDERS[0].minutes;
const DEFAULT_DUE_TIME = "09:00"; // dueTime 없는 태스크 기준 시각
const firedReminders = new Set<string>();
let pollTimer: ReturnType<typeof setInterval> | null = null;

/** 기본 1일 전 알림을 항상 포함한 유효 알림 목록 */
function getEffectiveReminders(task: Task): { minutes: number }[] {
  const reminders = [...(task.reminders ?? [])];
  if (!reminders.some((r) => r.minutes === DEFAULT_REMINDER_MINUTES)) {
    reminders.push({ minutes: DEFAULT_REMINDER_MINUTES });
  }
  return reminders;
}

function reminderKey(taskId: string, minutes: number): string {
  return `${taskId}_${minutes}`;
}

function formatTimeLabel(minutes: number): string {
  if (minutes === 0) return "지금 마감";
  if (minutes < 60) return `${minutes}분 후 마감`;
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}시간 ${m}분 후 마감` : `${h}시간 후 마감`;
  }
  return `${Math.floor(minutes / 1440)}일 후 마감`;
}

function sendTaskReminder(task: Task, minutesBefore: number): void {
  if (!Notification.isSupported()) return;
  const title = minutesBefore === 0 ? `${task.title} 마감!` : task.title;
  const body = task.description
    ? `${formatTimeLabel(minutesBefore)}\n${task.description}`
    : formatTimeLabel(minutesBefore);
  const notification = new Notification({ title, body, silent: false });
  notification.on("click", () => {
    if (task.roomId) {
      navigateToChatRoom(task.roomId);
    } else {
      showChatWindow();
    }
  });
  notification.show();
}

function checkReminders(): void {
  const now = Date.now();
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(now + 86400000).toISOString().slice(0, 10);
  const dates = scanDates().filter((d) => d === todayStr || d === tomorrow);

  for (const date of dates) {
    const tasks = loadTasksForDate(date);

    for (const task of tasks) {
      if (task.completed) continue;

      const dueTime = task.dueTime ?? DEFAULT_DUE_TIME;
      const dueMs = new Date(`${date}T${dueTime}:00`).getTime();
      const effectiveReminders = getEffectiveReminders(task);

      for (const reminder of effectiveReminders) {
        const key = reminderKey(task.id, reminder.minutes);
        if (firedReminders.has(key)) continue;

        const reminderTime = dueMs - reminder.minutes * 60 * 1000;
        const gracePeriod = reminder.minutes === 0 ? 5 * 60 * 1000 : 0;

        if (now >= reminderTime && now <= dueMs + gracePeriod) {
          sendTaskReminder(task, reminder.minutes);
          firedReminders.add(key);
        }

        if (now > dueMs + gracePeriod) {
          firedReminders.add(key);
        }
      }
    }
  }
}

export function startTaskReminderScheduler(): void {
  if (pollTimer) return;
  checkReminders();
  pollTimer = setInterval(checkReminders, POLL_INTERVAL_MS);
}

export function stopTaskReminderScheduler(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export function refreshReminders(): void {
  checkReminders();
}
