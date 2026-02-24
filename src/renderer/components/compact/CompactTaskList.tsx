/** 오늘의 태스크 목록 (시간순 정렬, 체크박스 토글 가능) */
import type { Task } from "@shared/types";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { getCategoryColor } from "../../utils/category-utils";
import { sortTasks } from "../../utils/task-helpers";
import ConfirmDialog from "../ConfirmDialog";
import CompactTaskDetail from "./CompactTaskDetail";

interface CompactTaskListProps {
  tasks: Task[];
  date: string;
  onToggleComplete: (date: string, taskId: string) => void;
  onDelete: (date: string, taskId: string) => void;
}

export default function CompactTaskList({
  tasks,
  date,
  onToggleComplete,
  onDelete,
}: CompactTaskListProps) {
  const sorted = sortTasks(tasks, "time");
  const incompleteCount = tasks.filter((t) => !t.completed).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">오늘</span>
        <span className="text-[9px] text-app-text-ghost">
          {incompleteCount > 0 ? `${incompleteCount}건 남음` : "모두 완료"}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="flex items-center justify-center py-4">
          <p className="text-[10px] text-app-text-ghost">오늘 태스크 없음</p>
        </div>
      ) : (
        <div className="rounded-xl bg-prowl-card border border-prowl-border overflow-hidden">
          {sorted.map((task, idx) => (
            <CompactTaskRow
              key={task.id}
              task={task}
              showBorder={idx < sorted.length - 1}
              onToggle={() => onToggleComplete(date, task.id)}
              onDelete={() => onDelete(date, task.id)}
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
  onDelete,
}: {
  task: Task;
  showBorder: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div className={showBorder ? "border-b border-prowl-border" : ""}>
      <div className="group flex items-center gap-2 px-2.5 py-[7px] hover:bg-prowl-surface transition-colors">
        <button type="button" onClick={onToggle} className="flex-shrink-0">
          <span
            className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center transition-colors ${
              task.completed
                ? "bg-emerald-500/25 border-emerald-500/40"
                : "border-app-input-border hover:border-prowl-border-hover"
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
          </span>
        </button>

        <button
          type="button"
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <Chevron className="w-2.5 h-2.5 text-app-text-ghost flex-shrink-0" />
          <span
            className={`flex-1 text-[11px] leading-tight truncate text-left ${
              task.completed ? "line-through text-app-text-ghost" : "text-app-text-primary"
            }`}
          >
            {task.title}
          </span>
          {task.category && (
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.completed ? "opacity-30" : ""}`}
              style={{ backgroundColor: getCategoryColor(task.category ?? "기타") }}
            />
          )}
          {task.dueTime && (
            <span className="text-[9px] text-app-text-ghost flex-shrink-0 tabular-nums">
              {task.dueTime}
            </span>
          )}
        </button>
        {!task.completed && (
          <button
            type="button"
            onClick={() => setConfirmPending(true)}
            className="hidden group-hover:flex flex-shrink-0 items-center p-0.5 rounded text-app-text-ghost hover:text-red-400"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {expanded && <CompactTaskDetail task={task} />}
      {confirmPending && (
        <ConfirmDialog
          title="태스크 삭제"
          message={`"${task.title}" 태스크를 삭제할까요?`}
          onCancel={() => setConfirmPending(false)}
          onConfirm={() => {
            onDelete();
            setConfirmPending(false);
          }}
        />
      )}
    </div>
  );
}
