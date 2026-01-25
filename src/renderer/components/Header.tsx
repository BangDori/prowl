import React from 'react';

interface HeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

export default function Header({ onRefresh, loading }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700 px-3 py-2 z-10">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold flex items-center gap-2">
          <span>🐱</span>
          <span>Prowl</span>
        </h1>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn-icon text-gray-500 dark:text-gray-400 disabled:opacity-50"
          title="새로고침"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin-slow' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
