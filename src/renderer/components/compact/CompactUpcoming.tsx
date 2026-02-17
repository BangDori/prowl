/** 다가오는 일정: 오늘 이후 태스크를 날짜별 그룹으로 표시 */
import type { Task, UpcomingRange } from "@shared/types";
import { PRIORITY_COLORS, UPCOMING_RANGE_LABELS } from "@shared/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { formatDateKr } from "../../utils/calendar";
import CompactTaskDetail from "./CompactTaskDetail";

interface UpcomingGroup {
  date: string;
  tasks: Task[];
}

interface CompactUpcomingProps {
  groups: UpcomingGroup[];
  range: UpcomingRange;
  onRangeChange: (range: UpcomingRange) => void;
  onToggleComplete: (date: string, taskId: string) => void;
}

export default function CompactUpcoming({
  groups,
  range,
  onRangeChange,
  onToggleComplete,
}: CompactUpcomingProps) {
  if (groups.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          다가오는 일정
        </span>
        <RangeSelector range={range} onRangeChange={onRangeChange} />
      </div>

      <div className="space-y-1.5">
        {groups.map((group) => (
          <div
            key={group.date}
            className="rounded-xl bg-prowl-card border border-prowl-border overflow-hidden"
          >
            <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
              <span className="text-[10px] font-medium text-white/50">
                {formatDateKr(group.date)}
              </span>
              <span className="text-[9px] text-white/25">{group.tasks.length}건</span>
            </div>

            {group.tasks.map((task, idx) => (
              <UpcomingTaskRow
                key={task.id}
                task={task}
                showBorder={idx < group.tasks.length - 1}
                onToggle={() => onToggleComplete(group.date, task.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function UpcomingTaskRow({
  task,
  showBorder,
  onToggle,
}: {
  task: Task;
  showBorder: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div className={showBorder ? "border-b border-prowl-border" : ""}>
      <div className="flex items-center gap-2 px-2.5 py-[7px] hover:bg-prowl-surface transition-colors">
        <button type="button" onClick={onToggle} className="flex-shrink-0">
          <span className="w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center border-white/15 hover:border-white/30 transition-colors">
            {task.completed && (
              <svg
                className="w-2 h-2 text-emerald-400"
                viewBox="0 0 12 12"
                fill="none"
                role="img"
                aria-label="완료"
              >
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </button>

        <button
          type="button"
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <Chevron className="w-2.5 h-2.5 text-white/20 flex-shrink-0" />
          <span className="flex-1 text-[11px] leading-tight truncate text-left text-white/70">
            {task.title}
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
          />
          {task.dueTime && (
            <span className="text-[9px] text-white/30 flex-shrink-0 tabular-nums">
              {task.dueTime}
            </span>
          )}
        </button>
      </div>

      {expanded && <CompactTaskDetail task={task} />}
    </div>
  );
}

const RANGES: UpcomingRange[] = ["1w", "2w", "1m", "1y"];

function RangeSelector({
  range,
  onRangeChange,
}: {
  range: UpcomingRange;
  onRangeChange: (range: UpcomingRange) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {RANGES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onRangeChange(r)}
          className={`px-1.5 py-0.5 rounded text-[9px] transition-colors ${
            range === r
              ? "bg-white/10 text-white/70"
              : "text-white/30 hover:text-white/50 hover:bg-white/[0.06]"
          }`}
        >
          {UPCOMING_RANGE_LABELS[r]}
        </button>
      ))}
    </div>
  );
}
