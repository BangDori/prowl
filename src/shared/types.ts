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
  notificationsEnabled: boolean; // Job 완료 알림 활성화
}

export const DEFAULT_SETTINGS: AppSettings = {
  patterns: [],
  focusMode: DEFAULT_FOCUS_MODE,
  notificationsEnabled: true,
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

// 업데이트 체크 결과
export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  releaseNotes?: string;
  error?: string;
}

// 캘린더 이벤트
export interface CalendarEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart: Date;
  dtend: Date;
  allDay: boolean;
  feedId: string; // 어떤 피드에서 온 이벤트인지
}

// ICS 피드
export interface IcsFeed {
  id: string; // 고유 ID
  label: string; // "회사", "개인" 등
  url: string; // ICS URL
  color: string; // 피드 색상 (hex)
  filterKeyword?: string; // 포함 키워드 필터 (설정 시 키워드가 포함된 이벤트만 표시)
}

// 피드 색상 프리셋
export const FEED_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#ef4444", // red
  "#a855f7", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
] as const;

// 로컬 이벤트 (사용자가 직접 추가)
export interface LocalEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart: string; // ISO 문자열 (저장용)
  dtend: string;
  allDay: boolean;
}

// 로컬 이벤트 전용 feedId 및 색상
export const LOCAL_FEED_ID = "__local__";
export const LOCAL_EVENT_COLOR = "#f59e0b"; // accent gold

// 캘린더 설정
export interface CalendarSettings {
  feeds: IcsFeed[];
}

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  feeds: [],
};

// Claude Agent 메타데이터
export interface ClaudeAgentMeta {
  name: string;
  description: string;
  model?: string;
  color?: string;
}

// Claude Agent
export interface ClaudeAgent {
  id: string; // "resume/resume-analyst"
  filename: string; // "resume-analyst.md"
  category: string; // "resume"
  filePath: string;
  meta: ClaudeAgentMeta;
  content: string; // 미리보기 500자
}

// Claude Command
export interface ClaudeCommand {
  id: string; // "agent-loop"
  filename: string;
  filePath: string;
  title: string; // 첫 # 제목
  description: string; // 첫 100자
  content: string;
}

// Claude Hook
export interface ClaudeHook {
  id: string; // "SessionStart", "PreToolUse:Bash" 등
  event: string; // "SessionStart", "PreToolUse" 등
  matcher?: string; // "Bash" 등 (PreToolUse/PostToolUse용)
  hooks: Array<{
    type: string;
    command: string;
  }>;
}

// Claude Rule
export interface ClaudeRule {
  id: string;
  filename: string;
  filePath: string;
  content: string;
}

// Claude Config 전체 데이터
export interface ClaudeConfig {
  agents: ClaudeAgent[];
  commands: ClaudeCommand[];
  hooks: ClaudeHook[];
  rules: ClaudeRule[];
  lastUpdated: Date;
}
