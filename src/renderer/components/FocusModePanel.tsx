import { ChevronLeft, Moon } from "lucide-react";
import type { FocusMode } from "../../shared/types";
import ToggleSwitch from "./ToggleSwitch";

interface FocusModePanelProps {
  focusMode: FocusMode;
  onUpdate: (updated: FocusMode) => void;
  onBack: () => void;
}

export default function FocusModePanel({ focusMode, onUpdate, onBack }: FocusModePanelProps) {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100">
      <header className="app-header">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="btn-icon text-gray-500 dark:text-gray-400"
            title="뒤로"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-semibold">집중 모드</h1>
        </div>
      </header>

      <main className="p-4">
        <div className="flex flex-col items-center py-6">
          <Moon
            className={`w-12 h-12 mb-4 ${
              focusMode.enabled
                ? "text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.6)]"
                : "text-gray-400 dark:text-gray-600"
            }`}
          />
          <ToggleSwitch
            enabled={focusMode.enabled}
            onChange={() => onUpdate({ ...focusMode, enabled: !focusMode.enabled })}
          />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mb-6">
          설정한 시간대에 작업이 실행되면 알림을 보냅니다.
        </p>

        <div className="flex items-center justify-center gap-2">
          <select
            value={focusMode.startTime}
            onChange={(e) => onUpdate({ ...focusMode, startTime: e.target.value })}
            className="input-field text-sm text-center"
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
          <span className="text-xs text-gray-500 dark:text-gray-500">~</span>
          <select
            value={focusMode.endTime}
            onChange={(e) => onUpdate({ ...focusMode, endTime: e.target.value })}
            className="input-field text-sm text-center"
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
      </main>
    </div>
  );
}
