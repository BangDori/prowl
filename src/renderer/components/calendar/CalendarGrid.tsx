/** 7×6 캘린더 그리드 — TaskDayCell 렌더링 */
import type { Task, TasksByDate } from "@shared/types";
import { isSameDay, toDateStr, WEEKDAYS } from "../../utils/calendar";
import TaskDayCell from "./TaskDayCell";

interface CalendarGridProps {
  calendarDays: Date[];
  viewMonth: number;
  selectedDate: Date | null;
  tasksByDate: TasksByDate;
  onDayClick: (day: Date) => void;
}

export default function CalendarGrid({
  calendarDays,
  viewMonth,
  selectedDate,
  tasksByDate,
  onDayClick,
}: CalendarGridProps) {
  return (
    <div className="flex-shrink-0 px-3 pt-2 pb-1">
      <div className="glass-card-3d rounded-lg bg-white/[0.03] border border-white/[0.06] p-2">
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className={`text-center text-[10px] font-medium py-1 ${
                day === "일"
                  ? "text-red-400/70"
                  : day === "토"
                    ? "text-blue-400/70"
                    : "text-gray-500"
              }`}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {calendarDays.map((day) => {
            const dateStr = toDateStr(day);
            const tasks: Task[] = tasksByDate[dateStr] ?? [];
            return (
              <TaskDayCell
                key={day.getTime()}
                date={day}
                isCurrentMonth={day.getMonth() === viewMonth}
                tasks={tasks}
                selected={selectedDate !== null && isSameDay(day, selectedDate)}
                onClick={() => onDayClick(day)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
