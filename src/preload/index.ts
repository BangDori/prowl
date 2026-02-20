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
  toggleChatExpand: invokeIpc("chat:expand-toggle"),
  approveTool: invokeIpc("chat:approve-tool"),
  rejectTool: invokeIpc("chat:reject-tool"),

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

  // Chat Rooms
  listChatRooms: invokeIpc("chat-rooms:list"),
  getChatRoom: invokeIpc("chat-rooms:get"),
  createChatRoom: invokeIpc("chat-rooms:create"),
  deleteChatRoom: invokeIpc("chat-rooms:delete"),
  toggleChatRoomLock: invokeIpc("chat-rooms:toggle-lock"),
  saveChatMessages: invokeIpc("chat-rooms:save-messages"),
  markChatRoomRead: invokeIpc("chat-rooms:mark-read"),
  getChatUnreadCounts: invokeIpc("chat-rooms:unread-counts"),

  // Memory
  listMemories: invokeIpc("memory:list"),
  addMemory: invokeIpc("memory:add"),
  updateMemory: invokeIpc("memory:update"),
  deleteMemory: invokeIpc("memory:delete"),

  // Scripts
  getScriptStoragePath: invokeIpc("scripts:storage-path"),
  listScripts: invokeIpc("scripts:list"),
  createScript: invokeIpc("scripts:create"),
  updateScript: invokeIpc("scripts:update"),
  deleteScript: invokeIpc("scripts:delete"),
  toggleScript: invokeIpc("scripts:toggle"),
  runScript: invokeIpc("scripts:run"),
  getScriptLogs: invokeIpc("scripts:logs"),

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
  onScriptsChanged: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on("scripts:changed", handler);
    return () => ipcRenderer.removeListener("scripts:changed", handler);
  },
  onMemoryChanged: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on("memory:changed", handler);
    return () => ipcRenderer.removeListener("memory:changed", handler);
  },

  // Chat stream events
  onChatStreamMessage: (
    callback: (message: import("@shared/types").ChatMessage) => void,
  ): (() => void) => {
    const handler = (_e: unknown, message: import("@shared/types").ChatMessage) =>
      callback(message);
    ipcRenderer.on("chat:stream-message", handler as never);
    return () => ipcRenderer.removeListener("chat:stream-message", handler as never);
  },
  onChatStreamDone: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on("chat:stream-done", handler);
    return () => ipcRenderer.removeListener("chat:stream-done", handler);
  },
  onChatStreamError: (callback: (error: string) => void): (() => void) => {
    const handler = (_e: unknown, error: string) => callback(error);
    ipcRenderer.on("chat:stream-error", handler as never);
    return () => ipcRenderer.removeListener("chat:stream-error", handler as never);
  },
  onChatUnreadChanged: (callback: (totalUnread: number) => void): (() => void) => {
    const handler = (_event: unknown, totalUnread: number) => callback(totalUnread);
    ipcRenderer.on("chat-rooms:unread-changed", handler);
    return () => ipcRenderer.removeListener("chat-rooms:unread-changed", handler);
  },
};

// contextBridge로 API 노출
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// TypeScript 타입 정의 export
export type ElectronAPI = typeof electronAPI;
