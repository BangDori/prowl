/** Task 필터링·정렬 유틸 */
import type { Task, TasksByDate } from "@shared/types";
import { getCategoryNames } from "./category-utils";

export type TaskSortMode = "category" | "time";

function getCategoryOrder(name: string | undefined): number {
  const names = getCategoryNames();
  const idx = names.indexOf(name ?? "기타");
  return idx === -1 ? 99 : idx;
}

/** 날짜별 태스크 맵에서 특정 날짜의 태스크 반환 */
export function getTasksForDate(tasksByDate: TasksByDate, dateStr: string): Task[] {
  return tasksByDate[dateStr] ?? [];
}

/** 태스크 목록을 정렬 (기본: 카테고리순, time: 시간순) */
export function sortTasks(tasks: Task[], mode: TaskSortMode = "category"): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (mode === "time") {
      const aTime = a.dueTime ?? "\xff";
      const bTime = b.dueTime ?? "\xff";
      if (aTime !== bTime) return aTime.localeCompare(bTime);
      return getCategoryOrder(a.category) - getCategoryOrder(b.category);
    }
    const catDiff = getCategoryOrder(a.category) - getCategoryOrder(b.category);
    if (catDiff !== 0) return catDiff;
    const aTime = a.dueTime ?? "\xff";
    const bTime = b.dueTime ?? "\xff";
    return aTime.localeCompare(bTime);
  });
}

/** 오늘 이후 upcoming 태스크 그룹핑 (날짜순) */
export function getUpcomingTasks(
  tasksByDate: TasksByDate,
  showCompleted: boolean,
  sortMode: TaskSortMode = "category",
): { date: string; tasks: Task[] }[] {
  const today = new Date().toISOString().slice(0, 10);
  return Object.entries(tasksByDate)
    .filter(([date]) => date >= today)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, tasks]) => ({
      date,
      tasks: showCompleted
        ? sortTasks(tasks, sortMode)
        : sortTasks(
            tasks.filter((t) => !t.completed),
            sortMode,
          ),
    }))
    .filter(({ tasks }) => tasks.length > 0);
}

/** 필터 적용 */
export function filterTasksByDate(
  tasksByDate: TasksByDate,
  options: { category?: string; showCompleted: boolean },
): TasksByDate {
  const result: TasksByDate = {};
  for (const [date, tasks] of Object.entries(tasksByDate)) {
    let filtered = tasks;
    if (options.category) {
      filtered = filtered.filter((t) => (t.category ?? "기타") === options.category);
    }
    if (!options.showCompleted) {
      filtered = filtered.filter((t) => !t.completed);
    }
    if (filtered.length > 0) result[date] = filtered;
  }
  return result;
}
