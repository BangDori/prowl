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

// 작업 커스터마이징
export interface JobCustomization {
  displayName?: string; // 사용자 지정 이름
  icon?: string; // 사용자 지정 아이콘 (이모지)
  description?: string; // 사용자 지정 설명
}

export type JobCustomizations = Record<string, JobCustomization>;
