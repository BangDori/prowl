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

// 글로벌 단축키 설정
export interface ShortcutConfig {
  toggleChat: string; // Prowl Chat 토글 (빈 문자열 = 비활성화)
  toggleTaskManager: string; // Task Manager 토글 (빈 문자열 = 비활성화)
  openDashboard: string; // Dashboard 열기 (빈 문자열 = 비활성화)
}

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  toggleChat: "CommandOrControl+Shift+P",
  toggleTaskManager: "CommandOrControl+Shift+O",
  openDashboard: "",
};

// 앱 설정
export interface AppSettings {
  focusMode: FocusMode;
  notificationsEnabled: boolean; // 알림 활성화
  shortcuts: ShortcutConfig; // 글로벌 단축키
  openaiApiKey?: string; // OpenAI API 키 (앱 내 설정)
}

export const DEFAULT_SETTINGS: AppSettings = {
  focusMode: DEFAULT_FOCUS_MODE,
  notificationsEnabled: true,
  shortcuts: DEFAULT_SHORTCUTS,
  openaiApiKey: "",
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

// 사용자 메모리 (AI 채팅에서 기억할 선호/지시)
export interface Memory {
  id: string;
  content: string;
  createdAt: string; // ISO 8601
}

// 채팅 룸 요약 (목록 조회용, 메시지 미포함)
export interface ChatRoomSummary {
  id: string;
  title: string;
  lastMessage?: string; // 마지막 메시지 미리보기 (80자)
  messageCount: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  locked?: boolean; // 삭제 잠금 여부
}

// 채팅 룸 전체 데이터 (메시지 포함)
export interface ChatRoom {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  locked?: boolean; // 삭제 잠금 여부
}
