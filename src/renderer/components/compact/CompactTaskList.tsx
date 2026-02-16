/** 오늘의 태스크 목록 (체크박스 토글 가능) */
import type { Task } from "@shared/types";
import { PRIORITY_COLORS } from "@shared/types";
import { Clock, Flag } from "lucide-react";
import { sortTasks, type TaskSortMode } from "../../utils/task-helpers";

interface CompactTaskListProps {
  tasks: Task[];
  date: string;
  sortMode: TaskSortMode;
  onSortModeChange: (mode: TaskSortMode) => void;
  onToggleComplete: (date: string, taskId: string) => void;
}

export default function CompactTaskList({
  tasks,
  date,
  sortMode,
  onSortModeChange,
  onToggleComplete,
}: CompactTaskListProps) {
  const sorted = sortTasks(tasks, sortMode);
  const incompleteCount = tasks.filter((t) => !t.completed).length;

  const toggleSort = () => onSortModeChange(sortMode === "priority" ? "time" : "priority");
  const SortIcon = sortMode === "priority" ? Flag : Clock;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
            오늘
          </span>
          <button
            type="button"
            onClick={toggleSort}
            className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
            title={sortMode === "priority" ? "우선순위순" : "시간순"}
          >
            <SortIcon className="w-2.5 h-2.5" />
            <span>{sortMode === "priority" ? "우선순위" : "시간"}</span>
          </button>
        </div>
        <span className="text-[9px] text-white/30">
          {incompleteCount > 0 ? `${incompleteCount}건 남음` : "모두 완료"}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="flex items-center justify-center py-4">
          <p className="text-[10px] text-white/25">오늘 태스크 없음</p>
        </div>
      ) : (
        <div className="rounded-xl bg-prowl-card border border-prowl-border overflow-hidden">
          {sorted.map((task, idx) => (
            <CompactTaskRow
              key={task.id}
              task={task}
              showBorder={idx < sorted.length - 1}
              onToggle={() => onToggleComplete(date, task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CompactTaskRow({
  task,
  showBorder,
  onToggle,
}: {
  task: Task;
  showBorder: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-[7px] hover:bg-prowl-surface transition-colors ${
        showBorder ? "border-b border-prowl-border" : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center transition-colors ${
          task.completed
            ? "bg-emerald-500/25 border-emerald-500/40"
            : "border-white/15 hover:border-white/30"
        }`}
      >
        {task.completed && (
          <svg
            className="w-2 h-2 text-emerald-400"
            viewBox="0 0 12 12"
            fill="none"
            role="img"
            aria-label="완료"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <span
        className={`flex-1 text-[11px] leading-tight truncate ${
          task.completed ? "line-through text-white/25" : "text-white/80"
        }`}
      >
        {task.title}
      </span>

      <div
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.completed ? "opacity-30" : ""}`}
        style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
      />

      {task.dueTime && (
        <span className="text-[9px] text-white/30 flex-shrink-0 tabular-nums">{task.dueTime}</span>
      )}
    </div>
  );
}
