/** 일정 알림 시간 선택 컴포넌트 */
import type { TaskReminder } from "@shared/types";
import { REMINDER_PRESETS } from "@shared/types";
import { Bell, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ReminderPickerProps {
  reminders: TaskReminder[];
  onChange: (reminders: TaskReminder[]) => void;
}

export default function ReminderPicker({ reminders, onChange }: ReminderPickerProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleDropdown = () => {
    if (!showDropdown && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.top - 4, left: rect.left });
    }
    setShowDropdown(!showDropdown);
  };

  const addReminder = (minutes: number) => {
    if (reminders.some((r) => r.minutes === minutes)) return;
    onChange([...reminders, { minutes }].sort((a, b) => a.minutes - b.minutes));
    setShowDropdown(false);
  };

  const removeReminder = (minutes: number) => {
    onChange(reminders.filter((r) => r.minutes !== minutes));
  };

  const getLabel = (minutes: number): string => {
    const preset = REMINDER_PRESETS.find((p) => p.minutes === minutes);
    return preset?.label ?? `${minutes}분 전`;
  };

  return (
    <div ref={ref}>
      <div className="flex items-center gap-1 flex-wrap">
        <button
          ref={btnRef}
          type="button"
          onClick={toggleDropdown}
          className="flex items-center gap-0.5 text-[10px] text-gray-500 hover:text-accent transition-colors"
        >
          <Bell className="w-2.5 h-2.5" />
          {reminders.length === 0 ? "알림" : `알림 ${reminders.length}개`}
        </button>
        {reminders.map((r) => (
          <span
            key={r.minutes}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent/10 text-[9px] text-accent"
          >
            {getLabel(r.minutes)}
            <button
              type="button"
              onClick={() => removeReminder(r.minutes)}
              className="hover:text-red-400 transition-colors"
            >
              <X className="w-2 h-2" />
            </button>
          </span>
        ))}
      </div>
      {showDropdown && dropdownPos && (
        <div
          className="fixed z-[9999] p-1 rounded-lg border border-white/[0.08] bg-prowl-surface backdrop-blur-2xl shadow-xl min-w-[120px]"
          style={{ top: dropdownPos.top, left: dropdownPos.left, transform: "translateY(-100%)" }}
        >
          {REMINDER_PRESETS.map((preset) => {
            const isAdded = reminders.some((r) => r.minutes === preset.minutes);
            return (
              <button
                key={preset.minutes}
                type="button"
                disabled={isAdded}
                onClick={() => addReminder(preset.minutes)}
                className={`w-full text-left px-2 py-1 rounded text-[10px] transition-colors ${
                  isAdded
                    ? "text-gray-600 cursor-not-allowed"
                    : "text-gray-300 hover:bg-white/10 cursor-pointer"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
