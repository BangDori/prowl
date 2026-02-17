/** IPC 채널 핸들러 등록 및 라우팅 */
import { app, ipcMain, shell } from "electron";
import type { IpcChannel, IpcParams, IpcReturn } from "../shared/ipc-schema";
import { LOG_LINES_DEFAULT, WINDOW } from "./constants";
import { runBrewUpgrade } from "./services/brew-updater";
import { sendChatMessage } from "./services/chat";
import { getClaudeConfig, getFileContent } from "./services/claude-config";
import { updateFocusModeMonitor } from "./services/focus-mode";
import { getRunningJobIds, isJobRunning, startMonitoringJob } from "./services/job-monitor";
import { findJobById, listAllJobs, startJob, toggleJob } from "./services/launchd";
import { readLogContent } from "./services/log-reader";
import {
  getAllJobCustomizations,
  getFocusMode,
  getSettings,
  setFocusMode,
  setJobCustomization,
  setSettings,
} from "./services/settings";
import { refreshReminders } from "./services/task-reminder";
import {
  addTaskToBacklog,
  deleteBacklogTask,
  deleteTask,
  listBacklogTasks,
  listTasksByDateRange,
  listTasksByMonth,
  scanDates,
  toggleBacklogComplete,
  toggleTaskComplete,
  updateBacklogTask,
  updateTask,
} from "./services/tasks";
import { checkForUpdates } from "./services/update-checker";
import {
  closeChatWindow,
  getCompactWindow,
  getSubWindow,
  popUpTrayMenu,
  resizeChatWindow,
  toggleCompactWindow,
} from "./windows";

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
  // 작업 목록 조회
  handleIpc("jobs:list", async () => {
    return listAllJobs();
  });

  // 작업 목록 새로고침 (list와 동일하지만 명시적)
  handleIpc("jobs:refresh", async () => {
    return listAllJobs();
  });

  // 작업 토글 (활성화/비활성화)
  handleIpc("jobs:toggle", async (jobId) => {
    const job = findJobById(jobId);
    if (!job) {
      return { success: false, message: "작업을 찾을 수 없습니다." };
    }
    return toggleJob(job.plistPath, job.label);
  });

  // 작업 수동 실행
  handleIpc("jobs:run", async (jobId) => {
    const job = findJobById(jobId);
    if (!job) {
      return { success: false, message: "작업을 찾을 수 없습니다." };
    }
    if (!job.isLoaded) {
      return {
        success: false,
        message: "작업이 비활성화 상태입니다. 먼저 활성화해주세요.",
      };
    }
    if (isJobRunning(jobId)) {
      return {
        success: false,
        message: "작업이 이미 실행 중입니다.",
      };
    }
    const result = startJob(job.label);

    // Job 완료 모니터링 시작 (알림용)
    if (result.success) {
      startMonitoringJob(job.id, job.name, job.logPath);
    }

    return result;
  });

  // 실행 중인 작업 ID 목록 조회
  handleIpc("jobs:running", async () => {
    return getRunningJobIds();
  });

  // 로그 조회
  handleIpc("jobs:logs", async (jobId, lines = LOG_LINES_DEFAULT) => {
    const job = findJobById(jobId);
    if (!job) {
      return {
        content: "작업을 찾을 수 없습니다.",
        lastModified: null,
      };
    }
    if (!job.logPath) {
      return {
        content: "이 작업은 로그 파일이 설정되지 않았습니다.",
        lastModified: null,
      };
    }
    return readLogContent(job.logPath, lines);
  });

  // 설정 조회
  handleIpc("settings:get", async () => {
    return getSettings();
  });

  // 설정 저장
  handleIpc("settings:set", async (settings) => {
    try {
      setSettings(settings);
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

  // 모든 작업 커스터마이징 조회
  handleIpc("jobs:getCustomizations", async () => {
    return getAllJobCustomizations();
  });

  // 작업 커스터마이징 저장
  handleIpc("jobs:setCustomization", async (jobId, customization) => {
    try {
      setJobCustomization(jobId, customization);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
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

  // 채팅 메시지 전송
  handleIpc("chat:send", async (content, history) => {
    return sendChatMessage(content, history);
  });

  // 채팅 윈도우 리사이즈
  handleIpc("chat:resize", async (height) => {
    resizeChatWindow(height);
  });

  // 채팅 윈도우 닫기
  handleIpc("chat:close", async () => {
    closeChatWindow();
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

  // 월 단위 태스크 조회
  handleIpc("tasks:list-month", async (year, month) => {
    return listTasksByMonth(year, month);
  });

  // 날짜 범위 태스크 조회
  handleIpc("tasks:list-date-range", async (startDate, endDate) => {
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

  // 날짜 파일 목록 조회
  handleIpc("tasks:scan-dates", async () => {
    return scanDates();
  });

  // ── Backlog ──────────────────────────────────────────

  handleIpc("tasks:list-backlog", async () => {
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

  // Claude Config 조회
  handleIpc("claude-config:list", async () => {
    return getClaudeConfig();
  });

  // 파일 내용 조회
  handleIpc("claude-config:read-file", async (filePath) => {
    return getFileContent(filePath);
  });
}
