import { contextBridge, ipcRenderer } from "electron";
import type {
  AppSettings,
  ChatMessage,
  ChatSendResult,
  FocusMode,
  JobActionResult,
  JobCustomization,
  JobCustomizations,
  LaunchdJob,
  LogContent,
} from "../shared/types";

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
  getChatApiKey: (): Promise<string> => ipcRenderer.invoke("chat:getApiKey"),
  setChatApiKey: (apiKey: string): Promise<void> => ipcRenderer.invoke("chat:setApiKey", apiKey),
  resizeChatWindow: (height: number): Promise<void> => ipcRenderer.invoke("chat:resize", height),
  closeChatWindow: (): Promise<void> => ipcRenderer.invoke("chat:close"),
};

// contextBridge로 API 노출
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// TypeScript 타입 정의 export
export type ElectronAPI = typeof electronAPI;
