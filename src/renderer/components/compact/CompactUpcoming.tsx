/** 다가오는 일정: 오늘 이후 태스크를 날짜별 그룹으로 표시 */
import type { Task } from "@shared/types";
import { PRIORITY_COLORS } from "@shared/types";
import { formatDateKr } from "../../utils/calendar";

interface UpcomingGroup {
  date: string;
  tasks: Task[];
}

interface CompactUpcomingProps {
  groups: UpcomingGroup[];
  onToggleComplete: (date: string, taskId: string) => void;
}

export default function CompactUpcoming({ groups, onToggleComplete }: CompactUpcomingProps) {
  if (groups.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          다가오는 일정
        </span>
      </div>

      <div className="space-y-1.5">
        {groups.map((group) => (
          <div
            key={group.date}
            className="rounded-xl bg-prowl-card border border-prowl-border overflow-hidden"
          >
            <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
              <span className="text-[10px] font-medium text-white/50">
                {formatDateKr(group.date)}
              </span>
              <span className="text-[9px] text-white/25">{group.tasks.length}건</span>
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
                  className="w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center border-white/15 hover:border-white/30 transition-colors"
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

                <span className="flex-1 text-[11px] leading-tight truncate text-white/70">
                  {task.title}
                </span>

                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                />

                {task.dueTime && (
                  <span className="text-[9px] text-white/30 flex-shrink-0 tabular-nums">
                    {task.dueTime}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
