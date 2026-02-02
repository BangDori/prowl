import { app } from "electron";
import { SPLASH } from "./constants";
import { registerIpcHandlers } from "./ipc";
import { updateFocusModeMonitor } from "./services/focus-mode";
import { getFocusMode } from "./services/settings";
import { createSplashWindow, dismissSplash } from "./splash";
import { createTray } from "./tray";

const isDev = process.argv.includes("--dev") || process.env.ELECTRON_DEV === "true";

// 단일 인스턴스 잠금
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // 앱 준비 완료 시
  app.on("ready", () => {
    // IPC 핸들러 등록
    registerIpcHandlers();

    if (isDev) {
      // 개발 모드: 스플래시 건너뛰고 바로 트레이 생성
      createTray();
      updateFocusModeMonitor(getFocusMode());
    } else {
      // 프로덕션: 스플래시 윈도우 표시 후 트레이 전환
      createSplashWindow();
      setTimeout(async () => {
        await dismissSplash();
        createTray();
        updateFocusModeMonitor(getFocusMode());
      }, SPLASH.DISPLAY_DURATION_MS);
    }
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
