/** 백로그 태스크 섹션 (날짜 미정) */
import type { Task } from "@shared/types";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { useMemo, useState } from "react";
import { getCategoryColor, getCategoryNames } from "../../utils/category-utils";
import ConfirmDialog from "../ConfirmDialog";
import CompactTaskDetail from "./CompactTaskDetail";

function getCategoryOrder(name: string | undefined): number {
  const names = getCategoryNames();
  const idx = names.indexOf(name ?? "기타");
  return idx === -1 ? 99 : idx;
}

function sortBacklogTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const aCat = getCategoryOrder(a.category);
    const bCat = getCategoryOrder(b.category);
    if (aCat !== bCat) return aCat - bCat;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

interface CompactBacklogProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export default function CompactBacklog({ tasks, onToggleComplete, onDelete }: CompactBacklogProps) {
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(() => sortBacklogTasks(tasks), [tasks]);
  const incompleteCount = useMemo(() => tasks.filter((t) => !t.completed).length, [tasks]);

  if (tasks.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full px-0.5 py-1 text-left group"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3 text-app-text-ghost group-hover:text-app-text-faint transition-colors" />
        ) : (
          <ChevronRight className="w-3 h-3 text-app-text-ghost group-hover:text-app-text-faint transition-colors" />
        )}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-app-text-faint">
          날짜 미정
        </span>
        {incompleteCount > 0 && (
          <span className="text-[9px] text-app-text-ghost">{incompleteCount}건</span>
        )}
      </button>

      {expanded && (
        <div className="rounded-xl bg-prowl-card border border-prowl-border overflow-hidden mt-1">
          {sorted.map((task, idx) => (
            <BacklogTaskRow
              key={task.id}
              task={task}
              hasBorder={idx < sorted.length - 1}
              onToggle={() => onToggleComplete(task.id)}
              onDelete={() => onDelete(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BacklogTaskRow({
  task,
  hasBorder,
  onToggle,
  onDelete,
}: {
  task: Task;
  hasBorder: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const Chevron = expanded ? ChevronDown : ChevronRight;
  const isCompleted = task.completed;

  return (
    <div className={hasBorder ? "border-b border-prowl-border" : ""}>
      <div className="group flex items-center gap-2 px-2.5 py-[7px] hover:bg-prowl-surface transition-colors">
        <button type="button" onClick={onToggle} className="flex-shrink-0">
          {isCompleted ? (
            <span className="w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center bg-emerald-500/20 border-emerald-500/30 transition-colors">
              <svg
                className="w-2 h-2 text-emerald-400/60"
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
            </span>
          ) : (
            <span className="w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center border-app-input-border hover:border-prowl-border-hover transition-colors" />
          )}
        </button>

        <button
          type="button"
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <Chevron className="w-2.5 h-2.5 text-app-text-ghost flex-shrink-0" />
          <span
            className={`flex-1 text-[11px] leading-tight truncate text-left ${
              isCompleted ? "line-through text-app-text-ghost" : "text-app-text-secondary"
            }`}
          >
            {task.title}
          </span>
          {task.category && (
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCompleted ? "opacity-25" : ""}`}
              style={{ backgroundColor: getCategoryColor(task.category ?? "기타") }}
            />
          )}
        </button>
        {!isCompleted && (
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
