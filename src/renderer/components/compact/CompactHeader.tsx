/** Task Manager 헤더: 드래그 영역 + 새로고침/최소화/닫기 버튼 */
import { Minus, Plus, RefreshCw, X } from "lucide-react";

const noDrag = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

interface CompactHeaderProps {
  minimized: boolean;
  refreshing: boolean;
  onToggleMinimize: () => void;
  onRefresh: () => void;
}

export default function CompactHeader({
  minimized,
  refreshing,
  onToggleMinimize,
  onRefresh,
}: CompactHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-3.5 h-8 border-b border-prowl-border"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <span className="text-[11px] font-semibold tracking-wide text-app-text-secondary">
        Task Manager
      </span>

      <div className="flex items-center gap-1" style={noDrag}>
        {!minimized && (
          <button
            type="button"
            onClick={onRefresh}
            className="p-1 rounded-md text-app-text-ghost hover:text-app-text-secondary hover:bg-app-hover-bg transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        )}
        <button
          type="button"
          onClick={onToggleMinimize}
          className="p-1 rounded-md text-app-text-ghost hover:text-app-text-secondary hover:bg-app-hover-bg transition-colors"
        >
          {minimized ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        </button>
        <button
          type="button"
          onClick={() => window.electronAPI.toggleCompactView()}
          className="p-1 rounded-md text-app-text-ghost hover:text-app-text-secondary hover:bg-app-hover-bg transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
