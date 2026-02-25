/** Task Manager 헤더: 드래그 영역 + 정렬 토글/새로고침/최소화/닫기 버튼 */
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import Minus from "lucide-react/dist/esm/icons/minus";
import Plus from "lucide-react/dist/esm/icons/plus";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Tag from "lucide-react/dist/esm/icons/tag";
import X from "lucide-react/dist/esm/icons/x";
import type { TaskSortMode } from "../../utils/task-helpers";

const noDrag = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

interface CompactHeaderProps {
  isMinimized: boolean;
  isRefreshing: boolean;
  sortMode: TaskSortMode;
  onToggleMinimize: () => void;
  onRefresh: () => void;
  onSortModeChange: (mode: TaskSortMode) => void;
}

export default function CompactHeader({
  isMinimized,
  isRefreshing,
  sortMode,
  onToggleMinimize,
  onRefresh,
  onSortModeChange,
}: CompactHeaderProps) {
  const SortIcon = sortMode === "time" ? CalendarClock : Tag;

  return (
    <div
      className="flex items-center justify-between px-3.5 h-8 border-b border-prowl-border"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <span className="text-[11px] font-semibold tracking-wide text-app-text-secondary">
        Task Manager
      </span>

      <div className="flex items-center gap-1" style={noDrag}>
        {!isMinimized && (
          <>
            <button
              type="button"
              onClick={() => onSortModeChange(sortMode === "category" ? "time" : "category")}
              className="p-1 rounded-md text-app-text-ghost hover:text-app-text-secondary hover:bg-app-hover-bg transition-colors"
              title={sortMode === "time" ? "카테고리별 보기" : "날짜별 보기"}
            >
              <SortIcon className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="p-1 rounded-md text-app-text-ghost hover:text-app-text-secondary hover:bg-app-hover-bg transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onToggleMinimize}
          className="p-1 rounded-md text-app-text-ghost hover:text-app-text-secondary hover:bg-app-hover-bg transition-colors"
        >
          {isMinimized ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
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
