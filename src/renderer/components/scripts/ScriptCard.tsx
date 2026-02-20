/** 개별 스크립트 카드 컴포넌트 (JobCard 스타일 통일) */
import type { ProwlScript } from "@shared/types";
import { Loader2, Play, Trash2 } from "lucide-react";
import { formatRelativeTime } from "../../utils/date";
import StatusBadge from "../StatusBadge";
import ToggleSwitch from "../ToggleSwitch";

interface ScriptCardProps {
  script: ProwlScript;
  onToggle: (id: string) => void;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
  isRunning?: boolean;
  isToggling?: boolean;
}

export default function ScriptCard({
  script,
  onToggle,
  onRun,
  onDelete,
  isRunning,
  isToggling,
}: ScriptCardProps) {
  return (
    <div className="glass-card-3d rounded-lg bg-prowl-card border border-white/[0.06] px-4 py-3 group">
      <div className="flex items-center justify-between">
        {/* 왼쪽: 이름 + 스케줄 + 마지막 실행 */}
        <div className="min-w-0">
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {script.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-500">{script.scheduleText}</span>
            {script.lastRun && (
              <>
                <span className="text-xs text-gray-400 dark:text-gray-600">·</span>
                {isRunning ? (
                  <>
                    <span className="text-xs text-accent">실행 중...</span>
                    <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                  </>
                ) : (
                  <>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatRelativeTime(new Date(script.lastRun.runAt))}
                    </span>
                    <StatusBadge success={script.lastRun.success} />
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* 오른쪽: hover 액션 + 토글 */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              type="button"
              onClick={() => onRun(script.id)}
              disabled={isRunning}
              className="btn-icon text-gray-400 dark:text-gray-500 disabled:opacity-30"
              title="지금 실행"
            >
              {isRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onDelete(script.id)}
              className="btn-icon text-gray-400 dark:text-gray-500 hover:text-red-400"
              title="삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <ToggleSwitch
            enabled={script.isEnabled}
            loading={isToggling}
            onChange={() => onToggle(script.id)}
          />
        </div>
      </div>
    </div>
  );
}
