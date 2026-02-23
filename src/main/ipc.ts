/** IPC 채널 핸들러 등록 및 라우팅 */
import { app, ipcMain, shell } from "electron";
import type { IpcChannel, IpcParams, IpcReturn } from "../shared/ipc-schema";
import { DEFAULT_SHORTCUTS } from "../shared/types";
import { WINDOW } from "./constants";
import { resolveApproval } from "./services/approval";
import { runBrewUpgrade } from "./services/brew-updater";
import { addCategory, deleteCategory, listCategories, renameCategory } from "./services/categories";
import { getProviderStatuses, setPageContext, streamChatMessage } from "./services/chat";
import {
  getAllUnreadCounts,
  markRoomAsRead,
  removeRoomReadState,
  updateTrayBadge,
} from "./services/chat-read-state";
import {
  createChatRoom,
  deleteChatRoom,
  getChatRoom,
  listChatRooms,
  saveChatMessages,
  toggleChatRoomFavorite,
  toggleChatRoomLock,
} from "./services/chat-rooms";
import { updateFocusModeMonitor } from "./services/focus-mode";
import { addMemory, deleteMemory, listMemories, updateMemory } from "./services/memory";
import { listProwlDir, readProwlFile, writeProwlFile } from "./services/prowl-fs";
import {
  getChatConfig,
  getCompactExpandedHeight,
  getFocusMode,
  getSettings,
  setChatConfig,
  setFocusMode,
  setSettings,
} from "./services/settings";
import { registerGlobalShortcuts } from "./services/shortcuts";
import { refreshReminders } from "./services/task-reminder";
import {
  addDateTask,
  addTaskToBacklog,
  deleteBacklogTask,
  deleteTask,
  listBacklogTasks,
  listTasksByDateRange,
  listTasksByMonth,
  moveOverdueTasksToBacklog,
  scanDates,
  toggleBacklogComplete,
  toggleTaskComplete,
  updateBacklogTask,
  updateTask,
} from "./services/tasks";
import { checkForUpdates } from "./services/update-checker";
import {
  closeChatWindow,
  getChatWindow,
  getCompactWindow,
  getDashboardWindow,
  getSubWindow,
  popUpTrayMenu,
  resizeChatWindow,
  toggleCompactWindow,
  toggleExpandChatWindow,
} from "./windows";

/** Task Manager + 대시보드에 태스크 변경 알림 */
function notifyTasksChanged(): void {
  for (const win of [getCompactWindow(), getDashboardWindow()]) {
    if (win && !win.isDestroyed()) win.webContents.send("tasks:changed");
  }
}

/** 모든 창에 카테고리 변경 알림 */
function notifyCategoriesChanged(): void {
  for (const win of [getCompactWindow(), getDashboardWindow(), getChatWindow()]) {
    if (win && !win.isDestroyed()) win.webContents.send("categories:changed");
  }
}

/**
 * 타입 안전한 IPC 핸들러 등록
 *
 * IpcInvokeSchema에서 채널의 파라미터/반환 타입을 자동 추론한다.
 * 잘못된 채널명, 파라미터 타입, 반환 타입 사용 시 컴파일 에러 발생.
 * 모든 핸들러에 try/catch를 적용하여 에러가 숨겨지지 않도록 한다.
 */
function handleIpc<C extends IpcChannel>(
  channel: C,
  handler: (...args: IpcParams<C>) => Promise<IpcReturn<C>>,
): void {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return await handler(...(args as IpcParams<C>));
    } catch (error) {
      console.error(`[IPC] ${channel} failed:`, error);
      throw error;
    }
  });
}

/**
 * IPC 핸들러 등록
 */
