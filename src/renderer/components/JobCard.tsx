import { useState } from 'react';
import {
  Play,
  Folder,
  FileText,
  Loader2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import {
  LaunchdJob,
  LogContent,
  JobCustomization,
  JobActionResult,
} from '../../shared/types';
import ToggleSwitch from './ToggleSwitch';
import StatusBadge from './StatusBadge';
import LogViewer from './LogViewer';
import { formatRelativeTime } from '../utils/date';

interface JobCardProps {
  job: LaunchdJob;
  customization?: JobCustomization;
  isToggling: boolean;
  isRunning: boolean;
  onToggle: () => Promise<JobActionResult>;
  onRun: () => Promise<JobActionResult>;
  onViewLogs: () => Promise<LogContent>;
  onUpdateCustomization: (customization: JobCustomization) => Promise<void>;
}

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
    icon: "",
    description: "",
  });

  // 표시할 값 (커스터마이징 > 기본값)
  const displayName = customization?.displayName || job.name;
  const displayIcon = customization?.icon || job.icon;
  const displayDescription = customization?.description || job.description;

  const startEditing = () => {
    setEditForm({
      displayName: customization?.displayName || "",
      icon: customization?.icon || "",
      description: customization?.description || "",
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEditing = async () => {
    await onUpdateCustomization({
      displayName: editForm.displayName || undefined,
      icon: editForm.icon || undefined,
      description: editForm.description || undefined,
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
    if (!job.lastRun) return '-';
    return formatRelativeTime(new Date(job.lastRun.timestamp));
  };

  return (
    <div className="job-card">
      {isEditing ? (
        // 편집 모드
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editForm.icon}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, icon: e.target.value }))
              }
              placeholder={job.icon}
              className="w-10 text-center text-xl bg-gray-100 dark:bg-gray-700 rounded px-1 py-0.5"
              maxLength={2}
            />
            <input
              type="text"
              value={editForm.displayName}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, displayName: e.target.value }))
              }
              placeholder={job.name}
              className="flex-1 text-sm bg-gray-100 dark:bg-gray-700 rounded px-2 py-1"
            />
          </div>
          <input
            type="text"
            value={editForm.description}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder={job.description || "설명 입력..."}
            className="w-full text-xs bg-gray-100 dark:bg-gray-700 rounded px-2 py-1"
          />
          <div className="flex justify-end gap-1">
            <button
              onClick={cancelEditing}
              className="btn-icon text-gray-500 hover:text-red-500"
              title="취소"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={saveEditing}
              className="btn-icon text-gray-500 hover:text-green-500"
              title="저장"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        // 일반 모드
        <>
          {/* 상단: 아이콘, 이름, 토글 */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{displayIcon}</span>
              <div>
                <h3 className="font-medium text-sm">{displayName}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {job.scheduleText}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={startEditing}
                className="btn-icon text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                title="편집"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <ToggleSwitch
                enabled={job.isLoaded}
                loading={isToggling}
                onChange={onToggle}
              />
            </div>
          </div>

          {/* 중단: 설명 및 마지막 실행 */}
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
            {displayDescription}
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
        </>
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
