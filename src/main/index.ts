/** Electron Main 프로세스 진입점 */

import { DEFAULT_SHORTCUTS } from "@shared/types";
import { app, globalShortcut } from "electron";
import { SPLASH } from "./constants";
import { registerIpcHandlers } from "./ipc";
import { applyNativeTheme, getSettings } from "./services/settings";
import { registerGlobalShortcuts } from "./services/shortcuts";
import { startTaskReminderScheduler } from "./services/task-reminder";
import { checkForUpdates } from "./services/update-checker";
import {
  createSplashWindow,
  createTray,
  dismissSplash,
  prewarmDashboardWindow,
  showDashboardWindow,
} from "./windows";

const isDev = process.argv.includes("--dev") || process.env.ELECTRON_DEV === "true";
const isE2E = process.env.E2E_TEST === "true";

// 단일 인스턴스 잠금
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // 앱 준비 완료 시
  app.on("ready", () => {
    // 저장된 테마 설정 적용
    applyNativeTheme(getSettings().theme);

    // IPC 핸들러 등록
    registerIpcHandlers();

    // 일정 알림 스케줄러 시작
    startTaskReminderScheduler();

    if (isE2E) {
      // E2E 모드: 트레이 없이 대시보드 창 직접 표시
      showDashboardWindow();
    } else if (isDev) {
      // 개발 모드: 스플래시 건너뛰고 바로 트레이 생성
      createTray();
      registerGlobalShortcuts(getSettings().shortcuts ?? DEFAULT_SHORTCUTS);
      // 대시보드 창 백그라운드 프리워밍 — 첫 진입 시 즉시 표시
      prewarmDashboardWindow();
    } else {
      // 프로덕션: 스플래시 표시하는 동안 대시보드 백그라운드 로드
      createSplashWindow();
      prewarmDashboardWindow();
      setTimeout(async () => {
        await dismissSplash();
        createTray();
        registerGlobalShortcuts(getSettings().shortcuts ?? DEFAULT_SHORTCUTS);
      }, SPLASH.DISPLAY_DURATION_MS);
    }
  });

  // 시작 시 업데이트 자동 체크 (5초 지연, brew 경로 캐시 워밍)
  setTimeout(() => {
    checkForUpdates().catch((err) => console.error("[Update] Startup check failed:", err));
  }, 5000);

  app.on("will-quit", () => {
    globalShortcut.unregisterAll();
  });

  // 모든 창이 닫혀도 앱 종료하지 않음 (메뉴바 앱이므로)
  app.on("window-all-closed", () => {
    // macOS에서는 메뉴바 앱이 창 없이도 동작
  });

  // macOS: Dock 아이콘 숨기기
  if (process.platform === "darwin") {
    app.dock?.hide();
  }

  // 두 번째 인스턴스 실행 시 기존 창 표시
  app.on("second-instance", () => {
    // 이미 실행 중이면 트레이 메뉴 표시
  });
}
