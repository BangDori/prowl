/** launchd 작업 목록 컴포넌트 */
import type {
  JobActionResult,
  JobCustomization,
  JobCustomizations,
  LaunchdJob,
  LogContent,
} from "@shared/types";
import JobCard from "./JobCard";

/**
 * useJobActions 훅의 반환 타입
 */
interface JobActionsHook {
  /** 현재 토글 중인 작업 ID (없으면 null) */
  toggling: string | null;
  /** 현재 실행 중인 작업 ID 집합 */
  runningJobs: Set<string>;
  /** 작업 활성화/비활성화 토글 */
  toggle: (jobId: string) => Promise<JobActionResult>;
  /** 작업 수동 실행 */
  run: (jobId: string) => Promise<JobActionResult>;
  /** 작업 로그 조회 */
  getLogs: (jobId: string, lines?: number) => Promise<LogContent>;
}

/**
 * JobList 컴포넌트의 Props
 */
interface JobListProps {
  /** 표시할 launchd 작업 목록 */
  jobs: LaunchdJob[];
  /** 작업 액션 훅 (토글, 실행, 로그 조회) */
  actions: JobActionsHook;
  /** 모든 작업의 커스터마이징 데이터 */
  customizations: JobCustomizations;
  /** 개별 작업 커스터마이징 업데이트 핸들러 */
  onUpdateCustomization: (jobId: string, customization: JobCustomization) => Promise<void>;
}

/**
 * launchd 작업 목록을 렌더링하는 컴포넌트
 *
 * @description
 * 전달받은 작업 배열을 순회하며 각 작업을 JobCard로 표시합니다.
 * 토글 상태, 실행 상태, 커스터마이징 데이터를 각 카드에 전달합니다.
 *
 * @param props - {@link JobListProps}
 *
 * @example
 * ```tsx
 * <JobList
 *   jobs={launchdJobs}
 *   actions={jobActions}
 *   customizations={customizations}
 *   onUpdateCustomization={handleUpdateCustomization}
 * />
 * ```
 */
export default function JobList({
  jobs,
  actions,
  customizations,
  onUpdateCustomization,
}: JobListProps) {
  return (
    <div className="space-y-0">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          customization={customizations[job.id]}
          isToggling={actions.toggling === job.id}
          isRunning={actions.runningJobs.has(job.id)}
          onToggle={() => actions.toggle(job.id)}
          onRun={() => actions.run(job.id)}
          onViewLogs={() => actions.getLogs(job.id)}
          onUpdateCustomization={(c) => onUpdateCustomization(job.id, c)}
        />
      ))}
    </div>
  );
}
