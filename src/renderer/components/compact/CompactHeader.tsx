/** Compact View 헤더: 드래그 영역 + 오늘 날짜 표시 */
import { X } from "lucide-react";
import { formatDateKr } from "../../utils/calendar";

export default function CompactHeader() {
  const today = new Date();

  return (
    <div
      className="flex items-center justify-between px-3 h-7 border-b border-white/[0.06]"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <span className="text-[10px] font-medium text-gray-400">{formatDateKr(today)}</span>
      <button
        type="button"
        onClick={() => window.electronAPI.toggleCompactView()}
        className="p-0.5 rounded text-gray-600 hover:text-gray-300 transition-colors"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