export function registerIpcHandlers(): void {
  // 설정 조회
  handleIpc("settings:get", async () => {
    return getSettings();
  });

  // 설정 저장
  handleIpc("settings:set", async (settings) => {
    try {
      setSettings(settings);
      const shortcutResult = registerGlobalShortcuts(settings.shortcuts ?? DEFAULT_SHORTCUTS);
      if (!shortcutResult.success) {
        return { success: false, error: shortcutResult.error };
      }
      // 설정 변경 사항을 chat window에 즉시 알림
      const chatWin = getChatWindow();
      if (chatWin && !chatWin.isDestroyed()) {
        chatWin.webContents.send("settings:changed");
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Finder에서 파일 위치 보기
  handleIpc("shell:showInFolder", async (filePath) => {
    shell.showItemInFolder(filePath);
  });

  // 외부 URL 열기
  handleIpc("shell:openExternal", async (url) => {
    shell.openExternal(url);
  });

  // 집중 모드 조회
  handleIpc("focusMode:get", async () => {
    return getFocusMode();
  });

  // 집중 모드 설정 저장 + 모니터 업데이트
  handleIpc("focusMode:set", async (focusMode) => {
    try {
      setFocusMode(focusMode);
      updateFocusModeMonitor(focusMode);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 윈도우 높이 동적 조정
  handleIpc("window:resize", async (height) => {
    const win = getSubWindow();
    if (!win || win.isDestroyed()) return;
    const clampedHeight = Math.min(Math.max(height, 100), WINDOW.MAX_HEIGHT);
    const [width] = win.getSize();
    win.setSize(width, clampedHeight);
  });

  // 뒤로가기 (서브윈도우 숨기고 트레이 메뉴 팝업)
  handleIpc("nav:back", async () => {
    const win = getSubWindow();
    if (win && !win.isDestroyed()) {
      win.hide();
    }
    popUpTrayMenu();
  });

  // 앱 종료
  handleIpc("app:quit", async () => {
    app.quit();
  });

  // 채팅 메시지 스트리밍 전송 (fire-and-forget, main에서 저장)
  handleIpc("chat:send", async (roomId, content, history) => {
    const config = getChatConfig();
    streamChatMessage(roomId, content, history, config).catch((err) =>
      console.error("[IPC] chat:send stream error:", err),
    );
    return { success: true };
  });

  // 채팅 설정 조회
  handleIpc("chat:get-config", async () => {
    return getChatConfig();
  });

  // 채팅 설정 저장
  handleIpc("chat:set-config", async (config) => {
    try {
      setChatConfig(config);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 사용 가능한 프로바이더 목록 조회
  handleIpc("chat:providers", async () => {
    return getProviderStatuses();
  });

  // 채팅 윈도우 리사이즈
  handleIpc("chat:resize", async (height) => {
    resizeChatWindow(height);
  });

  // 채팅 윈도우 닫기
  handleIpc("chat:close", async () => {
    closeChatWindow();
  });

  // 채팅 윈도우 전체화면 토글 (isExpanded 반환)
  handleIpc("chat:expand-toggle", async () => {
    return toggleExpandChatWindow();
  });

  // 도구 실행 승인/거부
  handleIpc("chat:approve-tool", async (approvalId) => {
    const ok = resolveApproval(approvalId, true);
    return { success: ok };
  });

  handleIpc("chat:reject-tool", async (approvalId) => {
    const ok = resolveApproval(approvalId, false);
    return { success: ok };
  });

  // 페이지 컨텍스트 설정 (PreviewPanel webview 로드/언마운트 시)
  handleIpc("chat:set-page-context", async (context) => {
    try {
      setPageContext(context);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 앱 버전 조회
  handleIpc("app:version", async () => {
    return app.getVersion();
  });

  // 업데이트 확인
  handleIpc("app:check-update", async () => {
    return checkForUpdates();
  });

  // 업데이트 설치 (brew upgrade)
  handleIpc("app:install-update", async () => {
    return runBrewUpgrade();
  });

  // 앱 재시작
  handleIpc("app:relaunch", async () => {
    app.relaunch();
    app.quit();
  });

  // Task Manager 토글
  handleIpc("compact:toggle", async () => {
    try {
      toggleCompactWindow();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Task Manager 리사이즈
  handleIpc("compact:resize", async (height) => {
    const win = getCompactWindow();
    if (!win || win.isDestroyed()) return;
    const [width] = win.getSize();
    win.setSize(width, Math.round(height));
  });

  // Task Manager 저장된 확장 높이 조회
  handleIpc("compact:get-expanded-height", async () => {
    return getCompactExpandedHeight();
  });

  // 월 단위 태스크 조회
  handleIpc("tasks:list-month", async (year, month) => {
    moveOverdueTasksToBacklog();
    return listTasksByMonth(year, month);
  });

  // 날짜 범위 태스크 조회
  handleIpc("tasks:list-date-range", async (startDate, endDate) => {
    moveOverdueTasksToBacklog();
    return listTasksByDateRange(startDate, endDate);
  });

  // 태스크 수정
  handleIpc("tasks:update-task", async (date, task) => {
    try {
      updateTask(date, task);
      refreshReminders();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 태스크 완료 토글
  handleIpc("tasks:toggle-complete", async (date, taskId) => {
    try {
      toggleTaskComplete(date, taskId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 태스크 삭제
  handleIpc("tasks:delete-task", async (date, taskId) => {
    try {
      deleteTask(date, taskId);
      refreshReminders();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 태스크 추가
  handleIpc("tasks:add-task", async (date, task) => {
    try {
      addDateTask(date, task);
      refreshReminders();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 날짜 파일 목록 조회
  handleIpc("tasks:scan-dates", async () => {
    return scanDates();
  });

  // ── Backlog ──────────────────────────────────────────

  handleIpc("tasks:list-backlog", async () => {
    moveOverdueTasksToBacklog();
    return listBacklogTasks();
  });

  handleIpc("tasks:add-backlog", async (task) => {
    try {
      addTaskToBacklog(task);
      refreshReminders();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("tasks:update-backlog", async (task) => {
    try {
      updateBacklogTask(task);
      refreshReminders();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("tasks:toggle-backlog-complete", async (taskId) => {
    try {
      toggleBacklogComplete(taskId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("tasks:delete-backlog", async (taskId) => {
    try {
      deleteBacklogTask(taskId);
      refreshReminders();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ── Memory ──────────────────────────────────────────

  handleIpc("memory:list", async () => {
    return listMemories();
  });

  handleIpc("memory:add", async (content) => {
    try {
      addMemory(content);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("memory:update", async (id, content) => {
    try {
      updateMemory(id, content);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("memory:delete", async (id) => {
    try {
      deleteMemory(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ── Categories ──────────────────────────────────────

  handleIpc("categories:list", async () => {
    return listCategories();
  });

  handleIpc("categories:add", async (name) => {
    try {
      addCategory(name);
      notifyCategoriesChanged();
      notifyTasksChanged();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("categories:rename", async (oldName, newName) => {
    try {
      renameCategory(oldName, newName);
      notifyCategoriesChanged();
      notifyTasksChanged();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("categories:delete", async (name) => {
    try {
      deleteCategory(name);
      notifyCategoriesChanged();
      notifyTasksChanged();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ── Chat Rooms ──────────────────────────────────────

  handleIpc("chat-rooms:list", async () => listChatRooms());

  handleIpc("chat-rooms:get", async (roomId) => getChatRoom(roomId));

  handleIpc("chat-rooms:create", async (title) => createChatRoom(title));

  handleIpc("chat-rooms:delete", async (roomId) => {
    try {
      deleteChatRoom(roomId);
      removeRoomReadState(roomId);
      updateTrayBadge();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("chat-rooms:save-messages", async (roomId, messages) => {
    try {
      saveChatMessages(roomId, messages);
      updateTrayBadge();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("chat-rooms:mark-read", async (roomId, lastMessageId) => {
    try {
      markRoomAsRead(roomId, lastMessageId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("chat-rooms:unread-counts", async () => {
    return getAllUnreadCounts();
  });

  handleIpc("chat-rooms:toggle-lock", async (roomId) => {
    try {
      toggleChatRoomLock(roomId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("chat-rooms:toggle-favorite", async (roomId) => {
    try {
      toggleChatRoomFavorite(roomId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ── Prowl Files ──────────────────────────────────────

  handleIpc("prowl-files:list", async (relPath) => {
    return listProwlDir(relPath);
  });

  handleIpc("prowl-files:read", async (relPath) => {
    return readProwlFile(relPath);
  });

  handleIpc("prowl-files:write", async (relPath, content) => {
    try {
      writeProwlFile(relPath, content);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
