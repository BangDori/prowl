/** 캘린더 날짜 셀 — 태스크 카테고리 색상 표시 */
import type { Task } from "@shared/types";
import { Check } from "lucide-react";
import { isToday } from "../../utils/calendar";
import { getCategoryColor } from "../../utils/category-utils";

const MAX_DOTS = 5;

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

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex flex-col items-center py-1 transition-colors min-h-[36px]
        ${selected ? "bg-accent/20 ring-1 ring-accent/40 rounded-md" : "hover:bg-app-hover-bg rounded-md"}
        ${!isCurrentMonth ? "opacity-30" : ""}
      `}
    >
      <span
        className={`
          text-[11px] leading-none w-5 h-5 flex items-center justify-center rounded-full
          ${today ? "bg-accent text-white font-bold" : ""}
          ${selected && !today ? "text-accent font-medium" : ""}
          ${!selected && !today && isCurrentMonth ? "text-app-text-secondary" : ""}
        `}
      >
        {date.getDate()}
      </span>
      {tasks.length > 0 && (
        <div className="flex items-center gap-0.5 mt-0.5">
          {allDone ? (
            <Check className="w-2.5 h-2.5 text-emerald-400" />
          ) : (
            incomplete
              .slice(0, MAX_DOTS)
              .map((task) => (
                <div
                  key={task.id}
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(task.category ?? "기타") }}
                />
              ))
          )}
        </div>
      )}
    </button>
  );
}
