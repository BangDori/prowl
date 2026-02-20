/** 태스크 펼침 상세 패널 */
import type { Task } from "@shared/types";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@shared/types";
import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";

interface CompactTaskDetailProps {
  task: Task;
}

export default function CompactTaskDetail({ task }: CompactTaskDetailProps) {
  const hasMeta = task.dueTime || task.category;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = `제목: ${task.title}\n내용: ${task.description ?? ""}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [task.title, task.description]);

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
              <span className="text-[9px] text-app-text-ghost">·</span>
              <span className="text-[9px] text-app-text-faint tabular-nums">{task.dueTime}</span>
            </>
          )}
          {task.category && (
            <>
              <span className="text-[9px] text-app-text-ghost">·</span>
              <span className="text-[9px] text-app-text-faint">#{task.category}</span>
            </>
          )}
        </div>
      )}
      {task.description && (
        <p className="text-[10px] leading-relaxed text-app-text-faint mt-1 whitespace-pre-wrap break-words">
          {task.description}
        </p>
      )}
      {!hasMeta && !task.description && (
        <p className="text-[9px] text-app-text-ghost">상세 정보 없음</p>
      )}

      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded text-[9px] text-app-text-ghost hover:text-app-text-muted hover:bg-app-hover-bg transition-colors"
        title="태스크 복사"
      >
        {copied ? (
          <>
            <Check className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-emerald-400">복사됨</span>
          </>
        ) : (
          <>
            <Copy className="w-2.5 h-2.5" />
            <span>복사</span>
          </>
        )}
      </button>
    </div>
  );
}
