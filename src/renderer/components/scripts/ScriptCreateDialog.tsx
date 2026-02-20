/** 자연어로 스크립트 생성하는 다이얼로그 */
import { Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ScriptCreateDialogProps {
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<void>;
}

const EXAMPLES = [
  "매일 오전 9시에 ~/Desktop/backup.sh 실행",
  "5분마다 메모리 사용량 ~/logs/mem.log에 기록",
  "매주 월요일 오전 8시에 ~/scripts/weekly-report.sh 실행",
];

export default function ScriptCreateDialog({ onClose, onSubmit }: ScriptCreateDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "스크립트 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md mx-4 bg-prowl-bg border border-prowl-border rounded-xl shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-prowl-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">새 스크립트 만들기</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-app-hover-bg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 입력 영역 */}
        <div className="p-4 space-y-3">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="어떤 스크립트를 만들까요? 자연어로 설명해주세요."
            rows={3}
            className="w-full bg-app-input-bg border border-app-input-border rounded-lg px-3 py-2 text-sm text-app-text-primary placeholder-app-text-muted outline-none focus:border-accent/40 resize-none"
          />

          {/* 예시 */}
          <div className="space-y-1">
            <p className="text-[11px] text-gray-500">예시</p>
            <div className="space-y-1">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setPrompt(ex);
                    textareaRef.current?.focus();
                  }}
                  className="block w-full text-left text-[11px] text-gray-500 hover:text-gray-300 hover:bg-app-hover-bg px-2 py-1 rounded transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-app-hover-bg rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!prompt.trim() || loading}
            className="px-3 py-1.5 text-xs bg-accent/20 text-accent hover:bg-accent/30 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                생성
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
