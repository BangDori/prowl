import { useState, useEffect, useCallback } from 'react';
import { LaunchdJob } from '../../shared/types';

interface UseLaunchdJobsResult {
  jobs: LaunchdJob[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLaunchdJobs(): UseLaunchdJobsResult {
  const [jobs, setJobs] = useState<LaunchdJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      const result = await window.electronAPI.listJobs();
      setJobs(result);
    } catch (err) {
      setError('작업 목록을 불러오는데 실패했습니다.');
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchJobs();

    // 창이 표시될 때마다 새로고침
    const unsubscribe = window.electronAPI.onWindowShow(() => {
      fetchJobs();
    });

    // 주기적 폴링 (30초)
    const interval = setInterval(fetchJobs, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [fetchJobs]);

  return { jobs, loading, error, refresh };
}
