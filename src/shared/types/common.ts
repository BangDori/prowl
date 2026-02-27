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

// 테마 설정
export type Theme = "system" | "light" | "dark";

export const DEFAULT_THEME: Theme = "system";

// OpenAI OAuth 자격 증명
export interface OAuthCredential {
  type: "oauth";
  access: string;
  refresh: string;
  expires: number;
  accountId?: string;
}

export interface ApiKeyCredential {
  type: "api";
  key: string;
}

export type OpenAICredential = OAuthCredential | ApiKeyCredential;

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
  theme: Theme; // 테마 설정
  openaiApiKey?: string; // OpenAI API 키 (앱 내 설정)
  openaiCredential?: OpenAICredential; // OpenAI OAuth 자격 증명
  favoritedRoomIds: string[]; // 즐겨찾기 ChatRoom ID 목록 (ChatRoom 도메인과 분리)
}

export const DEFAULT_SETTINGS: AppSettings = {
  focusMode: DEFAULT_FOCUS_MODE,
  notificationsEnabled: true,
  shortcuts: DEFAULT_SHORTCUTS,
  theme: DEFAULT_THEME,
  openaiApiKey: "",
  favoritedRoomIds: [],
};

// AI 프로바이더
export type AiProvider = "openai";

export interface AiModelOption {
  id: string; // "gpt-5-mini"
  label: string; // "GPT-5 Mini"
  provider: AiProvider;
}

export interface ChatConfig {
  provider: AiProvider;
  model: string; // 선택된 모델 ID
}

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  provider: "openai",
  model: "gpt-5-mini",
};

// 프로바이더별 사용 가능 모델 + API 키 상태
export interface ProviderStatus {
  provider: AiProvider;
  label: string;
  available: boolean; // API 키 존재 여부
  models: AiModelOption[];
}

// 위험 도구 실행 전 사용자 승인 메타데이터
export interface ToolApprovalMeta {
  id: string;
  status: "pending" | "approved" | "rejected";
  toolName: string;
  displayName: string;
  args: Record<string, unknown>;
}

// 채팅
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  /** 위험 도구 승인 요청 메시지일 때 존재 */
  approval?: ToolApprovalMeta;
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

// ~/.prowl/ 디렉터리 항목
export interface ProwlEntry {
  name: string;
  /** ~/.prowl/ 기준 상대 경로 */
  path: string;
  type: "file" | "directory";
  /** 파일인 경우 바이트 크기 */
  size?: number;
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
  favorited?: boolean; // 즐겨찾기 여부
}

// 채팅 룸 전체 데이터 (메시지 포함, 파일에 저장되는 엔티티)
export interface ChatRoom {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  locked?: boolean; // 삭제 잠금 여부 (도메인 규칙: 잠금 시 삭제 불가)
  // favorited 없음 — 즐겨찾기는 AppSettings.favoritedRoomIds로 관리
}

// OAuth 관련 타입
export interface OAuthAuthorization {
  url: string;
  method: "code" | "token";
  instructions?: string;
}

export type OAuthCallbackResult =
  | { type: "success"; access: string; refresh: string; expires: number; accountId?: string }
  | { type: "failed"; error: string };
