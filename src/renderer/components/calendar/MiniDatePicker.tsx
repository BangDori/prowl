/** 미니 달력 날짜 선택 컴포넌트 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCalendarDays, isSameDay, isToday, toDateStr, WEEKDAYS } from "../../utils/calendar";

interface MiniDatePickerProps {
  value: string;
  min?: string;
  onChange: (dateStr: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export default function MiniDatePicker({
  value,
  min,
  onChange,
  onClose,
  anchorRef,
}: MiniDatePickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const selected = new Date(`${value}T00:00:00`);
  const minDate = min ? new Date(`${min}T00:00:00`) : undefined;
  const [pickerYear, setPickerYear] = useState(selected.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(selected.getMonth());
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const days = useMemo(() => getCalendarDays(pickerYear, pickerMonth), [pickerYear, pickerMonth]);

  const monthLabel = new Date(pickerYear, pickerMonth).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  // 앵커 기준 위치 계산
  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.top - 4, left: rect.left });
    }
  }, [anchorRef]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const goPrev = () => {
    if (pickerMonth === 0) {
      setPickerYear(pickerYear - 1);
      setPickerMonth(11);
    } else {
      setPickerMonth(pickerMonth - 1);
    }
  };

  const goNext = () => {
    if (pickerMonth === 11) {
      setPickerYear(pickerYear + 1);
      setPickerMonth(0);
    } else {
      setPickerMonth(pickerMonth + 1);
    }
  };

  if (!pos) return null;

  return (
    <div
      ref={ref}
      className="fixed z-[9999] p-2 rounded-lg border border-prowl-border bg-prowl-surface shadow-xl"
      style={{ width: "210px", top: pos.top, left: pos.left, transform: "translateY(-100%)" }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-1">
        <button
          type="button"
          onClick={goPrev}
          className="p-0.5 rounded text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
        <span className="text-[10px] font-medium text-gray-300">{monthLabel}</span>
        <button
          type="button"
          onClick={goNext}
          className="p-0.5 rounded text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-0.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className={`text-center text-[9px] font-medium py-0.5 ${
              d === "일" ? "text-red-400/70" : d === "토" ? "text-blue-400/70" : "text-gray-600"
            }`}
          >
            {d}
          </div>
        ))}
      </div>
      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateStr = toDateStr(day);
          const isCurrentMonth = day.getMonth() === pickerMonth;
          const isSelected = dateStr === value;
          const isDisabled = minDate && day < minDate && !isSameDay(day, minDate);
          const today = isToday(day);

          return (
            <button
              key={day.getTime()}
              type="button"
              disabled={!!isDisabled}
              onClick={() => {
                onChange(dateStr);
                onClose();
              }}
              className={`
                text-[10px] w-full py-1 rounded transition-colors
                ${isDisabled ? "opacity-20 cursor-not-allowed" : "cursor-pointer hover:bg-white/10"}
                ${isSelected ? "bg-accent/25 text-accent font-medium" : ""}
                ${!isSelected && today ? "text-accent font-medium" : ""}
                ${!isSelected && !today && isCurrentMonth ? "text-gray-300" : ""}
                ${!isCurrentMonth && !isSelected ? "opacity-30" : ""}
              `}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
