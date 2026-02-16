/** 태스크 목록 패널: 선택 날짜 또는 어젠다 뷰 */
import type { Task, TaskPriority, TasksByDate } from "@shared/types";
import { useMemo } from "react";
import { formatDateKr, isToday, toDateStr } from "../../utils/calendar";
import { getTasksForDate, getUpcomingTasks, sortTasks } from "../../utils/task-helpers";
import TaskItem from "./TaskItem";

interface TaskListPanelProps {
  selectedDate: Date | null;
  tasksByDate: TasksByDate;
  showCompleted: boolean;
  filterPriority: TaskPriority | null;
  onToggleComplete: (date: string, taskId: string) => void;
  onUpdateTask: (date: string, task: Task) => void;
  onDeleteTask: (date: string, taskId: string) => void;
}

export default function TaskListPanel({
  selectedDate,
  tasksByDate,
  showCompleted,
  filterPriority,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
}: TaskListPanelProps) {
  const applyFilters = (tasks: Task[]): Task[] => {
    let filtered = tasks;
    if (!showCompleted) filtered = filtered.filter((t) => !t.completed);
    if (filterPriority) filtered = filtered.filter((t) => t.priority === filterPriority);
    return sortTasks(filtered);
  };

  // 선택 날짜 뷰
  if (selectedDate) {
    const dateStr = toDateStr(selectedDate);
    const tasks = applyFilters(getTasksForDate(tasksByDate, dateStr));
    const isDateToday = isToday(selectedDate);

    return (
      <div className="flex-1 border-t border-prowl-border overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-[10px] font-medium text-gray-500">
            {formatDateKr(dateStr)}
            {isDateToday && <span className="ml-1.5 text-accent">오늘</span>}
          </span>
          <span className="text-[10px] text-gray-600">{tasks.length}건</span>
        </div>
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <p className="text-[11px] text-gray-600">태스크 없음</p>
          </div>
        ) : (
          <div className="px-2 pb-3 space-y-2">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={() => onToggleComplete(dateStr, task.id)}
                onUpdate={(updated) => onUpdateTask(dateStr, updated)}
                onDelete={() => onDeleteTask(dateStr, task.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 어젠다 뷰
  return (
    <AgendaView
      tasksByDate={tasksByDate}
      showCompleted={showCompleted}
      filterPriority={filterPriority}
      onToggleComplete={onToggleComplete}
      onUpdateTask={onUpdateTask}
      onDeleteTask={onDeleteTask}
    />
  );
}

/** 어젠다 뷰: 오늘 이후 태스크를 날짜별 그룹으로 표시 */
function AgendaView({
  tasksByDate,
  showCompleted,
  filterPriority,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
}: Omit<TaskListPanelProps, "selectedDate">) {
  const groups = useMemo(() => {
    const upcoming = getUpcomingTasks(tasksByDate, showCompleted);
    if (!filterPriority) return upcoming;
    return upcoming
      .map((g) => ({ ...g, tasks: g.tasks.filter((t) => t.priority === filterPriority) }))
      .filter((g) => g.tasks.length > 0);
  }, [tasksByDate, showCompleted, filterPriority]);

  if (groups.length === 0) {
    return (
      <div className="flex-1 border-t border-prowl-border overflow-y-auto">
        <div className="flex items-center justify-center py-6">
          <p className="text-[11px] text-gray-600">예정된 태스크 없음</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 border-t border-prowl-border overflow-y-auto px-1 pb-3">
      {groups.map((group) => {
        const dateObj = new Date(`${group.date}T00:00:00`);
        return (
          <div key={group.date} className="mt-2 first:mt-1">
            <span className="text-[10px] font-medium text-gray-500 px-2">
              {formatDateKr(group.date)}
              {isToday(dateObj) && <span className="ml-1.5 text-accent">오늘</span>}
            </span>
            <div className="mt-1 space-y-2">
              {group.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={() => onToggleComplete(group.date, task.id)}
                  onUpdate={(updated) => onUpdateTask(group.date, updated)}
                  onDelete={() => onDeleteTask(group.date, task.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
