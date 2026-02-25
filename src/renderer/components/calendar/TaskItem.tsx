/** 단일 태스크 행: 체크박스, 제목, 카테고리, 리마인더, 인라인 편집 */
import type { Task, TaskReminder } from "@shared/types";
import { DEFAULT_REMINDERS } from "@shared/types";
import Bell from "lucide-react/dist/esm/icons/bell";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { useRef, useState } from "react";
import { useCategories } from "../../hooks/useCategories";
import { getCategoryColor } from "../../utils/category-utils";
import ConfirmDialog from "../ConfirmDialog";
import ReminderPicker from "./ReminderPicker";

interface TaskItemProps {
  task: Task;
  onToggleComplete: () => void;
  onUpdate: (task: Task) => void;
  onDelete: () => void;
}

export default function TaskItem({ task, onToggleComplete, onUpdate, onDelete }: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [category, setCategory] = useState<string>(task.category ?? "기타");
  const [reminders, setReminders] = useState<TaskReminder[]>(
    task.reminders && task.reminders.length > 0 ? task.reminders : DEFAULT_REMINDERS,
  );
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const newCategoryInputRef = useRef<HTMLInputElement>(null);

  const { categories, addCategory } = useCategories();

  const handleSave = () => {
    if (!title.trim()) return;
    onUpdate({
      ...task,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      reminders: reminders.length > 0 ? reminders : undefined,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setCategory(task.category ?? "기타");
    setReminders(task.reminders ?? []);
    setAddingCategory(false);
    setNewCategoryName("");
    setEditing(false);
  };

  const handleConfirmNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed) {
      addCategory(trimmed);
      setCategory(trimmed);
    }
    setAddingCategory(false);
    setNewCategoryName("");
  };

  const handleNewCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirmNewCategory();
    else if (e.key === "Escape") {
      setAddingCategory(false);
      setNewCategoryName("");
    }
  };

  const displayCategory = task.category ?? "기타";
  const categoryColor = getCategoryColor(displayCategory);

  if (editing) {
    return (
      <div className="glass-card-3d rounded-lg border border-prowl-border bg-prowl-card backdrop-blur-xl px-2.5 py-2 space-y-1.5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="w-full bg-transparent text-[11px] text-app-text-primary placeholder-app-text-ghost outline-none"
          // biome-ignore lint/a11y/noAutofocus: 편집 모드 진입 시 즉시 입력 가능해야 함
          autoFocus
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="설명 (선택)"
          rows={2}
          className="w-full bg-transparent text-[10px] text-app-text-secondary placeholder-app-text-ghost outline-none resize-none"
        />

        {/* 카테고리 선택 */}
        <div className="flex items-center gap-1 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setCategory(cat.name)}
              className={`px-1.5 py-0.5 rounded text-[9px] transition-colors flex items-center gap-0.5 ${
                category === cat.name
                  ? "ring-1 ring-prowl-border-hover text-app-text-primary"
                  : "text-app-text-muted hover:text-app-text-secondary"
              }`}
              style={category === cat.name ? { backgroundColor: `${cat.color}25` } : undefined}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
            </button>
          ))}
          {addingCategory ? (
            <input
              ref={newCategoryInputRef}
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={handleNewCategoryKeyDown}
              onBlur={handleConfirmNewCategory}
              placeholder="새 카테고리"
              className="w-20 px-1.5 py-0.5 rounded text-[9px] bg-app-input-bg border border-app-input-border text-app-text-primary placeholder-app-text-ghost outline-none"
              // biome-ignore lint/a11y/noAutofocus: 카테고리 추가 입력 시 즉시 포커스
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setAddingCategory(true);
                setNewCategoryName("");
              }}
              className="p-0.5 rounded text-app-text-ghost hover:text-app-text-muted hover:bg-app-hover-bg transition-colors"
              title="카테고리 추가"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        <ReminderPicker reminders={reminders} onChange={setReminders} />
        <div className="flex items-center gap-1">
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleCancel}
            className="text-[10px] text-app-text-muted hover:text-app-text-secondary transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors disabled:opacity-20"
          >
            저장
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="group flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-prowl-card border border-prowl-border hover:bg-app-hover-bg transition-colors">
        <button
          type="button"
          onClick={onToggleComplete}
          className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
            task.completed
              ? "bg-emerald-500/30 border-emerald-500/50"
              : "border-gray-600 hover:border-gray-400"
          }`}
        >
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
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] leading-tight ${
                task.completed ? "line-through text-app-text-ghost" : "text-app-text-primary"
              }`}
            >
              {task.title}
            </span>
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: categoryColor }}
              title={displayCategory}
            />
            {task.reminders && task.reminders.length > 0 && (
              <Bell className="w-2.5 h-2.5 text-amber-500/70 flex-shrink-0" />
            )}
            {task.dueTime && (
              <span className="text-[9px] text-gray-500 flex-shrink-0">{task.dueTime}</span>
            )}
          </div>
          {task.description && (
            <p
              className={`text-[10px] mt-0.5 truncate ${task.completed ? "text-app-text-ghost" : "text-app-text-muted"}`}
            >
              {task.description}
            </p>
          )}
          {task.category && (
            <span className="inline-block mt-0.5 px-1 py-px rounded text-[8px] bg-app-hover-bg text-app-text-muted">
              {task.category}
            </span>
          )}
        </div>
        {!task.completed && (
          <div className="hidden group-hover:flex flex-shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="p-0.5 rounded text-app-text-ghost hover:text-app-text-secondary transition-colors"
            >
              <Pencil className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmPending(true)}
              className="p-0.5 rounded text-app-text-ghost hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>
      {confirmPending && (
        <ConfirmDialog
          title="태스크 삭제"
          message={`"${task.title}" 태스크를 삭제할까요?`}
          onCancel={() => setConfirmPending(false)}
          onConfirm={() => {
            onDelete();
            setConfirmPending(false);
          }}
        />
      )}
    </>
  );
}
