/** Compact View 헤더: 드래그 영역 + 최소화/닫기 버튼 */
import { Minus, Plus, X } from "lucide-react";

const noDrag = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

interface CompactHeaderProps {
  minimized: boolean;
  onToggleMinimize: () => void;
}

export default function CompactHeader({ minimized, onToggleMinimize }: CompactHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-3 h-7 border-b border-white/[0.06]"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <span className="text-[10px] font-medium text-gray-400">Task Manager</span>

      <div className="flex items-center gap-0.5" style={noDrag}>
        <button
          type="button"
          onClick={onToggleMinimize}
          className="p-0.5 rounded text-gray-600 hover:text-gray-300 transition-colors"
        >
          {minimized ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        </button>
        <button
          type="button"
          onClick={() => window.electronAPI.toggleCompactView()}
          className="p-0.5 rounded text-gray-600 hover:text-gray-300 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
