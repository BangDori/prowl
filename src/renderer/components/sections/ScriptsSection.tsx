/** 내부 스크립트 라이브러리 섹션 */
import {
  useCreateScript,
  useDeleteScript,
  useRunScript,
  useScripts,
  useToggleScript,
} from "@renderer/hooks/useScripts";
import { FolderOpen, Plus, RefreshCw, Terminal } from "lucide-react";
import { useState } from "react";
import ScriptCard from "../scripts/ScriptCard";
import ScriptCreateDialog from "../scripts/ScriptCreateDialog";

export default function ScriptsSection() {
  const { data: scripts = [], isLoading, isFetching, refetch } = useScripts();
  const createScript = useCreateScript();
  const toggleScript = useToggleScript();
  const deleteScript = useDeleteScript();
  const runScript = useRunScript();

  const [showCreate, setShowCreate] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleOpenStoragePath = async () => {
    const path = await window.electronAPI.getScriptStoragePath();
    window.electronAPI.showInFolder(path);
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleScript.mutateAsync(id);
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async (prompt: string) => {
    const result = await createScript.mutateAsync(prompt);
    if (!result.success) throw new Error(result.error ?? "생성 실패");
  };

  const handleRun = async (id: string) => {
    setRunningId(id);
    try {
      await runScript.mutateAsync(id);
    } finally {
      setRunningId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="job-card">
            <div className="flex-1">
              <div className="skeleton h-4 w-32 mb-2" />
              <div className="skeleton h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2">
        <span className="text-xs text-gray-500">{scripts.length}개 스크립트</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-app-text-muted hover:text-app-text-primary hover:bg-app-hover-bg transition-colors disabled:opacity-40"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenStoragePath}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-app-text-muted hover:text-app-text-primary hover:bg-app-hover-bg transition-colors"
            title="파일 위치 열기"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            추가
          </button>
        </div>
      </div>

      {/* 스크립트 목록 */}
      {scripts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center text-gray-400">
          <Terminal className="w-12 h-12 text-gray-500 mb-2" />
          <p className="text-sm font-medium mb-1">등록된 스크립트가 없습니다</p>
          <p className="text-xs text-gray-500">+ 추가 버튼으로 자연어로 스크립트를 만들어보세요</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {scripts.map((script) => (
            <ScriptCard
              key={script.id}
              script={script}
              onToggle={handleToggle}
              onRun={handleRun}
              onDelete={(id) => deleteScript.mutate(id)}
              isRunning={runningId === script.id}
              isToggling={togglingId === script.id}
            />
          ))}
        </div>
      )}

      {/* 다이얼로그 */}
      {showCreate && (
        <ScriptCreateDialog onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}
