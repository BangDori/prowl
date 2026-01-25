import React, { useState } from "react";
import { Play, Folder, FileText, Loader2 } from "lucide-react";
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
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleOpenPlist}
            disabled={!job.plistPath}
            className="btn-icon text-gray-500 dark:text-gray-400 disabled:opacity-30"
            title="plist 파일 보기"
          >
            <Folder className="w-4 h-4" />
          </button>

          <button
            onClick={handleViewLogs}
            disabled={!job.logPath || loadingLogs}
            className="btn-icon text-gray-500 dark:text-gray-400 disabled:opacity-30"
            title="로그 보기"
          >
            {loadingLogs ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
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
