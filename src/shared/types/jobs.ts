/** launchd 작업 및 스케줄 관련 타입 */
export interface LaunchdJob {
  id: string;
  label: string;
  name: string;
  plistPath: string;
  scriptPath: string;
  logPath: string | null;
  schedule: JobSchedule;
  scheduleText: string;
  isLoaded: boolean;
  lastRun: LastRunInfo | null;
}

// 판별 유니온 타입으로 타입 안전성 확보
export type JobSchedule = CalendarSchedule | IntervalSchedule | KeepAliveSchedule | UnknownSchedule;

export interface CalendarSchedule {
  type: "calendar";
  weekdays?: number[];
  hour?: number;
  minute?: number;
}

export interface IntervalSchedule {
  type: "interval";
  intervalSeconds: number;
}

export interface KeepAliveSchedule {
  type: "keepAlive";
}

export interface UnknownSchedule {
  type: "unknown";
}

export interface LastRunInfo {
  timestamp: string; // ISO 8601
  success: boolean;
  message?: string;
}

export interface JobActionResult {
  success: boolean;
  message: string;
}

export interface LogContent {
  content: string;
  lastModified: string | null; // ISO 8601
}

// 작업 커스터마이징
export interface JobCustomization {
  displayName?: string; // 사용자 지정 이름
}

export type JobCustomizations = Record<string, JobCustomization>;
