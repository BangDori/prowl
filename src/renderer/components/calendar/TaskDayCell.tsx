/** 캘린더 날짜 셀 — 태스크 수와 우선순위 표시 */
import type { Task } from "@shared/types";
import { PRIORITY_COLORS } from "@shared/types";
import { Check } from "lucide-react";
import { isToday } from "../../utils/calendar";
import { highestPriority } from "../../utils/task-helpers";

interface TaskDayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  tasks: Task[];
  selected: boolean;
  onClick: () => void;
}

export default function TaskDayCell({
  date,
  isCurrentMonth,
  tasks,
  selected,
  onClick,
}: TaskDayCellProps) {
  const today = isToday(date);
  const incomplete = tasks.filter((t) => !t.completed);
  const allDone = tasks.length > 0 && incomplete.length === 0;
  const topPriority = highestPriority(tasks);
  const dotColor = topPriority ? PRIORITY_COLORS[topPriority] : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex flex-col items-center py-1 transition-colors min-h-[36px]
        ${selected ? "bg-accent/20 ring-1 ring-accent/40 rounded-md" : "hover:bg-white/5 rounded-md"}
        ${!isCurrentMonth ? "opacity-30" : ""}
      `}
    >
      <span
        className={`
          text-[11px] leading-none w-5 h-5 flex items-center justify-center rounded-full
          ${today ? "bg-accent text-gray-900 font-bold" : ""}
          ${selected && !today ? "text-accent font-medium" : ""}
          ${!selected && !today && isCurrentMonth ? "text-gray-300" : ""}
        `}
      >
        {date.getDate()}
      </span>
      {tasks.length > 0 && (
        <div className="flex items-center gap-0.5 mt-0.5">
          {allDone ? (
            <Check className="w-2.5 h-2.5 text-emerald-400" />
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
              {incomplete.length > 1 && (
                <span className="text-[8px] text-gray-500">{incomplete.length}</span>
              )}
            </>
          )}
        </div>
      )}
    </button>
  );
}
