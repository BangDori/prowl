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

// 집중 모드 설정
export interface FocusMode {
  enabled: boolean;
  startTime: string; // "22:00"
  endTime: string; // "07:00"
}

export const DEFAULT_FOCUS_MODE: FocusMode = {
  enabled: false,
  startTime: "00:00",
  endTime: "07:00",
};

// 앱 설정
export interface AppSettings {
  patterns: string[]; // 감지할 plist 패턴 목록 (예: ['com.claude.', 'com.myapp.'])
  focusMode: FocusMode;
}

export const DEFAULT_SETTINGS: AppSettings = {
  patterns: [],
  focusMode: DEFAULT_FOCUS_MODE,
};

// 작업 커스터마이징
export interface JobCustomization {
  displayName?: string; // 사용자 지정 이름
}

export type JobCustomizations = Record<string, JobCustomization>;

// 채팅
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ChatSendResult {
  success: boolean;
  message?: ChatMessage;
  error?: string;
}
