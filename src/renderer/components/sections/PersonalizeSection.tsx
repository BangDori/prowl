/** AI 퍼스널라이제이션 탭 — 메모리, 시스템 프롬프트, 톤 & 매너 통합 */
import { DEFAULT_SYSTEM_PROMPT } from "@shared/prompts";
import type { Memory } from "@shared/types";
import Brain from "lucide-react/dist/esm/icons/brain";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Plus from "lucide-react/dist/esm/icons/plus";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import Save from "lucide-react/dist/esm/icons/save";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { useEffect, useState } from "react";
import { useAddMemory, useDeleteMemory, useMemories, useUpdateMemory } from "../../hooks/useMemory";
import { useSettings, useUpdateSettings } from "../../hooks/useSettings";
import ConfirmDialog from "../ConfirmDialog";

// ─── Memory 서브컴포넌트 ──────────────────────────────────────────────────────

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
  const [confirmDelete, setConfirmDelete] = useState(false);
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") onCancelEdit();
  };

  return (
    <>
      <div className="border-b border-prowl-border last:border-b-0 py-2 group">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-app-input-bg border border-app-input-border rounded px-2 py-1.5 text-sm text-app-text-primary resize-none focus:outline-none focus:border-accent/50"
              rows={2}
              // biome-ignore lint/a11y/noAutofocus: 편집 모드 진입 시 즉시 입력 가능해야 함
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-2 py-1 text-[10px] rounded bg-app-active-bg text-app-text-secondary hover:bg-prowl-border transition-colors"
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
            <p className="text-sm text-app-text-primary flex-1 whitespace-pre-wrap">
              {memory.content}
            </p>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                type="button"
                onClick={onEdit}
                className="p-1 rounded hover:bg-app-active-bg text-app-text-muted hover:text-app-text-primary transition-colors"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title="메모리 삭제"
          message={`"${memory.content.slice(0, 40)}${memory.content.length > 40 ? "…" : ""}"를 삭제할까요?`}
          confirmLabel="삭제"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteMemory.mutate(memory.id);
            setConfirmDelete(false);
          }}
          isLoading={deleteMemory.isPending}
        />
      )}
    </>
  );
}

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
    <div className="border-b border-prowl-border pb-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="예: 항상 한국어로 대답해줘, 이모지 쓰지마..."
        className="w-full bg-app-input-bg border border-accent/30 rounded px-2 py-1.5 text-sm text-app-text-primary placeholder-app-text-ghost resize-none focus:outline-none focus:border-accent/50"
        rows={2}
        // biome-ignore lint/a11y/noAutofocus: 추가 폼 열릴 때 즉시 입력 가능해야 함
        autoFocus
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-2 py-1 text-[10px] rounded bg-app-active-bg text-app-text-secondary hover:bg-prowl-border transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors disabled:opacity-50"
        >
          <Save className="w-3 h-3" />
          추가
        </button>
      </div>
    </div>
  );
}

// ─── Prompt 서브컴포넌트 ──────────────────────────────────────────────────────

function PromptCard({
  label,
  description,
  value,
  placeholder,
  onChange,
  onSave,
  onReset,
  isSaving,
  isDirty,
}: {
  label: string;
  description: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onReset?: () => void;
  isSaving: boolean;
  isDirty: boolean;
}) {
  return (
    <div className="glass-card-3d rounded-lg bg-prowl-card backdrop-blur-xl border border-prowl-border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              disabled={isSaving}
              title="기본값으로 복원"
              className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-app-hover-bg text-app-text-muted hover:text-app-text-primary hover:bg-prowl-border transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              기본값으로
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || !isDirty}
            className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        className="w-full text-[11px] px-2 py-1.5 rounded bg-app-input-bg border border-app-input-border text-app-text-primary placeholder:text-app-text-ghost outline-none focus:border-accent/50 resize-y font-mono leading-relaxed"
      />
    </div>
  );
}

