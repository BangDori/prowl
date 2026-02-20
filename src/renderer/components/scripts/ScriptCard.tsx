/** 개별 스크립트 카드 컴포넌트 */
import type { ProwlScript } from "@shared/types";
import { Clock, Play, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

interface ScriptCardProps {
  script: ProwlScript;
  onToggle: (id: string) => void;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
  isRunning?: boolean;
}

function formatLastRun(lastRun: ProwlScript["lastRun"]): string {
  if (!lastRun) return "실행 기록 없음";
  const date = new Date(lastRun.runAt);
  const label = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  return `${lastRun.success ? "✓" : "✗"} ${label}`;
}

export default function ScriptCard({
  script,
  onToggle,
  onRun,
  onDelete,
  isRunning,
}: ScriptCardProps) {
  const lastRunSuccess = script.lastRun?.success;

  return (
    <div
      className={`
        rounded-lg border p-3 transition-colors
        ${script.isEnabled ? "border-white/[0.08] bg-white/[0.03]" : "border-white/[0.04] bg-white/[0.01] opacity-60"}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        {/* 이름 + 스케줄 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 truncate">{script.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
            <span className="text-xs text-gray-500 truncate">{script.scheduleText}</span>
          </div>
          {script.lastRun && (
            <p
              className={`text-[11px] mt-1 ${
                lastRunSuccess === true
                  ? "text-green-500/70"
                  : lastRunSuccess === false
                    ? "text-red-400/70"
                    : "text-gray-500"
              }`}
            >
              {formatLastRun(script.lastRun)}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => onRun(script.id)}
            disabled={isRunning}
            title="지금 실행"
            className="p-1.5 rounded text-gray-500 hover:text-blue-400 hover:bg-white/5 disabled:opacity-40 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onToggle(script.id)}
            title={script.isEnabled ? "비활성화" : "활성화"}
            className="p-1.5 rounded text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors"
          >
            {script.isEnabled ? (
              <ToggleRight className="w-4 h-4 text-accent" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onDelete(script.id)}
            title="삭제"
            className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
