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
