/** 태스크 필터 바: 우선순위, 완료 상태 */
import type { TaskPriority } from "@shared/types";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@shared/types";
import { Eye, EyeOff } from "lucide-react";

interface TaskFilterBarProps {
  filterPriority: TaskPriority | null;
  showCompleted: boolean;
  onFilterPriority: (priority: TaskPriority | null) => void;
  onToggleShowCompleted: () => void;
}

export default function TaskFilterBar({
  filterPriority,
  showCompleted,
  onFilterPriority,
  onToggleShowCompleted,
}: TaskFilterBarProps) {
  return (
    <div className="flex-shrink-0 flex items-center gap-1 px-3 py-1">
      {/* 우선순위 필터 */}
      <button
        type="button"
        onClick={() => onFilterPriority(null)}
        className={`px-1.5 py-0.5 rounded text-[9px] transition-colors ${
          filterPriority === null
            ? "bg-white/10 text-gray-200"
            : "text-gray-500 hover:text-gray-300"
        }`}
      >
        전체
      </button>
      {(["high", "medium", "low"] as const).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onFilterPriority(filterPriority === p ? null : p)}
          className={`px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5 transition-colors ${
            filterPriority === p ? "bg-white/10 text-gray-200" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: PRIORITY_COLORS[p] }}
          />
          {PRIORITY_LABELS[p]}
        </button>
      ))}
      <div className="flex-1" />
      {/* 완료 표시 토글 */}
      <button
        type="button"
        onClick={onToggleShowCompleted}
        className="p-0.5 rounded text-gray-500 hover:text-gray-300 transition-colors"
        title={showCompleted ? "완료 숨기기" : "완료 표시"}
      >
        {showCompleted ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      </button>
    </div>
  );
}
