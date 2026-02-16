/** Compact Sticky View: 오늘의 태스크와 다가오는 일정 미리보기 */
import { useCallback, useMemo, useState } from "react";
import { useBacklogData } from "../../hooks/useBacklogData";
import { useTaskData } from "../../hooks/useTaskData";
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
  const [minimized, setMinimized] = useState(false);
  const [sortMode, setSortMode] = useState<TaskSortMode>("time");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayStr = toDateStr(now);

  const { tasksByDate, toggleComplete, refreshing, refetch } = useTaskData(year, month);
  const { backlogTasks, toggleComplete: toggleBacklogComplete } = useBacklogData();

  const todayTasks = useMemo(
    () => getTasksForDate(tasksByDate, todayStr).filter((t) => !t.completed),
    [tasksByDate, todayStr],
  );

  const upcomingGroups = useMemo(() => {
    const all = getUpcomingTasks(tasksByDate, false, sortMode);
    return all.filter((g) => g.date > todayStr);
  }, [tasksByDate, todayStr, sortMode]);

  const completedGroups = useMemo(() => {
    return Object.entries(tasksByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, tasks]) => ({
        date,
        tasks: tasks.filter((t) => t.completed),
      }))
      .filter(({ tasks }) => tasks.length > 0);
  }, [tasksByDate]);

  const handleToggleMinimize = useCallback(() => {
    const next = !minimized;
    setMinimized(next);
    window.electronAPI.resizeCompactView(next ? HEADER_HEIGHT : FULL_HEIGHT);
  }, [minimized]);

  const hasCompleted = completedGroups.length > 0;
  const hasBacklog = backlogTasks.length > 0;
  const isEmpty =
    todayTasks.length === 0 && upcomingGroups.length === 0 && !hasBacklog && !hasCompleted;

  return (
    <div className="flex flex-col h-screen bg-transparent text-gray-100">
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
            <CompactTaskList
              tasks={todayTasks}
              date={todayStr}
              sortMode={sortMode}
              onSortModeChange={setSortMode}
              onToggleComplete={toggleComplete}
            />
            {upcomingGroups.length > 0 && (
              <CompactUpcoming groups={upcomingGroups} onToggleComplete={toggleComplete} />
            )}
            {hasBacklog && (
              <CompactBacklog tasks={backlogTasks} onToggleComplete={toggleBacklogComplete} />
            )}
            {hasCompleted && (
              <CompactCompleted groups={completedGroups} onToggleComplete={toggleComplete} />
            )}
          </div>
        ))}
    </div>
  );
}
