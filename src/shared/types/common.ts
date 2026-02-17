/** 공용 타입: IPC 결과, 설정, 채팅, Claude 구성 */
// IPC mutation 채널의 안전한 결과 타입 (에러가 숨겨지지 않도록)
export interface IpcResult {
  success: boolean;
  error?: string;
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

// AI 프로바이더
export type AiProvider = "openai";

export interface AiModelOption {
  id: string; // "gpt-4o-mini"
  label: string; // "GPT-4o Mini"
  provider: AiProvider;
}

export interface ChatConfig {
  provider: AiProvider;
  model: string; // 선택된 모델 ID
}

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  provider: "openai",
  model: "gpt-4o",
};

// 프로바이더별 사용 가능 모델 + API 키 상태
export interface ProviderStatus {
  provider: AiProvider;
  label: string;
  available: boolean; // API 키 존재 여부
  models: AiModelOption[];
}

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

// Homebrew 설치 상태
export type BrewInstallStatus =
  | "brew-ready" // brew 설치됨 + prowl이 brew로 설치됨
  | "not-via-brew" // brew 있지만 prowl은 brew로 설치 안 됨
  | "brew-not-installed"; // brew 자체가 없음

// 업데이트 체크 결과
export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  releaseNotes?: string;
  error?: string;
  brewStatus?: BrewInstallStatus;
}

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
  lastUpdated: string; // ISO 8601
}
