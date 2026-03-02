/** AI 퍼스널라이제이션 설정 탭 — 시스템 프롬프트 및 톤 & 매너 편집 */
import { DEFAULT_SYSTEM_PROMPT } from "@shared/prompts";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import Save from "lucide-react/dist/esm/icons/save";
import { useEffect, useState } from "react";
import { useSettings, useUpdateSettings } from "../../hooks/useSettings";

/** 저장 버튼이 있는 textarea 카드 */
interface PromptCardProps {
  label: string;
  description: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onReset?: () => void;
  isSaving: boolean;
  isDirty: boolean;
}

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
}: PromptCardProps) {
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

export default function AiSection() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [tone, setTone] = useState("");

  // 초기값: 저장된 커스텀 프롬프트가 있으면 사용, 없으면 기본값 표시
  useEffect(() => {
    if (!settings) return;
    const { systemPromptOverride, toneCustom } = settings.aiPersonalization ?? {};
    setSystemPrompt(systemPromptOverride?.trim() ? systemPromptOverride : DEFAULT_SYSTEM_PROMPT);
    setTone(toneCustom ?? "");
  }, [settings]);

  const savedSystemPrompt = settings?.aiPersonalization?.systemPromptOverride ?? "";
  const savedTone = settings?.aiPersonalization?.toneCustom ?? "";

  // 현재 표시값과 저장값 비교로 dirty 여부 판단
  const resolvedSavedPrompt = savedSystemPrompt.trim() ? savedSystemPrompt : DEFAULT_SYSTEM_PROMPT;
  const isSystemPromptDirty = systemPrompt !== resolvedSavedPrompt;
  const isToneDirty = tone !== savedTone;

  const saveSystemPrompt = () => {
    if (!settings) return;
    // 기본값과 동일하면 "" 저장 (기본 경로로 복귀)
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

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="skeleton h-4 w-32" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* 시스템 프롬프트 */}
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
            isDirty={isSystemPromptDirty}
          />
        </div>

        {/* 톤 & 매너 */}
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
            isDirty={isToneDirty}
          />
        </div>
      </div>
    </div>
  );
}
