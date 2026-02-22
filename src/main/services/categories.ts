/** 파일 기반 카테고리 CRUD 서비스 (~/.prowl/task-calendar/task-categories.json) */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { TaskCategoryItem } from "@shared/types";
import { PROWL_DATA_DIR, TASK_SUBFOLDER } from "@shared/types";
import { app } from "electron";

const CATEGORIES_FILE = "task-categories.json";

const DEFAULT_CATEGORIES: TaskCategoryItem[] = [{ name: "기타", color: "#6b7280" }];

const COLOR_PALETTE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];

/** categories.json 파일 경로 */
function categoriesFilePath(): string {
  return join(app.getPath("home"), PROWL_DATA_DIR, TASK_SUBFOLDER, CATEGORIES_FILE);
}

/** 카테고리 목록 읽기 */
export function listCategories(): TaskCategoryItem[] {
  const filePath = categoriesFilePath();
  if (!existsSync(filePath)) return DEFAULT_CATEGORIES;
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return DEFAULT_CATEGORIES;
}

/** 카테고리 목록 저장 */
function saveCategories(cats: TaskCategoryItem[]): void {
  writeFileSync(categoriesFilePath(), JSON.stringify(cats, null, 2), "utf-8");
}

/** 신규 카테고리에 배정할 다음 색상 */
function getNextColor(currentCount: number): string {
  return COLOR_PALETTE[(currentCount - 1) % COLOR_PALETTE.length];
}

/** 카테고리 추가 (이미 있으면 에러) */
export function addCategory(name: string): TaskCategoryItem {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("카테고리 이름이 비어 있습니다.");
  const cats = listCategories();
  if (cats.some((c) => c.name === trimmed)) throw new Error(`이미 존재하는 카테고리: ${trimmed}`);
  const color = getNextColor(cats.length);
  const next = [...cats, { name: trimmed, color }];
  saveCategories(next);
  return { name: trimmed, color };
}

/** 카테고리 이름 변경 + 모든 태스크 파일에서 category 필드 업데이트 */
export function renameCategory(oldName: string, newName: string): void {
  const trimmedNew = newName.trim();
  if (!trimmedNew) throw new Error("새 카테고리 이름이 비어 있습니다.");
  if (oldName === "기타") throw new Error("'기타' 카테고리는 이름을 변경할 수 없습니다.");

  const cats = listCategories();
  const idx = cats.findIndex((c) => c.name === oldName);
  if (idx === -1) throw new Error(`카테고리를 찾을 수 없음: ${oldName}`);
  if (cats.some((c) => c.name === trimmedNew))
    throw new Error(`이미 존재하는 카테고리: ${trimmedNew}`);

  cats[idx] = { ...cats[idx], name: trimmedNew };
  saveCategories(cats);

  // 모든 태스크 파일에서 카테고리 이름 업데이트
  updateTaskCategoryName(oldName, trimmedNew);
}

/** 카테고리 삭제 (할당된 태스크는 '기타'로 변경) */
export function deleteCategory(name: string): void {
  if (name === "기타") throw new Error("'기타' 카테고리는 삭제할 수 없습니다.");

  const cats = listCategories();
  if (!cats.some((c) => c.name === name)) throw new Error(`카테고리를 찾을 수 없음: ${name}`);

  const next = cats.filter((c) => c.name !== name);
  saveCategories(next);

  // 해당 카테고리 태스크를 '기타'로 변경
  updateTaskCategoryName(name, "기타");
}

// ── 태스크 파일 일괄 카테고리 업데이트 ──────────────────────────────

import { mkdirSync, readdirSync } from "node:fs";

const DATE_FILE_RE = /^\d{4}-\d{2}-\d{2}\.json$/;

function getTaskFolder(): string {
  return join(app.getPath("home"), PROWL_DATA_DIR, TASK_SUBFOLDER);
}

function ensureFolder(): string {
  const folder = getTaskFolder();
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
  return folder;
}

function patchCategoryInFile(filePath: string, oldName: string, newName: string): boolean {
  if (!existsSync(filePath)) return false;
  try {
    const raw = readFileSync(filePath, "utf-8");
    const tasks = JSON.parse(raw);
    if (!Array.isArray(tasks)) return false;
    let changed = false;
    for (const task of tasks) {
      if (task.category === oldName) {
        task.category = newName;
        changed = true;
      }
    }
    if (changed) writeFileSync(filePath, JSON.stringify(tasks, null, 2), "utf-8");
    return changed;
  } catch {
    return false;
  }
}

/** 날짜 파일 전체 + backlog.json 에서 카테고리 이름 일괄 변경 */
function updateTaskCategoryName(oldName: string, newName: string): void {
  const folder = ensureFolder();
  try {
    // 날짜별 파일
    const files = readdirSync(folder).filter((f) => DATE_FILE_RE.test(f));
    for (const file of files) {
      patchCategoryInFile(join(folder, file), oldName, newName);
    }
    // backlog
    patchCategoryInFile(join(folder, "backlog.json"), oldName, newName);
  } catch (error) {
    console.error("[Categories] updateTaskCategoryName failed:", error);
  }
}
