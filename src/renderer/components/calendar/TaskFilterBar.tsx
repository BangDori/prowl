/** 태스크 필터 바: 동적 카테고리 탭, 완료 상태 */
import { Eye, EyeOff, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { useCategories } from "../../hooks/useCategories";

interface TaskFilterBarProps {
  filterCategory: string | null;
  showCompleted: boolean;
  onFilterCategory: (category: string | null) => void;
  onToggleShowCompleted: () => void;
}

export default function TaskFilterBar({
  filterCategory,
  showCompleted,
  onFilterCategory,
  onToggleShowCompleted,
}: TaskFilterBarProps) {
  const { categories, addCategory, deleteCategory } = useCategories();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartAdd = () => {
    setAdding(true);
    setNewName("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleConfirmAdd = () => {
    if (newName.trim()) addCategory(newName.trim());
    setAdding(false);
    setNewName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirmAdd();
    else if (e.key === "Escape") {
      setAdding(false);
      setNewName("");
    }
  };

  const handleDelete = (name: string) => {
    if (filterCategory === name) onFilterCategory(null);
    deleteCategory(name);
  };

  return (
    <div className="flex-shrink-0 flex items-center gap-0.5 px-3 py-1 overflow-x-auto">
      {/* 전체 탭 */}
      <button
        type="button"
        onClick={() => onFilterCategory(null)}
        className={`px-1.5 py-0.5 rounded text-[9px] whitespace-nowrap transition-colors flex-shrink-0 ${
          filterCategory === null
            ? "bg-app-active-bg text-app-text-primary"
            : "text-app-text-muted hover:text-app-text-secondary"
        }`}
      >
        전체
      </button>

      {/* 동적 카테고리 탭 */}
      {categories.map((cat) => (
        <div key={cat.name} className="group flex items-center flex-shrink-0">
          <button
            type="button"
            onClick={() => onFilterCategory(filterCategory === cat.name ? null : cat.name)}
            className={`px-1.5 py-0.5 rounded-l text-[9px] whitespace-nowrap flex items-center gap-0.5 transition-colors ${
              filterCategory === cat.name
                ? "bg-app-active-bg text-app-text-primary"
                : "text-app-text-muted hover:text-app-text-secondary"
            }`}
          >
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            {cat.name}
          </button>
          {cat.name !== "기타" && (
            <button
              type="button"
              onClick={() => handleDelete(cat.name)}
              className="opacity-0 group-hover:opacity-100 px-0.5 py-0.5 rounded-r text-app-text-ghost hover:text-red-400 transition-all"
              title={`${cat.name} 삭제`}
            >
              <X className="w-2 h-2" />
            </button>
          )}
        </div>
      ))}

      {/* 카테고리 추가 */}
      {adding ? (
        <input
          ref={inputRef}
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleConfirmAdd}
          placeholder="새 카테고리"
          className="w-20 px-1.5 py-0.5 rounded text-[9px] bg-app-input-bg border border-app-input-border text-app-text-primary placeholder-app-text-ghost outline-none flex-shrink-0"
        />
      ) : (
        <button
          type="button"
          onClick={handleStartAdd}
          className="p-0.5 rounded text-app-text-ghost hover:text-app-text-muted hover:bg-app-hover-bg transition-colors flex-shrink-0"
          title="카테고리 추가"
        >
          <Plus className="w-3 h-3" />
        </button>
      )}

      <div className="flex-1 min-w-0" />

      {/* 완료 표시 토글 */}
      <button
        type="button"
        onClick={onToggleShowCompleted}
        className="p-0.5 rounded text-app-text-muted hover:text-app-text-secondary transition-colors flex-shrink-0"
        title={showCompleted ? "완료 숨기기" : "완료 표시"}
      >
        {showCompleted ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      </button>
    </div>
  );
}
