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
  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center py-3">
        <p className="text-[10px] text-gray-600">예정된 일정 없음</p>
      </div>
    );
  }

  return (
    <div className="px-2.5 pb-2 space-y-1.5">
      <span className="text-[10px] font-semibold text-gray-400">다가오는 일정</span>

      {groups.map((group) => (
        <div
          key={group.date}
          className="rounded-md bg-white/[0.03] border border-white/[0.04] p-1.5"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-medium text-gray-500">{formatDateKr(group.date)}</span>
            <span className="text-[8px] text-gray-600">{group.tasks.length}건</span>
          </div>

          <div className="space-y-0.5">
            {group.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-white/[0.04] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onToggleComplete(group.date, task.id)}
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
