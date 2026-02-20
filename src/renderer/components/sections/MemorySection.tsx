/** 대시보드 Memory 관리 섹션 */
import type { Memory } from "@shared/types";
import { Brain, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAddMemory, useDeleteMemory, useMemories, useUpdateMemory } from "../../hooks/useMemory";

/** 개별 메모리 카드 */
function MemoryCard({
  memory,
  editing,
  onEdit,
  onCancelEdit,
}: {
  memory: Memory;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
}) {
  const [editContent, setEditContent] = useState(memory.content);
  const updateMemory = useUpdateMemory();
  const deleteMemory = useDeleteMemory();

  const handleSave = () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === memory.content) {
      onCancelEdit();
      return;
    }
    updateMemory.mutate({ id: memory.id, content: trimmed }, { onSuccess: onCancelEdit });
  };

  const handleDelete = () => {
    deleteMemory.mutate(memory.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") onCancelEdit();
  };

  return (
    <div className="glass-card-3d p-3 rounded-lg bg-prowl-card backdrop-blur-xl border border-white/[0.06] group">
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-200 resize-none focus:outline-none focus:border-accent/50"
            rows={2}
            // biome-ignore lint/a11y/noAutofocus: 편집 모드 진입 시 즉시 입력 가능해야 함
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-2 py-1 text-[10px] rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-2 py-1 text-[10px] rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-gray-200 flex-1 whitespace-pre-wrap">{memory.content}</p>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={onEdit}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** 메모리 추가 인라인 폼 */
function AddMemoryForm({ onClose }: { onClose: () => void }) {
  const [content, setContent] = useState("");
  const addMemory = useAddMemory();

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    addMemory.mutate(trimmed, {
      onSuccess: () => {
        setContent("");
        onClose();
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="glass-card-3d p-3 rounded-lg bg-prowl-card backdrop-blur-xl border border-accent/20">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="예: 항상 한국어로 대답해줘, 이모지 쓰지마..."
        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-accent/50"
        rows={2}
        // biome-ignore lint/a11y/noAutofocus: 추가 폼 열릴 때 즉시 입력 가능해야 함
        autoFocus
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-2 py-1 text-[10px] rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="px-2 py-1 text-[10px] rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors disabled:opacity-50"
        >
          추가
        </button>
      </div>
    </div>
  );
}

export default function MemorySection() {
  const { data: memories = [], isLoading } = useMemories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="skeleton h-4 w-32" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-3">
        {/* 추가 버튼 */}
        <div className="flex justify-end">
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              추가
            </button>
          )}
        </div>

        {/* 추가 form */}
        {adding && <AddMemoryForm onClose={() => setAdding(false)} />}

        {/* Memory list */}
        {memories.length === 0 && !adding ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Brain className="w-8 h-8 mb-3 opacity-50" />
            <p className="text-sm">No memories yet</p>
            <p className="text-[10px] mt-1">
              Chat에서 "앞으로 ~~ 해줘" 같은 지시를 하면 자동 저장돼요
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {memories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                editing={editingId === memory.id}
                onEdit={() => setEditingId(memory.id)}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
