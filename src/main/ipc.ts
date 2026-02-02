import { app, ipcMain, shell } from "electron";
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
import { LOG_LINES_DEFAULT, WINDOW } from "./constants";
import { sendChatMessage } from "./services/chat";
import { updateFocusModeMonitor } from "./services/focus-mode";
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

/**
 * IPC 핸들러 등록
 */
export function registerIpcHandlers(): void {
  // 작업 목록 조회
  ipcMain.handle("jobs:list", async (): Promise<LaunchdJob[]> => {
    return listAllJobs();
  });

  // 작업 목록 새로고침 (list와 동일하지만 명시적)
  ipcMain.handle("jobs:refresh", async (): Promise<LaunchdJob[]> => {
    return listAllJobs();
  });

  // 작업 토글 (활성화/비활성화)
  ipcMain.handle("jobs:toggle", async (_event, jobId: string): Promise<JobActionResult> => {
    const job = findJobById(jobId);
    if (!job) {
      return { success: false, message: "작업을 찾을 수 없습니다." };
    }
    return toggleJob(job.plistPath, job.label);
  });

  // 작업 수동 실행
  ipcMain.handle("jobs:run", async (_event, jobId: string): Promise<JobActionResult> => {
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
    return startJob(job.label);
  });

  // 로그 조회
  ipcMain.handle(
    "jobs:logs",
    async (_event, jobId: string, lines: number = LOG_LINES_DEFAULT): Promise<LogContent> => {
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
    },
  );

  // 설정 조회
  ipcMain.handle("settings:get", async (): Promise<AppSettings> => {
    return getSettings();
  });

  // 설정 저장
  ipcMain.handle("settings:set", async (_event, settings: AppSettings): Promise<void> => {
    setSettings(settings);
  });

  // Finder에서 파일 위치 보기
  ipcMain.handle("shell:showInFolder", async (_event, filePath: string): Promise<void> => {
    shell.showItemInFolder(filePath);
  });

  // 외부 URL 열기
  ipcMain.handle("shell:openExternal", async (_event, url: string): Promise<void> => {
    shell.openExternal(url);
  });

  // 모든 작업 커스터마이징 조회
  ipcMain.handle("jobs:getCustomizations", async (): Promise<JobCustomizations> => {
    return getAllJobCustomizations();
  });

  // 작업 커스터마이징 저장
  ipcMain.handle(
    "jobs:setCustomization",
    async (_event, jobId: string, customization: JobCustomization): Promise<void> => {
      setJobCustomization(jobId, customization);
    },
  );

  // 집중 모드 조회
  ipcMain.handle("focusMode:get", async (): Promise<FocusMode> => {
    return getFocusMode();
  });

  // 집중 모드 설정 저장 + 모니터 업데이트
  ipcMain.handle("focusMode:set", async (_event, focusMode: FocusMode): Promise<void> => {
    setFocusMode(focusMode);
    updateFocusModeMonitor(focusMode);
  });

  // 윈도우 높이 동적 조정
  ipcMain.handle("window:resize", async (_event, height: number): Promise<void> => {
    const { getSubWindow } = await import("./tray");
    const win = getSubWindow();
    if (!win || win.isDestroyed()) return;
    const clampedHeight = Math.min(Math.max(height, 100), WINDOW.MAX_HEIGHT);
    const [width] = win.getSize();
    win.setSize(width, clampedHeight);
  });

  // 뒤로가기 (서브윈도우 숨기고 트레이 메뉴 팝업)
  ipcMain.handle("nav:back", async (): Promise<void> => {
    const { getSubWindow, popUpTrayMenu } = await import("./tray");
    const win = getSubWindow();
    if (win && !win.isDestroyed()) {
      win.hide();
    }
    popUpTrayMenu();
  });

  // 앱 종료
  ipcMain.handle("app:quit", async (): Promise<void> => {
    app.quit();
  });

  // 채팅 메시지 전송
  ipcMain.handle(
    "chat:send",
    async (_event, content: string, history: ChatMessage[]): Promise<ChatSendResult> => {
      return sendChatMessage(content, history);
    },
  );

  // 채팅 윈도우 리사이즈
  ipcMain.handle("chat:resize", async (_event, height: number): Promise<void> => {
    const { resizeChatWindow } = await import("./chat-window");
    resizeChatWindow(height);
  });

  // 채팅 윈도우 닫기
  ipcMain.handle("chat:close", async (): Promise<void> => {
    const { closeChatWindow } = await import("./chat-window");
    closeChatWindow();
  });
}
