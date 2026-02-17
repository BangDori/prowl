/** 파일 기반 Task CRUD 서비스 (~/.prowl/task-calendar/*.json) */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { Task, TasksByDate } from "@shared/types";
import { LEGACY_TASK_FOLDER, PROWL_DATA_DIR, TASK_SUBFOLDER } from "@shared/types";
import { app } from "electron";

const DATE_FILE_RE = /^\d{4}-\d{2}-\d{2}\.json$/;

/** 태스크 폴더 절대 경로 (~/.prowl/task-calendar) */
function getTaskFolder(): string {
  return join(app.getPath("home"), PROWL_DATA_DIR, TASK_SUBFOLDER);
}

/** 폴더가 없으면 생성 + 기존 데이터 마이그레이션 */
function ensureFolder(): string {
  const folder = getTaskFolder();
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
    migrateLegacyData(folder);
  }
  return folder;
}

/** ~/prowl-task-calendar/ → ~/.prowl/task-calendar/ 마이그레이션 */
function migrateLegacyData(newFolder: string): void {
  const legacyFolder = join(app.getPath("home"), LEGACY_TASK_FOLDER);
  if (!existsSync(legacyFolder)) return;
  try {
    const files = readdirSync(legacyFolder).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const src = join(legacyFolder, file);
      const dest = join(newFolder, file);
      if (!existsSync(dest)) copyFileSync(src, dest);
    }
    console.log(`[Tasks] Migrated ${files.length} files from ${legacyFolder}`);
  } catch (error) {
    console.error("[Tasks] Migration failed:", error);
  }
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

/** 날짜 범위 기반 태스크 조회 (ISO 8601 "YYYY-MM-DD") */
export function listTasksByDateRange(startDate: string, endDate: string): TasksByDate {
  const folder = ensureFolder();
  const result: TasksByDate = {};

  try {
    const files = readdirSync(folder).filter((f) => DATE_FILE_RE.test(f));
    for (const file of files) {
      const date = file.replace(".json", "");
      if (date >= startDate && date <= endDate) {
        const tasks = readDateFile(date);
        if (tasks.length > 0) result[date] = tasks;
      }
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

/** 특정 날짜에 태스크 추가 */
export function addDateTask(date: string, task: Task): void {
  const tasks = readDateFile(date);
  tasks.push(task);
  writeDateFile(date, tasks);
}

/** 특정 날짜의 태스크 목록 조회 (외부용) */
export function getDateTasks(date: string): Task[] {
  return readDateFile(date);
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

// ── Backlog ──────────────────────────────────────────

const BACKLOG_FILE = "backlog.json";

/** backlog.json 파일 경로 */
function backlogFilePath(): string {
  return join(ensureFolder(), BACKLOG_FILE);
}

/** 백로그 태스크 목록 읽기 */
function readBacklogFile(): Task[] {
  const filePath = backlogFilePath();
  if (!existsSync(filePath)) return [];
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 백로그 태스크 목록 쓰기 */
function writeBacklogFile(tasks: Task[]): void {
  writeFileSync(backlogFilePath(), JSON.stringify(tasks, null, 2), "utf-8");
}

/** 백로그 전체 조회 */
export function listBacklogTasks(): Task[] {
  return readBacklogFile();
}

/** 백로그에 태스크 추가 */
export function addTaskToBacklog(task: Task): void {
  const tasks = readBacklogFile();
  tasks.push(task);
  writeBacklogFile(tasks);
}

/** 백로그 태스크 수정 */
export function updateBacklogTask(task: Task): void {
  const tasks = readBacklogFile();
  const idx = tasks.findIndex((t) => t.id === task.id);
  if (idx === -1) throw new Error(`Backlog task not found: ${task.id}`);
  tasks[idx] = task;
  writeBacklogFile(tasks);
}

/** 백로그 태스크 완료 토글 */
export function toggleBacklogComplete(taskId: string): void {
  const tasks = readBacklogFile();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Backlog task not found: ${taskId}`);
  task.completed = !task.completed;
  task.completedAt = task.completed ? new Date().toISOString() : undefined;
  writeBacklogFile(tasks);
}

/** 백로그 태스크 삭제 */
export function deleteBacklogTask(taskId: string): void {
  const tasks = readBacklogFile().filter((t) => t.id !== taskId);
  writeBacklogFile(tasks);
}