// ─── 메인 섹션 ────────────────────────────────────────────────────────────────

export default function PersonalizeSection() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { data: memories = [], isLoading: memoriesLoading } = useMemories();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [tone, setTone] = useState("");

  useEffect(() => {
    if (!settings) return;
    const { systemPromptOverride, toneCustom } = settings.aiPersonalization ?? {};
    setSystemPrompt(systemPromptOverride?.trim() ? systemPromptOverride : DEFAULT_SYSTEM_PROMPT);
    setTone(toneCustom ?? "");
  }, [settings]);

  const savedOverride = settings?.aiPersonalization?.systemPromptOverride ?? "";
  const savedTone = settings?.aiPersonalization?.toneCustom ?? "";
  const resolvedSaved = savedOverride.trim() ? savedOverride : DEFAULT_SYSTEM_PROMPT;

  const saveSystemPrompt = () => {
    if (!settings) return;
    const override =
      systemPrompt.trim() === DEFAULT_SYSTEM_PROMPT.trim() ? "" : systemPrompt.trim();
    updateSettings.mutate({
      ...settings,
      aiPersonalization: { ...settings.aiPersonalization, systemPromptOverride: override },
    });
  };
  const resetSystemPrompt = () => {
    if (!settings) return;
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    updateSettings.mutate({
      ...settings,
      aiPersonalization: { ...settings.aiPersonalization, systemPromptOverride: "" },
    });
  };
  const saveTone = () => {
    if (!settings) return;
    updateSettings.mutate({
      ...settings,
      aiPersonalization: { ...settings.aiPersonalization, toneCustom: tone.trim() },
    });
  };

  if (settingsLoading || memoriesLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="skeleton h-4 w-32" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Memory */}
        <div>
          <h3 className="text-xs font-medium text-app-text-muted uppercase tracking-wider mb-3">
            Memory
          </h3>
          <div className="glass-card-3d rounded-lg bg-prowl-card backdrop-blur-xl border border-prowl-border p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Memory</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  AI가 대화에서 기억할 선호도와 지시사항. Chat에서 "앞으로 ~~ 해줘"처럼 말하면 자동
                  저장됩니다.
                </p>
              </div>
              {!adding && (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  추가
                </button>
              )}
            </div>
            {adding && <AddMemoryForm onClose={() => setAdding(false)} />}
            {memories.length === 0 && !adding ? (
              <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                <Brain className="w-6 h-6 mb-2 opacity-40" />
                <p className="text-[11px]">No memories yet</p>
              </div>
            ) : (
              <div>
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

        {/* System Prompt */}
        <div>
          <h3 className="text-xs font-medium text-app-text-muted uppercase tracking-wider mb-3">
            System Prompt
          </h3>
          <PromptCard
            label="System Prompt"
            description="AI의 기본 역할과 행동 방식을 정의합니다. 날짜·시간, 메모리, 페이지 컨텍스트는 항상 자동으로 추가됩니다."
            value={systemPrompt}
            onChange={setSystemPrompt}
            onSave={saveSystemPrompt}
            onReset={resetSystemPrompt}
            isSaving={updateSettings.isPending}
            isDirty={systemPrompt !== resolvedSaved}
          />
        </div>

        {/* Tone & Manner */}
        <div>
          <h3 className="text-xs font-medium text-app-text-muted uppercase tracking-wider mb-3">
            Tone & Manner
          </h3>
          <PromptCard
            label="Tone & Manner"
            description="AI의 말투와 응답 스타일을 추가로 지정합니다. 시스템 프롬프트 끝에 자동으로 덧붙여집니다."
            value={tone}
            placeholder="예: 항상 친근하고 간결하게 답변해. 이모지를 자주 사용해."
            onChange={setTone}
            onSave={saveTone}
            isSaving={updateSettings.isPending}
            isDirty={tone !== savedTone}
          />
        </div>
      </div>
    </div>
  );
}
