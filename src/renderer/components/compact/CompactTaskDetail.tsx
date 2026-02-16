/** 태스크 펼침 상세 패널 */
import type { Task } from "@shared/types";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@shared/types";

interface CompactTaskDetailProps {
  task: Task;
}

export default function CompactTaskDetail({ task }: CompactTaskDetailProps) {
  const hasMeta = task.dueTime || task.category;

  return (
    <div className="px-2.5 pb-2 pt-0.5 pl-8">
      {hasMeta && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[9px] font-medium"
            style={{ color: PRIORITY_COLORS[task.priority] }}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.dueTime && (
            <>
              <span className="text-[9px] text-white/20">·</span>
              <span className="text-[9px] text-white/40 tabular-nums">{task.dueTime}</span>
            </>
          )}
          {task.category && (
            <>
              <span className="text-[9px] text-white/20">·</span>
              <span className="text-[9px] text-white/40">#{task.category}</span>
            </>
          )}
        </div>
      )}
      {task.description && (
        <p className="text-[10px] leading-relaxed text-white/35 mt-1 whitespace-pre-wrap break-words">
          {task.description}
        </p>
      )}
      {!hasMeta && !task.description && <p className="text-[9px] text-white/20">상세 정보 없음</p>}
    </div>
  );
}
