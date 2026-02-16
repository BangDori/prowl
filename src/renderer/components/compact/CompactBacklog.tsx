/** 백로그 태스크 섹션 (날짜 미정) */
import type { Task } from "@shared/types";
import { PRIORITY_COLORS } from "@shared/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import CompactTaskDetail from "./CompactTaskDetail";

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function sortBacklogTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pDiff = (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
    if (pDiff !== 0) return pDiff;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

interface CompactBacklogProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
}

export default function CompactBacklog({ tasks, onToggleComplete }: CompactBacklogProps) {
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
          <ChevronDown className="w-3 h-3 text-white/30 group-hover:text-white/50 transition-colors" />
        ) : (
          <ChevronRight className="w-3 h-3 text-white/30 group-hover:text-white/50 transition-colors" />
        )}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          날짜 미정
        </span>
        {incompleteCount > 0 && (
          <span className="text-[9px] text-white/25">{incompleteCount}건</span>
        )}
      </button>

      {expanded && (
        <div className="rounded-xl bg-prowl-card border border-prowl-border overflow-hidden mt-1">
          {sorted.map((task, idx) => (
            <BacklogTaskRow
              key={task.id}
              task={task}
              showBorder={idx < sorted.length - 1}
              onToggle={() => onToggleComplete(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BacklogTaskRow({
  task,
  showBorder,
  onToggle,
}: {
  task: Task;
  showBorder: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Chevron = expanded ? ChevronDown : ChevronRight;
  const isCompleted = task.completed;

  return (
    <div className={showBorder ? "border-b border-prowl-border" : ""}>
      <div className="flex items-center gap-2 px-2.5 py-[7px] hover:bg-prowl-surface transition-colors">
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
            <span className="w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center border-white/15 hover:border-white/30 transition-colors" />
          )}
        </button>

        <button
          type="button"
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <Chevron className="w-2.5 h-2.5 text-white/20 flex-shrink-0" />
          <span
            className={`flex-1 text-[11px] leading-tight truncate text-left ${
              isCompleted ? "line-through text-white/20" : "text-white/70"
            }`}
          >
            {task.title}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCompleted ? "opacity-25" : ""}`}
            style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
          />
        </button>
      </div>

      {expanded && <CompactTaskDetail task={task} />}
    </div>
  );
}
