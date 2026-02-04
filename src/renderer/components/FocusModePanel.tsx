import { ChevronLeft } from "lucide-react";
import type { FocusMode } from "../../shared/types";
import ToggleSwitch from "./ToggleSwitch";

interface FocusModePanelProps {
  focusMode: FocusMode;
  onUpdate: (updated: FocusMode) => void;
  onBack?: () => void;
}

export default function FocusModePanel({ focusMode, onUpdate, onBack }: FocusModePanelProps) {
  return (
    <div>
      {onBack && (
        <header className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-prowl-border">
          <button
            type="button"
            onClick={onBack}
            className="btn-icon text-gray-500 dark:text-gray-400 p-0.5"
            title="뒤로"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xs font-semibold">야간 감시</h1>
        </header>
      )}

      <div className="py-0.5">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-xs text-gray-800 dark:text-gray-200">활성화</span>
          <ToggleSwitch
            enabled={focusMode.enabled}
            onChange={() => onUpdate({ ...focusMode, enabled: !focusMode.enabled })}
          />
        </div>

        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-xs text-gray-800 dark:text-gray-200">시작</span>
          <select
            value={focusMode.startTime}
            onChange={(e) => onUpdate({ ...focusMode, startTime: e.target.value })}
            className="text-xs text-center py-0.5 px-1.5 rounded bg-white dark:bg-prowl-card border border-gray-300 dark:border-prowl-border"
          >
            {Array.from({ length: 24 }, (_, h) => {
              const v = `${String(h).padStart(2, "0")}:00`;
              return (
                <option key={v} value={v}>
                  {v}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-xs text-gray-800 dark:text-gray-200">종료</span>
          <select
            value={focusMode.endTime}
            onChange={(e) => onUpdate({ ...focusMode, endTime: e.target.value })}
            className="text-xs text-center py-0.5 px-1.5 rounded bg-white dark:bg-prowl-card border border-gray-300 dark:border-prowl-border"
          >
            {Array.from({ length: 24 }, (_, h) => {
              const v = `${String(h).padStart(2, "0")}:00`;
              return (
                <option key={v} value={v}>
                  {v}
                </option>
              );
            })}
          </select>
        </div>

        <p className="px-3 py-1 text-[10px] text-gray-400 dark:text-gray-500">
          설정한 시간대에 작업이 실행되면 알림을 보냅니다.
        </p>
      </div>
    </div>
  );
}
