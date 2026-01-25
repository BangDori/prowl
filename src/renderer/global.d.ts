import {
  LaunchdJob,
  JobActionResult,
  LogContent,
  AppSettings,
  JobCustomization,
  JobCustomizations,
} from "../shared/types";

export interface ElectronAPI {
  listJobs: () => Promise<LaunchdJob[]>;
  refreshJobs: () => Promise<LaunchdJob[]>;
  toggleJob: (jobId: string) => Promise<JobActionResult>;
  runJob: (jobId: string) => Promise<JobActionResult>;
  getJobLogs: (jobId: string, lines?: number) => Promise<LogContent>;
  onWindowShow: (callback: () => void) => () => void;
  getSettings: () => Promise<AppSettings>;
  setSettings: (settings: AppSettings) => Promise<void>;
  showInFolder: (filePath: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  getJobCustomizations: () => Promise<JobCustomizations>;
  setJobCustomization: (
    jobId: string,
    customization: JobCustomization,
  ) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
