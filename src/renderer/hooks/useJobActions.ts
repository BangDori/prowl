import { JOB_COMPLETION } from "@shared/constants";
import type { JobActionResult, LogContent } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "../queries/keys";

interface UseJobActionsResult {
  toggling: string | null;
  runningJobs: Set<string>;
  toggle: (jobId: string) => Promise<JobActionResult>;
  run: (jobId: string) => Promise<JobActionResult>;
  getLogs: (jobId: string, lines?: number) => Promise<LogContent>;
}

export function useJobActions(onActionComplete?: () => void): UseJobActionsResult {
  const queryClient = useQueryClient();

  // 실행 중인 Job 폴링 (running job이 있을 때만 1초 간격)
  const { data: runningJobsList = [] } = useQuery({
    queryKey: queryKeys.jobs.running(),
    queryFn: () => window.electronAPI.getRunningJobs(),
    refetchInterval: (query) =>
      (query.state.data?.length ?? 0) > 0 ? JOB_COMPLETION.POLL_INTERVAL_MS : false,
  });

  const runningJobs = new Set(runningJobsList);

  // running jobs가 0이 되면 완료 콜백 호출
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    onActionComplete?.();
  }, [queryClient, onActionComplete]);

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: (jobId: string) => window.electronAPI.toggleJob(jobId),
    onSuccess: (result) => {
      if (result.success) invalidateAll();
    },
  });

  // Run mutation
  const runMutation = useMutation({
    mutationFn: (jobId: string) => window.electronAPI.runJob(jobId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs.running() });
        invalidateAll();
      }
    },
  });

  const getLogs = useCallback(async (jobId: string, lines?: number): Promise<LogContent> => {
    return window.electronAPI.getJobLogs(jobId, lines);
  }, []);

  return {
    toggling: toggleMutation.isPending ? (toggleMutation.variables ?? null) : null,
    runningJobs,
    toggle: async (jobId) => toggleMutation.mutateAsync(jobId),
    run: async (jobId) => runMutation.mutateAsync(jobId),
    getLogs,
  };
}
