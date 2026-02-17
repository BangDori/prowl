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
  getChatConfig: invokeIpc("chat:get-config"),
  setChatConfig: invokeIpc("chat:set-config"),
  getChatProviders: invokeIpc("chat:providers"),
  resizeChatWindow: invokeIpc("chat:resize"),
  closeChatWindow: invokeIpc("chat:close"),

  // Compact
  toggleCompactView: invokeIpc("compact:toggle"),
  resizeCompactView: invokeIpc("compact:resize"),

  // Tasks
  listTasksByMonth: invokeIpc("tasks:list-month"),
  listTasksByDateRange: invokeIpc("tasks:list-date-range"),
  updateTask: invokeIpc("tasks:update-task"),
  toggleTaskComplete: invokeIpc("tasks:toggle-complete"),
  deleteTask: invokeIpc("tasks:delete-task"),
  addDateTask: invokeIpc("tasks:add-task"),
  scanTaskDates: invokeIpc("tasks:scan-dates"),

  // Tasks – Backlog
  listBacklogTasks: invokeIpc("tasks:list-backlog"),
  addBacklogTask: invokeIpc("tasks:add-backlog"),
  updateBacklogTask: invokeIpc("tasks:update-backlog"),
  toggleBacklogComplete: invokeIpc("tasks:toggle-backlog-complete"),
  deleteBacklogTask: invokeIpc("tasks:delete-backlog"),

  // Claude Config
  getClaudeConfig: invokeIpc("claude-config:list"),
  readConfigFile: invokeIpc("claude-config:read-file"),

  // Memory
  listMemories: invokeIpc("memory:list"),
  addMemory: invokeIpc("memory:add"),
  updateMemory: invokeIpc("memory:update"),
  deleteMemory: invokeIpc("memory:delete"),

  // Event listener (non-invoke)
  onWindowShow: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on("window:show", handler);
    return () => ipcRenderer.removeListener("window:show", handler);
  },
  onTasksChanged: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on("tasks:changed", handler);
    return () => ipcRenderer.removeListener("tasks:changed", handler);
  },
};

// contextBridge로 API 노출
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// TypeScript 타입 정의 export
export type ElectronAPI = typeof electronAPI;
