/** 파일 기반 Task CRUD 서비스 (~/prowl-task-calendar/*.json) */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Task, TasksByDate } from "@shared/types";
import { TASK_FOLDER_NAME } from "@shared/types";
import { app } from "electron";

const DATE_FILE_RE = /^\d{4}-\d{2}-\d{2}\.json$/;

/** 태스크 폴더 절대 경로 */
function getTaskFolder(): string {
  return join(app.getPath("home"), TASK_FOLDER_NAME);
}

/** 폴더가 없으면 생성 */
function ensureFolder(): string {
  const folder = getTaskFolder();
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
  return folder;
}

/** 특정 날짜 파일 경로 */
function dateFilePath(date: string): string {
  return join(ensureFolder(), `${date}.json`);
}

/** 날짜 파일에서 태스크 목록 읽기 */
function readDateFile(date: string): Task[] {
  const filePath = dateFilePath(date);
  if (!existsSync(filePath)) return [];
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 날짜 파일에 태스크 목록 쓰기 */
function writeDateFile(date: string, tasks: Task[]): void {
  writeFileSync(dateFilePath(date), JSON.stringify(tasks, null, 2), "utf-8");
}

/** 월 단위 태스크 조회 (해당 월의 모든 날짜 파일 읽기) */
export function listTasksByMonth(year: number, month: number): TasksByDate {
  const folder = ensureFolder();
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const result: TasksByDate = {};

  try {
    const files = readdirSync(folder).filter((f) => DATE_FILE_RE.test(f) && f.startsWith(prefix));
    for (const file of files) {
      const date = file.replace(".json", "");
      const tasks = readDateFile(date);
      if (tasks.length > 0) result[date] = tasks;
    }
  } catch {
    // 폴더 읽기 실패 시 빈 결과 반환
  }

  return result;
}

/** 존재하는 모든 날짜 파일명 목록 */
export function scanDates(): string[] {
  const folder = ensureFolder();
  try {
    return readdirSync(folder)
      .filter((f) => DATE_FILE_RE.test(f))
      .map((f) => f.replace(".json", ""))
      .sort();
  } catch {
    return [];
  }
}

/** 태스크 수정 (해당 날짜 파일에서 id로 찾아 교체) */
export function updateTask(date: string, task: Task): void {
  const tasks = readDateFile(date);
  const idx = tasks.findIndex((t) => t.id === task.id);
  if (idx === -1) throw new Error(`Task not found: ${task.id}`);
  tasks[idx] = task;
  writeDateFile(date, tasks);
}

/** 태스크 완료 토글 */
export function toggleTaskComplete(date: string, taskId: string): void {
  const tasks = readDateFile(date);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);
  task.completed = !task.completed;
  task.completedAt = task.completed ? new Date().toISOString() : undefined;
  writeDateFile(date, tasks);
}

/** 태스크 삭제 */
export function deleteTask(date: string, taskId: string): void {
  const tasks = readDateFile(date).filter((t) => t.id !== taskId);
  writeDateFile(date, tasks);
}
