/** 카테고리별 전체 태스크 그룹 뷰 (날짜 구분 없이 카테고리로 묶음) */
import type { Task } from "@shared/types";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { getCategoryColor, getCategoryNames } from "../../utils/category-utils";
import CompactTaskDetail from "./CompactTaskDetail";

export interface CategoryTaskEntry {
  task: Task;
  dateLabel: string; // "오늘" | "내일" | "M/D(요일)" | "날짜 미정"
  onToggle: () => void;
  onDelete: () => void;
}

interface CategoryGroup {
  category: string;
  color: string;
  entries: CategoryTaskEntry[];
}

function buildGroups(entries: CategoryTaskEntry[]): CategoryGroup[] {
  const order = getCategoryNames();
  const map = new Map<string, CategoryTaskEntry[]>();
  for (const entry of entries) {
    const cat = entry.task.category ?? "기타";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(entry);
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([category, catEntries]) => ({
      category,
      color: getCategoryColor(category),
      entries: catEntries,
    }));
}

interface CompactCategoryAllProps {
  entries: CategoryTaskEntry[];
}

export default function CompactCategoryAll({ entries }: CompactCategoryAllProps) {
  const groups = buildGroups(entries);

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <p className="text-[10px] text-app-text-ghost">예정된 태스크 없음</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {groups.map((group) => (
        <div
          key={group.category}
          className="rounded-xl bg-prowl-card border border-prowl-border overflow-hidden"
        >
          <div className="flex items-center gap-1.5 px-2.5 pt-2 pb-1">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: group.color }}
            />
            <span className="text-[10px] font-medium text-app-text-muted flex-1">
              {group.category}
            </span>
            <span className="text-[9px] text-app-text-ghost">{group.entries.length}건</span>
          </div>
          {group.entries.map((entry, idx) => (
            <CategoryTaskRow
              key={entry.task.id}
              entry={entry}
              showBorder={idx < group.entries.length - 1}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function CategoryTaskRow({ entry, showBorder }: { entry: CategoryTaskEntry; showBorder: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const Chevron = expanded ? ChevronDown : ChevronRight;
  const { task, dateLabel, onToggle, onDelete } = entry;

  return (
    <div className={showBorder ? "border-b border-prowl-border" : ""}>
      <div className="group flex items-center gap-2 px-2.5 py-[7px] hover:bg-prowl-surface transition-colors">
        <button type="button" onClick={onToggle} className="flex-shrink-0">
          <span className="w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center border-app-input-border hover:border-prowl-border-hover transition-colors" />
        </button>
        <button
          type="button"
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <Chevron className="w-2.5 h-2.5 text-app-text-ghost flex-shrink-0" />
          <span className="flex-1 text-[11px] leading-tight truncate text-left text-app-text-primary">
            {task.title}
          </span>
          <span
            className={`text-[9px] flex-shrink-0 tabular-nums ${
              dateLabel === "오늘" ? "text-accent" : "text-app-text-ghost"
            }`}
          >
            {dateLabel}
          </span>
          {task.dueTime && (
            <span className="text-[9px] text-app-text-ghost flex-shrink-0 tabular-nums">
              {task.dueTime}
            </span>
          )}
        </button>
        {!task.completed && (
          <button
            type="button"
            onClick={onDelete}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded text-app-text-ghost hover:text-red-400 transition-all"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
      {expanded && <CompactTaskDetail task={task} />}
    </div>
  );
}
