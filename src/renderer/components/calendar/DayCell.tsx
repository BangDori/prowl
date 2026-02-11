/** 캘린더 날짜 셀 컴포넌트 */
import type { CalendarEvent } from "@shared/types";
import { FEED_COLORS } from "@shared/types";
import { isMultiDay, isSameDay, isToday, MAX_EVENT_DOTS } from "../../utils/calendar";

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
  selected: boolean;
  feedColorMap: Record<string, string>;
  onClick: () => void;
}

export default function DayCell({
  date,
  isCurrentMonth,
  events,
  selected,
  feedColorMap,
  onClick,
}: DayCellProps) {
  const today = isToday(date);
  const dayOfWeek = date.getDay();

  // multi-day 이벤트 → 바, single-day → 점으로 분리
  const multiDay = events.filter(isMultiDay);
  const singleDay = events.filter((e) => !isMultiDay(e));

  // 바 세그먼트: 시작/끝/주 경계에서 라운딩
  const bars = multiDay.slice(0, 2).map((e) => {
    const isStart = isSameDay(new Date(e.dtstart), date);
    const isEnd = isSameDay(new Date(e.dtend), date);
    return {
      key: `bar-${e.uid}`,
      color: feedColorMap[e.feedId] ?? FEED_COLORS[0],
      roundLeft: isStart || dayOfWeek === 0,
      roundRight: isEnd || dayOfWeek === 6,
    };
  });

  // 남은 슬롯에 single-day 점 표시
  const remainingSlots = MAX_EVENT_DOTS - bars.length;
  const dotColors =
    remainingSlots > 0
      ? singleDay.map((e) => feedColorMap[e.feedId] ?? FEED_COLORS[0]).slice(0, remainingSlots)
      : [];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex flex-col items-center py-1 transition-colors min-h-[36px] overflow-hidden
        ${selected ? "bg-accent/20 ring-1 ring-accent/40 rounded-md" : "hover:bg-white/5 rounded-md"}
        ${!isCurrentMonth ? "opacity-30" : ""}
      `}
    >
      <span
        className={`
          text-[11px] leading-none w-5 h-5 flex items-center justify-center rounded-full
          ${today ? "bg-accent text-prowl-bg font-bold" : ""}
          ${selected && !today ? "text-accent font-medium" : ""}
          ${!selected && !today && isCurrentMonth ? "text-gray-300" : ""}
        `}
      >
        {date.getDate()}
      </span>
      {/* Multi-day 바 */}
      {bars.length > 0 && (
        <div className="w-full mt-0.5 space-y-px">
          {bars.map((bar) => (
            <div
              key={bar.key}
              className={`h-[3px] ${bar.roundLeft ? "ml-0.5 rounded-l-full" : ""} ${bar.roundRight ? "mr-0.5 rounded-r-full" : ""}`}
              style={{ backgroundColor: bar.color }}
            />
          ))}
        </div>
      )}
      {/* Single-day 점 */}
      {dotColors.length > 0 && (
        <div className="flex gap-0.5 mt-0.5">
          {dotColors.map((color, i) => (
            <div
              key={`dot-${date.getTime()}-${i}`}
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </button>
  );
}
