/** launchd 작업 완료 감지 및 알림 */
import * as fs from "node:fs";
import { JOB_COMPLETION } from "../constants";
import { getLastRunInfo } from "./log-reader";
import { sendJobNotification } from "./notification";

interface MonitoringJob {
  jobName: string;
  logPath: string;
  startTime: number;
  initialMtime: number | null;
}

const monitoringJobs = new Map<string, MonitoringJob>();
let pollInterval: ReturnType<typeof setInterval> | null = null;

/**
 * 로그 파일의 수정 시간 가져오기
 */
function getLogMtime(logPath: string): number | null {
  try {
    const stat = fs.statSync(logPath);
    return stat.mtimeMs;
  } catch {
    return null;
  }
}

/**
 * Job이 현재 실행 중인지 확인
 */
export function isJobRunning(jobId: string): boolean {
  return monitoringJobs.has(jobId);
}

/**
 * 현재 실행 중인 모든 Job ID 목록
 */
export function getRunningJobIds(): string[] {
  return Array.from(monitoringJobs.keys());
}

/**
 * Job 완료 모니터링 시작
 */
export function startMonitoringJob(jobId: string, jobName: string, logPath: string | null): void {
  if (!logPath) {
    return;
  }

  const initialMtime = getLogMtime(logPath);

  monitoringJobs.set(jobId, {
    jobName,
    logPath,
    startTime: Date.now(),
    initialMtime,
  });

  ensurePollingStarted();
}

/**
 * 폴링 인터벌 시작
 */
function ensurePollingStarted(): void {
  if (pollInterval) {
    return;
  }

  pollInterval = setInterval(checkMonitoringJobs, JOB_COMPLETION.POLL_INTERVAL_MS);
}

/**
 * 모니터링 중인 Job들 확인
 */
function checkMonitoringJobs(): void {
  const now = Date.now();

  for (const [jobId, job] of monitoringJobs.entries()) {
    // 타임아웃 체크
    if (now - job.startTime > JOB_COMPLETION.TIMEOUT_MS) {
      monitoringJobs.delete(jobId);
      continue;
    }

    // 로그 파일 수정 시간 확인
    const currentMtime = getLogMtime(job.logPath);
    if (currentMtime === null) {
      continue;
    }

    // 로그 파일이 업데이트되었는지 확인
    if (job.initialMtime === null || currentMtime > job.initialMtime) {
      const lastRun = getLastRunInfo(job.logPath);
      if (lastRun) {
        sendJobNotification({
          jobName: job.jobName,
          success: lastRun.success,
          message: lastRun.message,
        });
      }
      monitoringJobs.delete(jobId);
    }
  }

  // 모니터링할 Job이 없으면 폴링 중지
  if (monitoringJobs.size === 0 && pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
