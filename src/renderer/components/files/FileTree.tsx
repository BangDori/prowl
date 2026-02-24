/** ~/.prowl/ 디렉터리 트리 탐색 컴포넌트 */
import type { ProwlEntry } from "@shared/types";
import {
  ChevronDown,
  ChevronRight,
  File,
  FileBraces,
  FileCode,
  FileTerminal,
  FileText,
  Folder,
  FolderOpen,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useDeleteProwlEntry, useProwlDir } from "../../hooks/useProwlFiles";
import ConfirmDialog from "../ConfirmDialog";

/** 파일 확장자에 맞는 아이콘 컴포넌트 반환 */
function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "json":
      return FileBraces;
    case "plist":
    case "xml":
      return FileCode;
    case "sh":
    case "bash":
    case "zsh":
      return FileTerminal;
    case "txt":
    case "log":
      return FileText;
    default:
      return File;
  }
}

/** 파일 크기를 읽기 쉬운 형식으로 변환 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

interface FileTreeNodeProps {
  entry: ProwlEntry;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onRequestDelete: (entry: ProwlEntry) => void;
  depth?: number;
}

/** 개별 파일/디렉터리 노드 */
function FileTreeNode({
  entry,
  selectedPath,
  onSelectFile,
  onRequestDelete,
  depth = 0,
}: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: children } = useProwlDir(expanded ? entry.path : undefined);

  const isSelected = selectedPath === entry.path;
  const indent = depth * 12;
  const FileIcon = getFileIcon(entry.name);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestDelete(entry);
  };

  if (entry.type === "directory") {
    return (
      <div className="group">
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex-1 flex items-center gap-1.5 py-1 rounded text-xs transition-colors text-left hover:bg-app-hover-bg text-app-text-secondary min-w-0"
            style={{ paddingLeft: `${8 + indent}px`, paddingRight: "24px" }}
          >
            <span className="shrink-0 text-app-text-muted">
              {expanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </span>
            <span className="text-accent/70 shrink-0">
              {expanded ? (
                <FolderOpen className="w-3.5 h-3.5" />
              ) : (
                <Folder className="w-3.5 h-3.5" />
              )}
            </span>
            <span className="truncate">{entry.name}</span>
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            className="absolute right-1 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-app-text-ghost hover:text-red-400 transition-colors"
            title="삭제"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        {expanded && children && (
          <div>
            {children.map((child) => (
              <FileTreeNode
                key={child.path}
                entry={child}
                selectedPath={selectedPath}
                onSelectFile={onSelectFile}
                onRequestDelete={onRequestDelete}
                depth={depth + 1}
              />
            ))}
            {children.length === 0 && (
              <p
                className="text-[10px] text-app-text-ghost py-0.5"
                style={{ paddingLeft: `${24 + indent}px` }}
              >
                비어 있음
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group relative flex items-center">
      <button
        type="button"
        onClick={() => onSelectFile(entry.path)}
        className={`
          flex-1 flex items-center gap-1.5 py-1 rounded text-xs transition-colors text-left min-w-0
          ${isSelected ? "bg-accent/20 text-accent" : "hover:bg-app-hover-bg text-app-text-secondary"}
        `}
        style={{ paddingLeft: `${20 + indent}px`, paddingRight: "24px" }}
      >
        <FileIcon className="w-3.5 h-3.5 shrink-0 opacity-60" />
        <span className="truncate flex-1">{entry.name}</span>
        {entry.size !== undefined && (
          <span className="text-app-text-ghost text-[10px] shrink-0 group-hover:opacity-0 transition-opacity">
            {formatSize(entry.size)}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={handleDeleteClick}
        className="absolute right-1 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-app-text-ghost hover:text-red-400 transition-colors"
        title="삭제"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

interface FileTreeProps {
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onDeleted: (path: string) => void;
}

/** ~/.prowl/ 디렉터리 전체 트리 */
export default function FileTree({ selectedPath, onSelectFile, onDeleted }: FileTreeProps) {
  const { data: entries, isLoading } = useProwlDir();
  const [pendingDelete, setPendingDelete] = useState<ProwlEntry | null>(null);
  const deleteMutation = useDeleteProwlEntry();

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete.path, {
      onSuccess: (result) => {
        if (result.success) {
          onDeleted(pendingDelete.path);
          setPendingDelete(null);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-3 space-y-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-5 rounded" />
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return <p className="p-3 text-xs text-app-text-ghost">~/.prowl/ 디렉터리가 비어 있습니다</p>;
  }

  return (
    <>
      <div className="p-1 space-y-0.5">
        {entries.map((entry) => (
          <FileTreeNode
            key={entry.path}
            entry={entry}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
            onRequestDelete={setPendingDelete}
            depth={0}
          />
        ))}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="삭제 확인"
          message={`"${pendingDelete.name}"을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleConfirmDelete}
          loading={deleteMutation.isPending}
        />
      )}
    </>
  );
}
