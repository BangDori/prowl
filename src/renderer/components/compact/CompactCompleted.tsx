/** 완료된 태스크 토글 섹션 */

import type { Task } from "@shared/types";
import { PRIORITY_COLORS } from "@shared/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { formatDateKr } from "../../utils/calendar";

interface CompletedGroup {
  date: string;
  tasks: Task[];
}

interface CompactCompletedProps {
  groups: CompletedGroup[];
  onToggleComplete: (date: string, taskId: string) => void;
}

export default function CompactCompleted({ groups, onToggleComplete }: CompactCompletedProps) {
  const [expanded, setExpanded] = useState(false);

  const totalCount = groups.reduce((sum, g) => sum + g.tasks.length, 0);
  if (totalCount === 0) return null;

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
          완료됨
        </span>
        <span className="text-[9px] text-white/25">{totalCount}건</span>
      </button>

      {expanded && (
        <div className="space-y-1.5 mt-0.5">
          {groups.map((group) => (
            <div
              key={group.date}
              className="rounded-xl bg-prowl-card border border-prowl-border overflow-hidden"
            >
              <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
                <span className="text-[10px] font-medium text-white/40">
                  {formatDateKr(group.date)}
                </span>
                <span className="text-[9px] text-white/20">{group.tasks.length}건</span>
              </div>

              {group.tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 px-2.5 py-[7px] hover:bg-prowl-surface transition-colors ${
                    idx < group.tasks.length - 1 ? "border-b border-prowl-border" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleComplete(group.date, task.id)}
                    className="w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center bg-emerald-500/20 border-emerald-500/30 transition-colors"
                  >
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
                  </button>

                  <span className="flex-1 text-[11px] leading-tight truncate line-through text-white/20">
                    {task.title}
                  </span>

                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-25"
                    style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                  />

                  {task.dueTime && (
                    <span className="text-[9px] text-white/15 flex-shrink-0 tabular-nums">
                      {task.dueTime}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
