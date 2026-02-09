import type {
  AppSettings,
  CalendarEvent,
  CalendarSettings,
  ChatMessage,
  ChatSendResult,
  ClaudeConfig,
  FocusMode,
  JobActionResult,
  JobCustomization,
  JobCustomizations,
  LaunchdJob,
  LocalEvent,
  LogContent,
  UpdateCheckResult,
} from "@shared/types";
import { contextBridge, ipcRenderer } from "electron";

/**
 * 렌더러 프로세스에 노출할 API
 */
const electronAPI = {
  // 작업 목록 조회
  listJobs: (): Promise<LaunchdJob[]> => ipcRenderer.invoke("jobs:list"),

  // 작업 목록 새로고침
  refreshJobs: (): Promise<LaunchdJob[]> => ipcRenderer.invoke("jobs:refresh"),

  // 작업 토글 (활성화/비활성화)
  toggleJob: (jobId: string): Promise<JobActionResult> => ipcRenderer.invoke("jobs:toggle", jobId),

  // 작업 수동 실행
  runJob: (jobId: string): Promise<JobActionResult> => ipcRenderer.invoke("jobs:run", jobId),

  // 실행 중인 작업 ID 목록 조회
  getRunningJobs: (): Promise<string[]> => ipcRenderer.invoke("jobs:running"),

  // 로그 조회
  getJobLogs: (jobId: string, lines?: number): Promise<LogContent> =>
    ipcRenderer.invoke("jobs:logs", jobId, lines),

  // 창 표시 이벤트 리스너
  onWindowShow: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on("window:show", handler);
    return () => ipcRenderer.removeListener("window:show", handler);
  },

  // 설정 조회
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke("settings:get"),

  // 설정 저장
  setSettings: (settings: AppSettings): Promise<void> =>
    ipcRenderer.invoke("settings:set", settings),

  // Finder에서 파일 위치 보기
  showInFolder: (filePath: string): Promise<void> =>
    ipcRenderer.invoke("shell:showInFolder", filePath),

  // 외부 URL 열기
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke("shell:openExternal", url),

  // 모든 작업 커스터마이징 조회
  getJobCustomizations: (): Promise<JobCustomizations> =>
    ipcRenderer.invoke("jobs:getCustomizations"),

  // 작업 커스터마이징 저장
  setJobCustomization: (jobId: string, customization: JobCustomization): Promise<void> =>
    ipcRenderer.invoke("jobs:setCustomization", jobId, customization),

  // 집중 모드
  getFocusMode: (): Promise<FocusMode> => ipcRenderer.invoke("focusMode:get"),

  setFocusMode: (focusMode: FocusMode): Promise<void> =>
    ipcRenderer.invoke("focusMode:set", focusMode),

  // 윈도우 높이 동적 조정
  resizeWindow: (height: number): Promise<void> => ipcRenderer.invoke("window:resize", height),

  // 뒤로가기 (트레이 메뉴로 돌아가기)
  navigateBack: (): Promise<void> => ipcRenderer.invoke("nav:back"),

  // 앱 종료
  quitApp: (): Promise<void> => ipcRenderer.invoke("app:quit"),

  // 채팅
  sendChatMessage: (content: string, history: ChatMessage[]): Promise<ChatSendResult> =>
    ipcRenderer.invoke("chat:send", content, history),
  resizeChatWindow: (height: number): Promise<void> => ipcRenderer.invoke("chat:resize", height),
  closeChatWindow: (): Promise<void> => ipcRenderer.invoke("chat:close"),

  // 앱 버전 조회
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("app:version"),

  // 업데이트 확인
  checkForUpdates: (): Promise<UpdateCheckResult> => ipcRenderer.invoke("app:check-update"),

  // 캘린더 이벤트 조회
  getCalendarEvents: (): Promise<CalendarEvent[]> => ipcRenderer.invoke("calendar:list-events"),

  // 캘린더 설정 조회
  getCalendarSettings: (): Promise<CalendarSettings> => ipcRenderer.invoke("calendar:get-settings"),

  // 캘린더 설정 저장
  setCalendarSettings: (settings: CalendarSettings): Promise<void> =>
    ipcRenderer.invoke("calendar:set-settings", settings),

  // 로컬 이벤트 목록 조회
  getLocalEvents: (): Promise<LocalEvent[]> => ipcRenderer.invoke("calendar:local-events"),

  // 로컬 이벤트 추가
  addLocalEvent: (event: LocalEvent): Promise<void> =>
    ipcRenderer.invoke("calendar:add-local-event", event),

  // 로컬 이벤트 수정
  updateLocalEvent: (event: LocalEvent): Promise<void> =>
    ipcRenderer.invoke("calendar:update-local-event", event),

  // 로컬 이벤트 삭제
  deleteLocalEvent: (eventId: string): Promise<void> =>
    ipcRenderer.invoke("calendar:delete-local-event", eventId),

  // Claude Config 조회
  getClaudeConfig: (): Promise<ClaudeConfig> => ipcRenderer.invoke("claude-config:list"),

  // 파일 내용 조회
  readConfigFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke("claude-config:read-file", filePath),
};

// contextBridge로 API 노출
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// TypeScript 타입 정의 export
export type ElectronAPI = typeof electronAPI;
