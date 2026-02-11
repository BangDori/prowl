/** 개별 launchd 작업 카드 컴포넌트 */
import type { JobActionResult, JobCustomization, LaunchdJob, LogContent } from "@shared/types";
import { Check, FileText, Folder, Loader2, Pencil, Play, X } from "lucide-react";
import { useState } from "react";
import { formatRelativeTime } from "../utils/date";
import LogViewer from "./LogViewer";
import StatusBadge from "./StatusBadge";
import ToggleSwitch from "./ToggleSwitch";

/**
 * JobCard 컴포넌트의 Props
 */
interface JobCardProps {
  /** launchd 작업 정보 객체 */
  job: LaunchdJob;
  /** 사용자 정의 커스터마이징 (표시 이름 등) */
  customization?: JobCustomization;
  /** 활성화/비활성화 토글 진행 중 여부 */
  isToggling: boolean;
  /** 작업 실행 중 여부 */
  isRunning: boolean;
  /** 활성화/비활성화 토글 핸들러 */
  onToggle: () => Promise<JobActionResult>;
  /** 수동 실행 핸들러 */
  onRun: () => Promise<JobActionResult>;
  /** 로그 조회 핸들러 */
  onViewLogs: () => Promise<LogContent>;
  /** 커스터마이징 업데이트 핸들러 */
  onUpdateCustomization: (customization: JobCustomization) => Promise<void>;
}

/**
 * 개별 launchd 작업을 표시하는 카드 컴포넌트
 *
 * @description
 * 작업의 이름, 스케줄, 마지막 실행 상태를 표시하고
 * 활성화/비활성화, 수동 실행, 로그 조회, 커스터마이징 편집 기능을 제공합니다.
 *
 * @param props - {@link JobCardProps}
 *
 * @example
 * ```tsx
 * <JobCard
 *   job={launchdJob}
 *   customization={{ displayName: "일일 백업" }}
 *   isToggling={false}
 *   isRunning={false}
 *   onToggle={() => toggleJob(job.id)}
 *   onRun={() => runJob(job.id)}
 *   onViewLogs={() => getLogs(job.id)}
 *   onUpdateCustomization={(c) => updateCustomization(job.id, c)}
 * />
 * ```
 */
export default function JobCard({
  job,
  customization,
  isToggling,
  isRunning,
  onToggle,
  onRun,
  onViewLogs,
  onUpdateCustomization,
}: JobCardProps) {
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<LogContent | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
  });

  // 표시할 값 (커스터마이징 > 기본값)
  const displayName = customization?.displayName || job.name;

  const startEditing = () => {
    setEditForm({
      displayName: customization?.displayName || "",
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEditing = async () => {
    await onUpdateCustomization({
      displayName: editForm.displayName || undefined,
    });
    setIsEditing(false);
  };

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
    return formatRelativeTime(new Date(job.lastRun.timestamp));
  };

  return (
    <div className="job-card group">
      {isEditing ? (
        // 편집 모드
        <div className="space-y-3">
          <input
            type="text"
            value={editForm.displayName}
            onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
            placeholder={job.name}
            className="flex-1 input-field"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelEditing}
              className="btn-ghost text-gray-500 hover:text-red-500"
              title="취소"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={saveEditing}
              className="btn-ghost text-gray-500 hover:text-green-500"
              title="저장"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        // 일반 모드
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                {displayName}
              </h3>
              <button
                onClick={startEditing}
                className="btn-icon text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                title="편집"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500 dark:text-gray-500">{job.scheduleText}</span>
              <span className="text-xs text-gray-400 dark:text-gray-600">·</span>
              {isRunning ? (
                <>
                  <span className="text-xs text-accent">실행 중...</span>
                  <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                </>
              ) : (
                job.lastRun && (
                  <>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatLastRun()}
                    </span>
                    <StatusBadge success={job.lastRun.success} />
                  </>
                )
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* hover 시에만 표시되는 액션 버튼 */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                onClick={onRun}
                disabled={!job.isLoaded || isRunning}
                className="btn-icon text-gray-400 dark:text-gray-500 disabled:opacity-30"
                title={job.isLoaded ? "지금 실행" : "먼저 활성화 필요"}
              >
                {isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={handleOpenPlist}
                disabled={!job.plistPath}
                className="btn-icon text-gray-400 dark:text-gray-500 disabled:opacity-30"
                title="plist 파일 보기"
              >
                <Folder className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleViewLogs}
                disabled={!job.logPath || loadingLogs}
                className="btn-icon text-gray-400 dark:text-gray-500 disabled:opacity-30"
                title="로그 보기"
              >
                {loadingLogs ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <ToggleSwitch enabled={job.isLoaded} loading={isToggling} onChange={onToggle} />
          </div>
        </div>
      )}

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
