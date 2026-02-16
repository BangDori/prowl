/** Task 필터링·정렬 유틸 */
import type { Task, TaskPriority, TasksByDate } from "@shared/types";

export type TaskSortMode = "priority" | "time";

const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

/** 날짜별 태스크 맵에서 특정 날짜의 태스크 반환 */
export function getTasksForDate(tasksByDate: TasksByDate, dateStr: string): Task[] {
  return tasksByDate[dateStr] ?? [];
}

/** 태스크 목록을 정렬 (기본: 우선순위순, time: 시간순) */
export function sortTasks(tasks: Task[], mode: TaskSortMode = "priority"): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (mode === "time") {
      const aTime = a.dueTime ?? "\xff";
      const bTime = b.dueTime ?? "\xff";
      if (aTime !== bTime) return aTime.localeCompare(bTime);
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    }
    const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pDiff !== 0) return pDiff;
    const aTime = a.dueTime ?? "\xff";
    const bTime = b.dueTime ?? "\xff";
    return aTime.localeCompare(bTime);
  });
}

/** 해당 날짜의 최고 우선순위 반환 (미완료 태스크 기준) */
export function highestPriority(tasks: Task[]): TaskPriority | null {
  const incomplete = tasks.filter((t) => !t.completed);
  if (incomplete.length === 0) return null;
  return incomplete.reduce<TaskPriority>(
    (best, t) => (PRIORITY_ORDER[t.priority] < PRIORITY_ORDER[best] ? t.priority : best),
    "low",
  );
}

/** 오늘 이후 upcoming 태스크 그룹핑 (날짜순) */
export function getUpcomingTasks(
  tasksByDate: TasksByDate,
  showCompleted: boolean,
  sortMode: TaskSortMode = "priority",
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
  options: { priority?: TaskPriority; showCompleted: boolean },
): TasksByDate {
  const result: TasksByDate = {};
  for (const [date, tasks] of Object.entries(tasksByDate)) {
    let filtered = tasks;
    if (options.priority) {
      filtered = filtered.filter((t) => t.priority === options.priority);
    }
    if (!options.showCompleted) {
      filtered = filtered.filter((t) => !t.completed);
    }
    if (filtered.length > 0) result[date] = filtered;
  }
  return result;
}
