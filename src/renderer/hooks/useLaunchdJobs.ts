/** launchd 작업 목록 조회 및 자동 폴링 훅 */
import { JOB_POLLING_INTERVAL_MS } from "@shared/constants";
import type { LaunchdJob } from "@shared/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryKeys } from "../queries/keys";

interface UseLaunchdJobsResult {
  jobs: LaunchdJob[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLaunchdJobs(): UseLaunchdJobsResult {
  const queryClient = useQueryClient();

  const {
    data: jobs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.jobs.list(),
    queryFn: () => window.electronAPI.listJobs(),
    refetchInterval: JOB_POLLING_INTERVAL_MS,
  });

  // 창이 표시될 때마다 새로고침
  useEffect(() => {
    const unsubscribe = window.electronAPI.onWindowShow(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    });
    return unsubscribe;
  }, [queryClient]);

  return {
    jobs,
    loading: isLoading,
    error: error ? "작업 목록을 불러오는데 실패했습니다." : null,
    refresh: async () => {
      await refetch();
    },
  };
}
