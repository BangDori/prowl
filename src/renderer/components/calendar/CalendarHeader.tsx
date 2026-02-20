/** 캘린더 헤더: 월 네비게이션 및 새로고침 */
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface CalendarHeaderProps {
  monthLabel: string;
  refreshing: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onRefresh: () => void;
}

export default function CalendarHeader({
  monthLabel,
  refreshing,
  onPrevMonth,
  onNextMonth,
  onToday,
  onRefresh,
}: CalendarHeaderProps) {
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-0.5 rounded text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="text-[11px] font-medium text-gray-300 hover:text-accent transition-colors min-w-[100px] text-center"
        >
          {monthLabel}
        </button>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-0.5 rounded text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
        title="새로고침"
      >
        <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
