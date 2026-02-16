/** 오늘의 태스크 목록 (체크박스 토글 가능) */
import type { Task } from "@shared/types";
import { PRIORITY_COLORS } from "@shared/types";
import { sortTasks } from "../../utils/task-helpers";

interface CompactTaskListProps {
  tasks: Task[];
  date: string;
  onToggleComplete: (date: string, taskId: string) => void;
}

export default function CompactTaskList({ tasks, date, onToggleComplete }: CompactTaskListProps) {
  const sorted = sortTasks(tasks);
  const incompleteCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="px-2.5 pt-2 pb-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-accent">오늘</span>
        <span className="text-[9px] text-gray-500">
          {incompleteCount > 0 ? `${incompleteCount}건 남음` : "모두 완료"}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="flex items-center justify-center py-3">
          <p className="text-[10px] text-gray-600">오늘 태스크 없음</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {sorted.map((task) => (
            <CompactTaskRow
              key={task.id}
              task={task}
              onToggle={() => onToggleComplete(date, task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CompactTaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
      <button
        type="button"
        onClick={onToggle}
        className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
          task.completed
            ? "bg-emerald-500/30 border-emerald-500/50"
            : "border-gray-600 hover:border-gray-400"
        }`}
      >
        {task.completed && (
          <svg
            className="w-1.5 h-1.5 text-emerald-400"
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
        className={`flex-1 text-[10px] leading-tight truncate ${
          task.completed ? "line-through text-gray-600" : "text-gray-200"
        }`}
      >
        {task.title}
      </span>

      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
      />

      {task.dueTime && (
        <span className="text-[8px] text-gray-500 flex-shrink-0">{task.dueTime}</span>
      )}
    </div>
  );
}
