import React from 'react';
import { RefreshCw, Settings } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  onSettings: () => void;
  loading: boolean;
}

export default function Header({ onRefresh, onSettings, loading }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700 px-3 py-2 z-10">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-icon text-gray-500 dark:text-gray-400 disabled:opacity-50"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onSettings}
            className="btn-icon text-gray-500 dark:text-gray-400"
            title="설정"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
