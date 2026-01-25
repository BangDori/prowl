import { X } from 'lucide-react';
import { formatDateTime } from '../utils/date';

interface LogViewerProps {
  content: string;
  lastModified: Date | null;
  onClose: () => void;
}

export default function LogViewer({
  content,
  lastModified,
  onClose,
}: LogViewerProps) {

  return (
    <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {lastModified && `마지막 수정: ${formatDateTime(lastModified)}`}
        </span>
        <button
          onClick={onClose}
          className="btn-icon text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="log-viewer">{content}</div>
    </div>
  );
}
