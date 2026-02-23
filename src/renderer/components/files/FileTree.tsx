/** ~/.prowl/ 디렉터리 트리 탐색 컴포넌트 */
import type { ProwlEntry } from "@shared/types";
import { ChevronDown, ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import { useProwlDir } from "../../hooks/useProwlFiles";

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
  depth?: number;
}

/** 개별 파일/디렉터리 노드 */
function FileTreeNode({ entry, selectedPath, onSelectFile, depth = 0 }: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: children } = useProwlDir(expanded ? entry.path : undefined);

  const isSelected = selectedPath === entry.path;
  const indent = depth * 12;

  if (entry.type === "directory") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`
            w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors text-left
            hover:bg-app-hover-bg text-app-text-secondary
          `}
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          <span className="shrink-0 text-app-text-muted">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
          <span className="text-accent/70 shrink-0">
            {expanded ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
          </span>
          <span className="truncate">{entry.name}</span>
        </button>
        {expanded && children && (
          <div>
            {children.map((child) => (
              <FileTreeNode
                key={child.path}
                entry={child}
                selectedPath={selectedPath}
                onSelectFile={onSelectFile}
                depth={depth + 1}
              />
            ))}
            {children.length === 0 && (
              <p
                className="text-[10px] text-app-text-ghost"
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
    <button
      type="button"
      onClick={() => onSelectFile(entry.path)}
      className={`
        w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors text-left
        ${isSelected ? "bg-accent/20 text-accent" : "hover:bg-app-hover-bg text-app-text-secondary"}
      `}
      style={{ paddingLeft: `${20 + indent}px` }}
    >
      <File className="w-3.5 h-3.5 shrink-0 opacity-60" />
      <span className="truncate flex-1">{entry.name}</span>
      {entry.size !== undefined && (
        <span className="text-app-text-ghost text-[10px] shrink-0">{formatSize(entry.size)}</span>
      )}
    </button>
  );
}

interface FileTreeProps {
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}

/** ~/.prowl/ 디렉터리 전체 트리 */
export default function FileTree({ selectedPath, onSelectFile }: FileTreeProps) {
  const { data: entries, isLoading } = useProwlDir();

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
    <div className="p-1 space-y-0.5">
      {entries.map((entry) => (
        <FileTreeNode
          key={entry.path}
          entry={entry}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
        />
      ))}
    </div>
  );
}
