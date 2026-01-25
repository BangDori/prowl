import { LaunchdJob, JobActionResult, LogContent } from '../shared/types';

export interface ElectronAPI {
  listJobs: () => Promise<LaunchdJob[]>;
  refreshJobs: () => Promise<LaunchdJob[]>;
  toggleJob: (jobId: string) => Promise<JobActionResult>;
  runJob: (jobId: string) => Promise<JobActionResult>;
  getJobLogs: (jobId: string, lines?: number) => Promise<LogContent>;
  onWindowShow: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
