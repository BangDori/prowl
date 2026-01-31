import { Moon, RefreshCw, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import type { FocusMode } from "../../shared/types";

interface HeaderProps {
  onRefresh: () => void;
  onSettings: () => void;
  loading: boolean;
  focusMode: FocusMode;
  onToggleFocusMode: () => void;
}

function isInFocusTime(startTime: string, endTime: string): boolean {
  const now = new Date();
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const current = now.getHours() * 60 + now.getMinutes();
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;

  if (start > end) {
    return current >= start || current < end;
  }
  return current >= start && current < end;
}

export default function Header({
  onRefresh,
  onSettings,
  loading,
  focusMode,
  onToggleFocusMode,
}: HeaderProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!focusMode.enabled) {
      setActive(false);
      return;
    }

    const check = () => setActive(isInFocusTime(focusMode.startTime, focusMode.endTime));
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [focusMode]);

  const moonColor = !focusMode.enabled
    ? "text-gray-500 dark:text-gray-400"
    : active
      ? "text-indigo-400"
      : "text-yellow-500";

  const tooltip = !focusMode.enabled
    ? "집중 모드 꺼짐"
    : active
      ? "집중 모드 감지 중"
      : "집중 모드 대기 중";

  return (
    <header className="app-header">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Prowl</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="btn-icon text-gray-500 dark:text-gray-400 disabled:opacity-50"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`btn-icon ${moonColor}`}
            title={tooltip}
          >
            <Moon
              className={`w-4 h-4 ${
                focusMode.enabled && active ? "drop-shadow-[0_0_6px_rgba(129,140,248,0.7)]" : ""
              }`}
            />
          </button>
          <button
            type="button"
            onClick={onSettings}
            className="btn-icon text-gray-500 dark:text-gray-400"
            title="설정"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
