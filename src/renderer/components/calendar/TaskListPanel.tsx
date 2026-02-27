/** 태스크 목록 패널: 선택 날짜 또는 어젠다 뷰 */
import type { Task, TasksByDate } from "@shared/types";
import { useMemo } from "react";
import { formatDateKr, isToday, toDateStr } from "../../utils/calendar";
import { getTasksForDate, getUpcomingTasks, sortTasks } from "../../utils/task-helpers";
import TaskItem from "./TaskItem";

/** 미완료·완료 태스크를 구분선과 함께 렌더링 */
function TaskGroupedList({
  tasks,
  dateStr,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
}: {
  tasks: Task[];
  dateStr: string;
  onToggleComplete: (date: string, taskId: string) => void;
  onUpdateTask: (date: string, task: Task) => void;
  onDeleteTask: (date: string, taskId: string) => void;
}) {
  const incomplete = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);
  return (
    <div className="space-y-1.5">
      {incomplete.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={() => onToggleComplete(dateStr, task.id)}
          onUpdate={(updated) => onUpdateTask(dateStr, updated)}
          onDelete={() => onDeleteTask(dateStr, task.id)}
        />
      ))}
      {incomplete.length > 0 && completed.length > 0 && (
        <div className="flex items-center gap-1.5 py-0.5">
          <div className="flex-1 h-px bg-prowl-border opacity-50" />
          <span className="text-[9px] text-gray-600">{completed.length}개 완료</span>
          <div className="flex-1 h-px bg-prowl-border opacity-50" />
        </div>
      )}
      {completed.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={() => onToggleComplete(dateStr, task.id)}
          onUpdate={(updated) => onUpdateTask(dateStr, updated)}
          onDelete={() => onDeleteTask(dateStr, task.id)}
        />
      ))}
    </div>
  );
}

interface TaskListPanelProps {
  selectedDate: Date | null;
  tasksByDate: TasksByDate;
  agendaTasksByDate: TasksByDate;
  backlogTasks: Task[];
  isShowingCompleted: boolean;
  filterCategory: string | null;
  onToggleComplete: (date: string, taskId: string) => void;
  onToggleBacklogComplete: (taskId: string) => void;
  onUpdateTask: (date: string, task: Task) => void;
  onDeleteTask: (date: string, taskId: string) => void;
}

export default function TaskListPanel({
  selectedDate,
  tasksByDate,
  agendaTasksByDate,
  backlogTasks,
  isShowingCompleted,
  filterCategory,
  onToggleComplete,
  onToggleBacklogComplete,
  onUpdateTask,
  onDeleteTask,
}: TaskListPanelProps) {
  const applyFilters = (tasks: Task[]): Task[] => {
    let filtered = tasks;
    if (!isShowingCompleted) filtered = filtered.filter((t) => !t.completed);
    if (filterCategory)
      filtered = filtered.filter((t) => (t.category ?? "기타") === filterCategory);
    return sortTasks(filtered);
  };

  // 선택 날짜 뷰
  if (selectedDate) {
    const dateStr = toDateStr(selectedDate);
    const tasks = applyFilters(getTasksForDate(tasksByDate, dateStr));
    const isDateToday = isToday(selectedDate);

    return (
      <div className="flex-1 border-t border-prowl-border overflow-y-auto px-3 py-2">
        <div className="glass-card-3d rounded-lg bg-prowl-card border border-prowl-border p-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-gray-500">
              {formatDateKr(dateStr)}
              {isDateToday && <span className="ml-1.5 text-accent">오늘</span>}
            </span>
            <span className="text-[10px] text-gray-600">{tasks.length}건</span>
          </div>
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center py-4">
              <p className="text-[11px] text-gray-600">태스크 없음</p>
            </div>
          ) : (
            <TaskGroupedList
              tasks={tasks}
              dateStr={dateStr}
              onToggleComplete={onToggleComplete}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
            />
          )}
        </div>
      </div>
    );
  }

  // 어젠다 뷰: 달 기준이 아닌 전체 미래 데이터 사용
  return (
    <AgendaView
      tasksByDate={agendaTasksByDate}
      backlogTasks={backlogTasks}
      isShowingCompleted={isShowingCompleted}
      filterCategory={filterCategory}
      onToggleComplete={onToggleComplete}
      onToggleBacklogComplete={onToggleBacklogComplete}
      onUpdateTask={onUpdateTask}
      onDeleteTask={onDeleteTask}
    />
  );
}

/** 어젠다 뷰: 오늘 이후 태스크를 날짜별 그룹으로 표시 */
function AgendaView({
  tasksByDate,
  backlogTasks,
  isShowingCompleted,
  filterCategory,
  onToggleComplete,
  onToggleBacklogComplete,
  onUpdateTask,
  onDeleteTask,
}: Omit<TaskListPanelProps, "selectedDate">) {
  const groups = useMemo(() => {
    const upcoming = getUpcomingTasks(tasksByDate, isShowingCompleted);
    if (!filterCategory) return upcoming;
    return upcoming
      .map((g) => ({
        ...g,
        tasks: g.tasks.filter((t) => (t.category ?? "기타") === filterCategory),
      }))
      .filter((g) => g.tasks.length > 0);
  }, [tasksByDate, isShowingCompleted, filterCategory]);

  const filteredBacklog = useMemo(() => {
    let filtered = backlogTasks;
    if (!isShowingCompleted) filtered = filtered.filter((t) => !t.completed);
    if (filterCategory)
      filtered = filtered.filter((t) => (t.category ?? "기타") === filterCategory);
    return sortTasks(filtered);
  }, [backlogTasks, isShowingCompleted, filterCategory]);

  const isEmpty = groups.length === 0 && filteredBacklog.length === 0;

  if (isEmpty) {
    return (
      <div className="flex-1 border-t border-prowl-border overflow-y-auto">
        <div className="flex items-center justify-center py-6">
          <p className="text-[11px] text-gray-600">예정된 태스크 없음</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 border-t border-prowl-border overflow-y-auto px-3 py-2 space-y-2">
      {groups.map((group) => {
        const dateObj = new Date(`${group.date}T00:00:00`);
        return (
          <div
            key={group.date}
            className="glass-card-3d rounded-lg bg-prowl-card border border-prowl-border p-2"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-gray-500">
                {formatDateKr(group.date)}
                {isToday(dateObj) && <span className="ml-1.5 text-accent">오늘</span>}
              </span>
              <span className="text-[10px] text-gray-600">{group.tasks.length}건</span>
            </div>
            <TaskGroupedList
              tasks={group.tasks}
              dateStr={group.date}
              onToggleComplete={onToggleComplete}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
            />
          </div>
        );
      })}

      {filteredBacklog.length > 0 && (
        <div className="glass-card-3d rounded-lg bg-prowl-card border border-prowl-border p-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-gray-500">날짜 미정</span>
            <span className="text-[10px] text-gray-600">{filteredBacklog.length}건</span>
          </div>
          <div className="space-y-1.5">
            {filteredBacklog.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={() => onToggleBacklogComplete(task.id)}
                onUpdate={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
