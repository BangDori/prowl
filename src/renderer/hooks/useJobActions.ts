import { useCallback, useEffect, useRef, useState } from "react";
import { JOB_COMPLETION } from "../../shared/constants";
import type { JobActionResult, LogContent } from "../../shared/types";

interface UseJobActionsResult {
  toggling: string | null;
  runningJobs: Set<string>;
  toggle: (jobId: string) => Promise<JobActionResult>;
  run: (jobId: string) => Promise<JobActionResult>;
  getLogs: (jobId: string, lines?: number) => Promise<LogContent>;
}

export function useJobActions(onActionComplete?: () => void): UseJobActionsResult {
  const [toggling, setToggling] = useState<string | null>(null);
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onActionCompleteRef = useRef(onActionComplete);

  // 콜백 ref 최신 상태 유지
  useEffect(() => {
    onActionCompleteRef.current = onActionComplete;
  }, [onActionComplete]);

  // 폴링 중지 및 완료 처리
  const stopPollingAndRefresh = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    onActionCompleteRef.current?.();
  }, []);

  // 실행 중인 Job 목록 폴링
  const pollRunningJobs = useCallback(async () => {
    const running = await window.electronAPI.getRunningJobs();
    setRunningJobs(new Set(running));

    // 실행 중인 Job이 없으면 폴링 중지 및 새로고침
    if (running.length === 0) {
      stopPollingAndRefresh();
    }
  }, [stopPollingAndRefresh]);

  // 폴링 시작
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    pollIntervalRef.current = setInterval(pollRunningJobs, JOB_COMPLETION.POLL_INTERVAL_MS);
  }, [pollRunningJobs]);

  // 컴포넌트 마운트 시 실행 중인 Job 목록 초기화
  useEffect(() => {
    const initRunningJobs = async () => {
      const running = await window.electronAPI.getRunningJobs();
      if (running.length > 0) {
        setRunningJobs(new Set(running));
        startPolling();
      }
    };
    initRunningJobs();

    // 언마운트 시 폴링 정리
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [startPolling]);

  const toggle = useCallback(
    async (jobId: string): Promise<JobActionResult> => {
      setToggling(jobId);
      try {
        const result = await window.electronAPI.toggleJob(jobId);
        if (result.success && onActionComplete) {
          onActionComplete();
        }
        return result;
      } finally {
        setToggling(null);
      }
    },
    [onActionComplete],
  );

  const run = useCallback(
    async (jobId: string): Promise<JobActionResult> => {
      const result = await window.electronAPI.runJob(jobId);
      if (result.success) {
        setRunningJobs((prev) => new Set(prev).add(jobId));
        startPolling();
      }
      return result;
    },
    [startPolling],
  );

  const getLogs = useCallback(async (jobId: string, lines?: number): Promise<LogContent> => {
    return window.electronAPI.getJobLogs(jobId, lines);
  }, []);

  return { toggling, runningJobs, toggle, run, getLogs };
}
