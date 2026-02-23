/** ~/.prowl/ 파일 내용 뷰어/편집기 컴포넌트 */
import { Check, Pencil, RotateCcw, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useProwlFile, useWriteProwlFile } from "../../hooks/useProwlFiles";

interface FileEditorProps {
  filePath: string;
}

/** 파일 내용 편집기 */
export default function FileEditor({ filePath }: FileEditorProps) {
  const { data: content, isLoading, error } = useProwlFile(filePath);
  const writeMutation = useWriteProwlFile();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);

  // 파일이 바뀌면 편집 모드 해제
  // biome-ignore lint/correctness/useExhaustiveDependencies: setter는 안정적이므로 의존성 불필요
  useEffect(() => {
    setEditing(false);
    setDraft("");
    setSaved(false);
  }, [filePath]);

  // content 로드 후 draft 초기화
  useEffect(() => {
    if (content !== undefined) setDraft(content);
  }, [content]);

  const handleSave = () => {
    writeMutation.mutate(
      { relPath: filePath, content: draft },
      {
        onSuccess: (result) => {
          if (result.success) {
            setEditing(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }
        },
      },
    );
  };

  const handleCancel = () => {
    setDraft(content ?? "");
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") handleCancel();
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="skeleton h-4 w-32" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-xs text-red-400">{String(error)}</p>
      </div>
    );
  }

  const fileName = filePath.split("/").pop() ?? filePath;

  return (
    <div className="h-full flex flex-col">
      {/* 파일 헤더 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-prowl-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-app-text-primary truncate">{fileName}</span>
          <span className="text-[10px] text-app-text-ghost font-mono truncate hidden sm:block">
            {filePath}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {saved && (
            <span className="flex items-center gap-1 text-[10px] text-green-400">
              <Check className="w-3 h-3" />
              저장됨
            </span>
          )}
          {editing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1.5 rounded hover:bg-app-hover-bg text-app-text-muted hover:text-app-text-primary transition-colors"
                title="취소 (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDraft(content ?? "")}
                className="p-1.5 rounded hover:bg-app-hover-bg text-app-text-muted hover:text-app-text-primary transition-colors"
                title="원래대로"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={writeMutation.isPending}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-accent/20 text-accent hover:bg-accent/30 transition-colors disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
                저장
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] hover:bg-app-hover-bg text-app-text-muted hover:text-app-text-primary transition-colors"
            >
              <Pencil className="w-3 h-3" />
              편집
            </button>
          )}
        </div>
      </div>

      {/* 파일 내용 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none bg-transparent font-mono text-xs text-app-text-primary p-4 focus:outline-none leading-relaxed"
            spellCheck={false}
            // biome-ignore lint/a11y/noAutofocus: 편집 모드 진입 시 즉시 입력 가능해야 함
            autoFocus
          />
        ) : (
          <pre className="w-full h-full overflow-auto p-4 font-mono text-xs text-app-text-secondary leading-relaxed whitespace-pre-wrap break-words">
            {content || <span className="text-app-text-ghost italic">파일이 비어 있습니다</span>}
          </pre>
        )}
      </div>

      {editing && (
        <div className="px-4 py-1 border-t border-prowl-border shrink-0">
          <p className="text-[10px] text-app-text-ghost">⌘S 저장 · Esc 취소</p>
        </div>
      )}
    </div>
  );
}
