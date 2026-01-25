export interface LaunchdJob {
  id: string;
  label: string;
  name: string;
  description: string;
  icon: string;
  plistPath: string;
  scriptPath: string;
  logPath: string | null;
  schedule: JobSchedule;
  scheduleText: string;
  isLoaded: boolean;
  lastRun: LastRunInfo | null;
}

export interface JobSchedule {
  type: 'calendar' | 'interval' | 'keepAlive' | 'unknown';
  weekdays?: number[];
  hour?: number;
  minute?: number;
  intervalSeconds?: number;
}

export interface LastRunInfo {
  timestamp: Date;
  success: boolean;
  message?: string;
}

export interface JobActionResult {
  success: boolean;
  message: string;
}

export interface LogContent {
  content: string;
  lastModified: Date | null;
}

// 앱 설정
export interface AppSettings {
  patterns: string[]; // 감지할 plist 패턴 목록 (예: ['com.claude.', 'com.myapp.'])
}

export const DEFAULT_SETTINGS: AppSettings = {
  patterns: [],
};

// IPC 채널 타입
export type IpcChannels = {
  'jobs:list': () => Promise<LaunchdJob[]>;
  'jobs:toggle': (jobId: string) => Promise<JobActionResult>;
  'jobs:run': (jobId: string) => Promise<JobActionResult>;
  'jobs:logs': (jobId: string, lines?: number) => Promise<LogContent>;
  'jobs:refresh': () => Promise<LaunchdJob[]>;
  'settings:get': () => Promise<AppSettings>;
  'settings:set': (settings: AppSettings) => Promise<void>;
};
