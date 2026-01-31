import { useCallback, useState } from "react";
import type { JobActionResult, LogContent } from "../../shared/types";

interface UseJobActionsResult {
  toggling: string | null;
  running: string | null;
  toggle: (jobId: string) => Promise<JobActionResult>;
  run: (jobId: string) => Promise<JobActionResult>;
  getLogs: (jobId: string, lines?: number) => Promise<LogContent>;
}

export function useJobActions(onActionComplete?: () => void): UseJobActionsResult {
  const [toggling, setToggling] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);

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

  const run = useCallback(async (jobId: string): Promise<JobActionResult> => {
    setRunning(jobId);
    try {
      const result = await window.electronAPI.runJob(jobId);
      return result;
    } finally {
      // 실행 후 잠시 대기 후 상태 해제 (피드백용)
      setTimeout(() => setRunning(null), 1000);
    }
  }, []);

  const getLogs = useCallback(async (jobId: string, lines?: number): Promise<LogContent> => {
    return window.electronAPI.getJobLogs(jobId, lines);
  }, []);

  return { toggling, running, toggle, run, getLogs };
}
