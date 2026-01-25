import React, { useState } from "react";
import { LaunchdJob, LogContent } from "../../shared/types";
import ToggleSwitch from "./ToggleSwitch";
import StatusBadge from "./StatusBadge";
import LogViewer from "./LogViewer";

interface JobCardProps {
  job: LaunchdJob;
  isToggling: boolean;
  isRunning: boolean;
  onToggle: () => Promise<any>;
  onRun: () => Promise<any>;
  onViewLogs: () => Promise<LogContent>;
}

export default function JobCard({
  job,
  isToggling,
  isRunning,
  onToggle,
  onRun,
  onViewLogs,
}: JobCardProps) {
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<LogContent | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const handleViewLogs = async () => {
    if (showLogs) {
      setShowLogs(false);
      return;
    }

    setLoadingLogs(true);
    try {
      const content = await onViewLogs();
      setLogs(content);
      setShowLogs(true);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOpenPlist = async () => {
    if (job.plistPath) {
      await window.electronAPI.showInFolder(job.plistPath);
    }
  };

  const formatLastRun = (): string => {
    if (!job.lastRun) return "-";

    const now = new Date();
    const runTime = new Date(job.lastRun.timestamp);
    const diffMs = now.getTime() - runTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return runTime.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="job-card">
      {/* 상단: 아이콘, 이름, 토글 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{job.icon}</span>
          <div>
            <h3 className="font-medium text-sm">{job.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {job.scheduleText}
            </p>
          </div>
        </div>
        <ToggleSwitch
          enabled={job.isLoaded}
          loading={isToggling}
          onChange={onToggle}
        />
      </div>

      {/* 중단: 설명 및 마지막 실행 */}
      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
        {job.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>마지막 실행:</span>
          <span>{formatLastRun()}</span>
          {job.lastRun && <StatusBadge success={job.lastRun.success} />}
        </div>

        {/* 버튼들 */}
        <div className="flex items-center gap-1">
          <button
            onClick={onRun}
            disabled={!job.isLoaded || isRunning}
            className="btn-icon text-gray-500 dark:text-gray-400 disabled:opacity-30"
            title={job.isLoaded ? "지금 실행" : "먼저 활성화 필요"}
          >
            {isRunning ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          <button
            onClick={handleOpenPlist}
            disabled={!job.plistPath}
            className="btn-icon text-gray-500 dark:text-gray-400 disabled:opacity-30"
            title="plist 파일 보기"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </button>

          <button
            onClick={handleViewLogs}
            disabled={!job.logPath || loadingLogs}
            className="btn-icon text-gray-500 dark:text-gray-400 disabled:opacity-30"
            title="로그 보기"
          >
            {loadingLogs ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 로그 뷰어 */}
      {showLogs && logs && (
        <LogViewer
          content={logs.content}
          lastModified={logs.lastModified}
          onClose={() => setShowLogs(false)}
        />
      )}
    </div>
  );
}
