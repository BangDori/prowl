import { RefreshCw, Settings } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  onSettings: () => void;
  loading: boolean;
}

export default function Header({ onRefresh, onSettings, loading }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Prowl
        </h1>
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
