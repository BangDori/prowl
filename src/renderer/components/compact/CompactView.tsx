/** Compact Sticky View: 오늘의 태스크와 다가오는 일정 미리보기 */
import { useMemo } from "react";
import { useTaskData } from "../../hooks/useTaskData";
import { toDateStr } from "../../utils/calendar";
import { getTasksForDate, getUpcomingTasks } from "../../utils/task-helpers";
import CompactHeader from "./CompactHeader";
import CompactTaskList from "./CompactTaskList";
import CompactUpcoming from "./CompactUpcoming";

export default function CompactView() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayStr = toDateStr(now);

  const { tasksByDate, toggleComplete } = useTaskData(year, month + 1);

  const todayTasks = useMemo(() => getTasksForDate(tasksByDate, todayStr), [tasksByDate, todayStr]);

  const upcomingGroups = useMemo(() => {
    const all = getUpcomingTasks(tasksByDate, false);
    return all.filter((g) => g.date > todayStr);
  }, [tasksByDate, todayStr]);

  return (
    <div className="flex flex-col h-screen bg-transparent text-gray-100">
      <CompactHeader />
      <div className="flex-1 overflow-y-auto">
        <CompactTaskList tasks={todayTasks} date={todayStr} onToggleComplete={toggleComplete} />
        <div className="border-t border-white/[0.04] mx-2.5" />
        <CompactUpcoming groups={upcomingGroups} onToggleComplete={toggleComplete} />
      </div>
    </div>
  );
}
