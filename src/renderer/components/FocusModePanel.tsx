import type { FocusMode } from "@shared/types";
import { ChevronLeft, Clock, Power } from "lucide-react";
import ToggleSwitch from "./ToggleSwitch";

/**
 * FocusModePanel 컴포넌트의 Props
 */
interface FocusModePanelProps {
  /** 현재 야간 감시 모드 설정 */
  focusMode: FocusMode;
  /** 설정 변경 핸들러 */
  onUpdate: (updated: FocusMode) => void;
  /** 뒤로 가기 핸들러 (제공 시 헤더 표시) */
  onBack?: () => void;
}

/**
 * 야간 감시 모드 설정 패널 컴포넌트
 *
 * @description
 * 특정 시간대에 작업이 실행되면 알림을 보내는 "야간 감시" 기능의 설정 UI입니다.
 * 활성화 토글과 시작/종료 시간 선택을 제공합니다.
 *
 * @param props - {@link FocusModePanelProps}
 *
 * @example
 * ```tsx
 * <FocusModePanel
 *   focusMode={{ enabled: true, startTime: "22:00", endTime: "07:00" }}
 *   onUpdate={(updated) => setFocusMode(updated)}
 *   onBack={() => setView("main")}
 * />
 * ```
 */
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

      <div className="p-3 space-y-3">
        {/* 활성화 토글 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Power className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm">Enable Night Watch</p>
              <p className="text-[10px] text-gray-500">Monitor jobs during specific hours</p>
            </div>
          </div>
          <ToggleSwitch
            enabled={focusMode.enabled}
            onChange={() => onUpdate({ ...focusMode, enabled: !focusMode.enabled })}
          />
        </div>

        {/* 시간 설정 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm">Watch Hours</p>
              <p className="text-[10px] text-gray-500">Alert when jobs run in this window</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <select
              value={focusMode.startTime}
              onChange={(e) => onUpdate({ ...focusMode, startTime: e.target.value })}
              className="text-xs text-center py-1 px-2 rounded bg-gray-700 border border-prowl-border"
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
            <span className="text-xs text-gray-500">~</span>
            <select
              value={focusMode.endTime}
              onChange={(e) => onUpdate({ ...focusMode, endTime: e.target.value })}
              className="text-xs text-center py-1 px-2 rounded bg-gray-700 border border-prowl-border"
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
        </div>
      </div>
    </div>
  );
}
