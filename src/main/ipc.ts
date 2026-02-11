import { app, ipcMain, shell } from "electron";
import type { IpcChannel, IpcParams, IpcReturn } from "../shared/ipc-schema";
import { LOG_LINES_DEFAULT, WINDOW } from "./constants";
import {
  addLocalEvent,
  deleteLocalEvent,
  fetchCalendarEvents,
  getCalendarSettings,
  getLocalEvents,
  setCalendarSettings,
  updateLocalEvent,
} from "./services/calendar";
import { sendChatMessage } from "./services/chat";
import { getClaudeConfig, getFileContent } from "./services/claude-config";
import { refreshReminders } from "./services/event-reminder";
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
import { checkForUpdates } from "./services/update-checker";
import { closeChatWindow, getSubWindow, popUpTrayMenu, resizeChatWindow } from "./windows";

/**
 * 타입 안전한 IPC 핸들러 등록
 *
 * IpcInvokeSchema에서 채널의 파라미터/반환 타입을 자동 추론한다.
 * 잘못된 채널명, 파라미터 타입, 반환 타입 사용 시 컴파일 에러 발생.
 */
function handleIpc<C extends IpcChannel>(
  channel: C,
  handler: (...args: IpcParams<C>) => Promise<IpcReturn<C>>,
): void {
  ipcMain.handle(channel, (_event, ...args) => handler(...(args as IpcParams<C>)));
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
    setSettings(settings);
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
    setJobCustomization(jobId, customization);
  });

  // 집중 모드 조회
  handleIpc("focusMode:get", async () => {
    return getFocusMode();
  });

  // 집중 모드 설정 저장 + 모니터 업데이트
  handleIpc("focusMode:set", async (focusMode) => {
    setFocusMode(focusMode);
    updateFocusModeMonitor(focusMode);
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

  // 캘린더 이벤트 조회
  handleIpc("calendar:list-events", async () => {
    return fetchCalendarEvents();
  });

  // 캘린더 설정 조회
  handleIpc("calendar:get-settings", async () => {
    return getCalendarSettings();
  });

  // 캘린더 설정 저장
  handleIpc("calendar:set-settings", async (settings) => {
    setCalendarSettings(settings);
  });

  // 로컬 이벤트 목록 조회
  handleIpc("calendar:local-events", async () => {
    return getLocalEvents();
  });

  // 로컬 이벤트 추가
  handleIpc("calendar:add-local-event", async (localEvent) => {
    addLocalEvent(localEvent);
    refreshReminders();
  });

  // 로컬 이벤트 수정
  handleIpc("calendar:update-local-event", async (localEvent) => {
    updateLocalEvent(localEvent);
    refreshReminders();
  });

  // 로컬 이벤트 삭제
  handleIpc("calendar:delete-local-event", async (eventId) => {
    deleteLocalEvent(eventId);
    refreshReminders();
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
