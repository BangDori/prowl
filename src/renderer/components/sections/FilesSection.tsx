/** ~/.prowl/ 파일 탐색기 섹션 */
import { useQueryClient } from "@tanstack/react-query";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import { useState } from "react";
import { queryKeys } from "../../queries/keys";
import FileEditor from "../files/FileEditor";
import FileTree from "../files/FileTree";

export default function FilesSection() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.prowlFiles.all });
    setRefreshing(false);
  };

  return (
    <div className="h-full flex">
      {/* 좌측: 파일 트리 */}
      <aside className="w-48 shrink-0 border-r border-prowl-border flex flex-col overflow-hidden">
        <div className="px-3 py-2.5 border-b border-prowl-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-accent/70" />
              <span className="text-[11px] font-medium text-app-text-secondary">~/.prowl</span>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1 rounded hover:bg-app-hover-bg text-app-text-ghost hover:text-app-text-muted transition-colors disabled:opacity-40"
              title="전체 새로고침"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <FileTree
            selectedPath={selectedFile}
            onSelectFile={setSelectedFile}
            onDeleted={(path) => {
              if (selectedFile === path) setSelectedFile(null);
            }}
          />
        </div>
      </aside>

      {/* 우측: 파일 에디터 */}
      <main className="flex-1 min-w-0">
        {selectedFile ? (
          <FileEditor filePath={selectedFile} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-3">
            <FolderOpen className="w-10 h-10 text-app-text-ghost opacity-40" />
            <div>
              <p className="text-sm text-app-text-secondary">파일을 선택하세요</p>
              <p className="text-xs text-app-text-ghost mt-0.5">
                왼쪽 트리에서 파일을 클릭하면 내용을 보고 편집할 수 있습니다
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
