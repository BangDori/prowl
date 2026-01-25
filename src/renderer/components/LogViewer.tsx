import React from 'react';

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
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return new Date(date).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {lastModified && `마지막 수정: ${formatDate(lastModified)}`}
        </span>
        <button
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          닫기 ✕
        </button>
      </div>
      <div className="log-viewer">{content}</div>
    </div>
  );
}
