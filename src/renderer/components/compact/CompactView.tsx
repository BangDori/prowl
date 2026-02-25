/** Compact Sticky View: 카테고리별/날짜별 태스크 뷰 */

import type { UpcomingRange } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBacklogData } from "../../hooks/useBacklogData";
import { useCategories } from "../../hooks/useCategories";
import { useTaskData } from "../../hooks/useTaskData";
import { useUpcomingTasks } from "../../hooks/useUpcomingTasks";
import { queryKeys } from "../../queries/keys";
import { toDateStr } from "../../utils/calendar";
import { getTasksForDate, getUpcomingTasks, type TaskSortMode } from "../../utils/task-helpers";
import CompactBacklog from "./CompactBacklog";
import type { CategoryTaskEntry } from "./CompactCategoryAll";
import CompactCategoryAll from "./CompactCategoryAll";
import CompactCompleted from "./CompactCompleted";
import CompactHeader from "./CompactHeader";
import CompactTaskList from "./CompactTaskList";
import CompactUpcoming from "./CompactUpcoming";

const HEADER_HEIGHT = 32;
const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

export default function CompactView() {
  const queryClient = useQueryClient();
  // 카테고리 캐시 초기화 — compact 컴포넌트들이 getCategoryColor()를 동기적으로 사용
  const { categories } = useCategories();
  const [minimized, setMinimized] = useState(false);
  const [sortMode, setSortMode] = useState<TaskSortMode>("category");
  const [upcomingRange, setUpcomingRange] = useState<UpcomingRange>("1m");

  // Chat에서 태스크 변경 시 자동 새로고침
  useEffect(() => {
    const unsubscribe = window.electronAPI.onTasksChanged(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    });
    return unsubscribe;
  }, [queryClient]);

  const now = new Date();
  const todayStr = toDateStr(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toDateStr(tomorrow);

  const year = now.getFullYear();
  const month = now.getMonth();

  const { tasksByDate, toggleComplete, deleteTask, refreshing, refetch } = useTaskData(year, month);
  const { backlogTasks, toggleComplete: toggleBacklogComplete, deleteBacklog } = useBacklogData();
  const {
    tasksByDate: upcomingTasksByDate,
    toggleComplete: toggleUpcomingComplete,
    deleteTask: deleteUpcomingTask,
  } = useUpcomingTasks(upcomingRange);

  const incompleteBacklogTasks = useMemo(
    () => backlogTasks.filter((t) => !t.completed),
    [backlogTasks],
  );

  const todayTasks = useMemo(
    () => getTasksForDate(tasksByDate, todayStr).filter((t) => !t.completed),
    [tasksByDate, todayStr],
  );

  const upcomingGroups = useMemo(
    () => getUpcomingTasks(upcomingTasksByDate, false, "time"),
    [upcomingTasksByDate],
  );

  const categoryEntries = useMemo((): CategoryTaskEntry[] => {
    const getLabel = (dateStr: string): string => {
      if (dateStr === tomorrowStr) return "내일";
      const d = new Date(`${dateStr}T00:00:00`);
      return `${d.getMonth() + 1}/${d.getDate()}(${DAY_NAMES[d.getDay()]})`;
    };

    const entries: CategoryTaskEntry[] = [];

    for (const task of todayTasks) {
      entries.push({
        task,
        dateLabel: "오늘",
        onToggle: () => toggleComplete(todayStr, task.id),
        onDelete: () => deleteTask(todayStr, task.id),
      });
    }

    for (const [date, tasks] of Object.entries(upcomingTasksByDate).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      for (const task of tasks.filter((t) => !t.completed)) {
        entries.push({
          task,
          dateLabel: getLabel(date),
          onToggle: () => toggleUpcomingComplete(date, task.id),
          onDelete: () => deleteUpcomingTask(date, task.id),
        });
      }
    }

    for (const task of incompleteBacklogTasks) {
      entries.push({
        task,
        dateLabel: "날짜 미정",
        onToggle: () => toggleBacklogComplete(task.id),
        onDelete: () => deleteBacklog(task.id),
      });
    }

    return entries;
  }, [
    todayTasks,
    upcomingTasksByDate,
    incompleteBacklogTasks,
    toggleComplete,
    toggleUpcomingComplete,
    toggleBacklogComplete,
    deleteTask,
    deleteUpcomingTask,
    deleteBacklog,
    todayStr,
    tomorrowStr,
  ]);

  const completedGroups = useMemo(() => {
    const grouped: Record<string, typeof backlogTasks> = {};

    for (const [date, tasks] of Object.entries(tasksByDate)) {
      const completed = tasks.filter((t) => t.completed);
      if (completed.length > 0) grouped[date] = [...(grouped[date] ?? []), ...completed];
    }

    for (const task of backlogTasks) {
      if (!task.completed) continue;
      const date = task.completedAt?.slice(0, 10) ?? todayStr;
      grouped[date] = [...(grouped[date] ?? []), task];
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, tasks]) => ({ date, tasks }));
  }, [tasksByDate, backlogTasks, todayStr]);

  const handleToggleCompleted = useCallback(
    (date: string, taskId: string) => {
      if (backlogTasks.some((t) => t.id === taskId)) {
        toggleBacklogComplete(taskId);
      } else {
        toggleComplete(date, taskId);
      }
    },
    [backlogTasks, toggleBacklogComplete, toggleComplete],
  );

  const handleToggleMinimize = useCallback(async () => {
    const next = !minimized;
    setMinimized(next);
    if (next) {
      window.electronAPI.resizeCompactView(HEADER_HEIGHT);
    } else {
      const savedHeight = await window.electronAPI.getCompactExpandedHeight();
      window.electronAPI.resizeCompactView(savedHeight);
    }
  }, [minimized]);

  const hasCompleted = completedGroups.length > 0;
  const hasBacklog = incompleteBacklogTasks.length > 0;
  const isEmpty =
    sortMode === "category"
      ? categories.length === 0 && categoryEntries.length === 0 && !hasCompleted
      : todayTasks.length === 0 && upcomingGroups.length === 0 && !hasBacklog && !hasCompleted;

  return (
    <div className="flex flex-col h-screen bg-transparent text-app-text-primary">
      <CompactHeader
        isMinimized={minimized}
        isRefreshing={refreshing}
        sortMode={sortMode}
        onToggleMinimize={handleToggleMinimize}
        onRefresh={refetch}
        onSortModeChange={setSortMode}
      />
      {!minimized &&
        (isEmpty ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-[11px] text-gray-500">예정된 일정 없음</p>
          </div>
        ) : sortMode === "category" ? (
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            <CompactCategoryAll entries={categoryEntries} />
            {hasCompleted && (
              <CompactCompleted groups={completedGroups} onToggleComplete={handleToggleCompleted} />
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {hasBacklog && (
              <CompactBacklog
                tasks={incompleteBacklogTasks}
                onToggleComplete={toggleBacklogComplete}
                onDelete={deleteBacklog}
              />
            )}
            <CompactTaskList
              tasks={todayTasks}
              date={todayStr}
              onToggleComplete={toggleComplete}
              onDelete={deleteTask}
            />
            {upcomingGroups.length > 0 && (
              <CompactUpcoming
                groups={upcomingGroups}
                range={upcomingRange}
                onRangeChange={setUpcomingRange}
                onToggleComplete={toggleUpcomingComplete}
                onDelete={deleteUpcomingTask}
              />
            )}
            {hasCompleted && (
              <CompactCompleted groups={completedGroups} onToggleComplete={handleToggleCompleted} />
            )}
          </div>
        ))}
    </div>
  );
}
