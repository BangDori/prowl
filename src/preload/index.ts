/** Renderer에 노출할 타입 안전 IPC 브릿지 */
import type { IpcChannel, IpcParams, IpcReturn } from "@shared/ipc-schema";
import { contextBridge, ipcRenderer } from "electron";

/**
 * 타입 안전한 IPC invoke 래퍼 생성
 *
 * IpcInvokeSchema에서 채널의 파라미터/반환 타입을 자동 추론한다.
 */
function invokeIpc<C extends IpcChannel>(
  channel: C,
): (...args: IpcParams<C>) => Promise<IpcReturn<C>> {
  return (...args) => ipcRenderer.invoke(channel, ...args);
}

/**
 * 렌더러 프로세스에 노출할 API
 */
const electronAPI = {
  // Jobs
  listJobs: invokeIpc("jobs:list"),
  refreshJobs: invokeIpc("jobs:refresh"),
  toggleJob: invokeIpc("jobs:toggle"),
  runJob: invokeIpc("jobs:run"),
  getRunningJobs: invokeIpc("jobs:running"),
  getJobLogs: invokeIpc("jobs:logs"),
  getJobCustomizations: invokeIpc("jobs:getCustomizations"),
  setJobCustomization: invokeIpc("jobs:setCustomization"),

  // Settings
  getSettings: invokeIpc("settings:get"),
  setSettings: invokeIpc("settings:set"),

  // Shell
  showInFolder: invokeIpc("shell:showInFolder"),
  openExternal: invokeIpc("shell:openExternal"),

  // Focus Mode
  getFocusMode: invokeIpc("focusMode:get"),
  setFocusMode: invokeIpc("focusMode:set"),

  // Window
  resizeWindow: invokeIpc("window:resize"),
  navigateBack: invokeIpc("nav:back"),

  // App
  quitApp: invokeIpc("app:quit"),
  getAppVersion: invokeIpc("app:version"),
  checkForUpdates: invokeIpc("app:check-update"),
  installUpdate: invokeIpc("app:install-update"),
  relaunchApp: invokeIpc("app:relaunch"),

  // Chat
  sendChatMessage: invokeIpc("chat:send"),
  resizeChatWindow: invokeIpc("chat:resize"),
  closeChatWindow: invokeIpc("chat:close"),

  // Calendar
  getCalendarEvents: invokeIpc("calendar:list-events"),
  getCalendarSettings: invokeIpc("calendar:get-settings"),
  setCalendarSettings: invokeIpc("calendar:set-settings"),
  getLocalEvents: invokeIpc("calendar:local-events"),
  addLocalEvent: invokeIpc("calendar:add-local-event"),
  updateLocalEvent: invokeIpc("calendar:update-local-event"),
  deleteLocalEvent: invokeIpc("calendar:delete-local-event"),

  // Claude Config
  getClaudeConfig: invokeIpc("claude-config:list"),
  readConfigFile: invokeIpc("claude-config:read-file"),

  // Event listener (non-invoke)
  onWindowShow: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on("window:show", handler);
    return () => ipcRenderer.removeListener("window:show", handler);
  },
};

// contextBridge로 API 노출
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// TypeScript 타입 정의 export
export type ElectronAPI = typeof electronAPI;
