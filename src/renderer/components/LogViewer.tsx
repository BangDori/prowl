import { X } from "lucide-react";
import { formatDateTime } from "../utils/date";

/**
 * LogViewer 컴포넌트의 Props
 */
interface LogViewerProps {
  /** 로그 파일 내용 */
  content: string;
  /** 로그 파일 마지막 수정 시간 (ISO 8601) */
  lastModified: string | null;
  /** 로그 뷰어 닫기 핸들러 */
  onClose: () => void;
}

/**
 * 작업 로그를 표시하는 뷰어 컴포넌트
 *
 * @description
 * JobCard 내부에서 펼쳐지는 형태로 로그 내용을 표시합니다.
 * 마지막 수정 시간과 닫기 버튼을 제공합니다.
 *
 * @param props - {@link LogViewerProps}
 *
 * @example
 * ```tsx
 * <LogViewer
 *   content={logContent}
 *   lastModified={new Date()}
 *   onClose={() => setShowLogs(false)}
 * />
 * ```
 */
export default function LogViewer({ content, lastModified, onClose }: LogViewerProps) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-prowl-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {lastModified && `마지막 수정: ${formatDateTime(lastModified)}`}
        </span>
        <button
          onClick={onClose}
          className="btn-icon text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          title="닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="log-viewer">{content}</div>
    </div>
  );
}
