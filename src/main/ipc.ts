/** IPC 채널 핸들러 등록 및 라우팅 */
import { app, shell } from "electron";
import { DEFAULT_SHORTCUTS } from "../shared/types";
import { WINDOW } from "./constants";
import { registerChatHandlers } from "./ipc-chat";
import { registerDataHandlers } from "./ipc-data";
import { registerTaskHandlers } from "./ipc-tasks";
import { handleIpc } from "./ipc-utils";
import { runBrewUpgrade } from "./services/brew-updater";
import { updateFocusModeMonitor } from "./services/focus-mode";
import {
  getCompactExpandedHeight,
  getFocusMode,
  getSettings,
  setFocusMode,
  setSettings,
} from "./services/settings";
import { registerGlobalShortcuts } from "./services/shortcuts";
import { checkForUpdates } from "./services/update-checker";
import {
  getChatWindow,
  getCompactWindow,
  getSubWindow,
  popUpTrayMenu,
  toggleCompactWindow,
} from "./windows";

/** IPC 핸들러 등록 */
export function registerIpcHandlers(): void {
  registerTaskHandlers();
  registerChatHandlers();
  registerDataHandlers();

  // 설정 조회
  handleIpc("settings:get", async () => {
    return getSettings();
  });

  // 설정 저장
  handleIpc("settings:set", async (settings) => {
    try {
      // favoritedRoomIds는 chat-rooms:toggle-favorite 전용 — Dashboard(별도 renderer)의
      // stale 캐시가 덮어쓰지 않도록 항상 현재 저장된 값을 유지한다.
      const current = getSettings();
      setSettings({ ...settings, favoritedRoomIds: current.favoritedRoomIds });
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
  handleIpc("shell:show-in-folder", async (filePath) => {
    shell.showItemInFolder(filePath);
  });

  // 외부 URL 열기
  handleIpc("shell:open-external", async (url) => {
    shell.openExternal(url);
  });

  // 집중 모드 조회
  handleIpc("focus-mode:get", async () => {
    return getFocusMode();
  });

  // 집중 모드 설정 저장 + 모니터 업데이트
  handleIpc("focus-mode:set", async (focusMode) => {
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
}
