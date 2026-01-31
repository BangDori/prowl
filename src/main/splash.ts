import { BrowserWindow, screen } from "electron";
import * as path from "path";
import { SPLASH } from "./constants";

let splashWindow: BrowserWindow | null = null;

export function createSplashWindow(): BrowserWindow {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;

  splashWindow = new BrowserWindow({
    width: SPLASH.WIDTH,
    height: SPLASH.HEIGHT,
    x: Math.round(screenWidth / 2 - SPLASH.WIDTH / 2),
    y: Math.round(screen.getPrimaryDisplay().workAreaSize.height / 2 - SPLASH.HEIGHT / 2),
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const splashPath = path.join(__dirname, "../../splash.html");
  splashWindow.loadFile(splashPath);

  splashWindow.once("ready-to-show", () => {
    splashWindow?.show();
  });

  return splashWindow;
}

/**
 * 스플래시 윈도우를 바람에 흩날리는 파티클로 디졸브하며 닫기
 */
export function dismissSplash(): Promise<void> {
  return new Promise((resolve) => {
    if (!splashWindow || splashWindow.isDestroyed()) {
      resolve();
      return;
    }

    const win = splashWindow;

    // renderer에서 dissolve() 호출 → 파티클 애니메이션 시작
    win.webContents.executeJavaScript("dissolve()").catch(() => {});

    // 파티클 애니메이션 완료 후 윈도우 닫기
    setTimeout(() => {
      if (!win.isDestroyed()) {
        try {
          win.close();
        } catch {
          // ignore
        }
      }
      splashWindow = null;
      resolve();
    }, SPLASH.DISSOLVE_DURATION_MS);
  });
}

export function getSplashWindow(): BrowserWindow | null {
  return splashWindow;
}
