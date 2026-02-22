/** Compact Sticky View: 오늘의 태스크와 다가오는 일정 미리보기 */

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
import CompactCompleted from "./CompactCompleted";
import CompactHeader from "./CompactHeader";
import CompactTaskList from "./CompactTaskList";
import CompactUpcoming from "./CompactUpcoming";

const FULL_HEIGHT = 400;
const HEADER_HEIGHT = 32;

export default function CompactView() {
  const queryClient = useQueryClient();
  // 카테고리 캐시 초기화 — compact 컴포넌트들이 getCategoryColor()를 동기적으로 사용
  useCategories();
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
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayStr = toDateStr(now);

  const { tasksByDate, toggleComplete, refreshing, refetch } = useTaskData(year, month);
  const { backlogTasks, toggleComplete: toggleBacklogComplete } = useBacklogData();
  const { tasksByDate: upcomingTasksByDate, toggleComplete: toggleUpcomingComplete } =
    useUpcomingTasks(upcomingRange);

  const incompleteBacklogTasks = useMemo(
    () => backlogTasks.filter((t) => !t.completed),
    [backlogTasks],
  );

  const todayTasks = useMemo(
    () => getTasksForDate(tasksByDate, todayStr).filter((t) => !t.completed),
    [tasksByDate, todayStr],
  );

  const upcomingGroups = useMemo(
    () => getUpcomingTasks(upcomingTasksByDate, false, sortMode),
    [upcomingTasksByDate, sortMode],
  );

  const completedGroups = useMemo(() => {
    const grouped: Record<string, typeof backlogTasks> = {};

    // 날짜 있는 완료 작업
    for (const [date, tasks] of Object.entries(tasksByDate)) {
      const completed = tasks.filter((t) => t.completed);
      if (completed.length > 0) grouped[date] = [...(grouped[date] ?? []), ...completed];
    }

    // 백로그(날짜 미정) 완료 작업 — completedAt 날짜 기준
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

  const handleToggleMinimize = useCallback(() => {
    const next = !minimized;
    setMinimized(next);
    window.electronAPI.resizeCompactView(next ? HEADER_HEIGHT : FULL_HEIGHT);
  }, [minimized]);

  const hasCompleted = completedGroups.length > 0;
  const hasBacklog = incompleteBacklogTasks.length > 0;
  const isEmpty =
    todayTasks.length === 0 && upcomingGroups.length === 0 && !hasBacklog && !hasCompleted;

  return (
    <div className="flex flex-col h-screen bg-transparent text-app-text-primary">
      <CompactHeader
        minimized={minimized}
        refreshing={refreshing}
        onToggleMinimize={handleToggleMinimize}
        onRefresh={refetch}
      />
      {!minimized &&
        (isEmpty ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-[11px] text-gray-500">예정된 일정 없음</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {hasBacklog && (
              <CompactBacklog
                tasks={incompleteBacklogTasks}
                onToggleComplete={toggleBacklogComplete}
              />
            )}
            <CompactTaskList
              tasks={todayTasks}
              date={todayStr}
              sortMode={sortMode}
              onSortModeChange={setSortMode}
              onToggleComplete={toggleComplete}
            />
            {upcomingGroups.length > 0 && (
              <CompactUpcoming
                groups={upcomingGroups}
                range={upcomingRange}
                onRangeChange={setUpcomingRange}
                onToggleComplete={toggleUpcomingComplete}
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
