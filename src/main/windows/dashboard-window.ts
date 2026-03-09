/** 대시보드 BrowserWindow 생성 및 관리 */
import * as path from "node:path";
import { app, BrowserWindow, screen } from "electron";
import { DASHBOARD, DEV_SERVER_PORT } from "../constants";

let dashboardWindow: BrowserWindow | null = null;
let forceClose = false;
/** ready-to-show 이후 true — show() 안전 호출 여부 판단 */
let isReady = false;
/** prewarm 중 showDashboardWindow() 호출 시 ready 되면 바로 표시 */
let pendingShow = false;

// 앱 종료 시 창을 실제로 닫을 수 있도록 플래그 설정
app.on("before-quit", () => {
  forceClose = true;
});

const isDev = () => process.argv.includes("--dev") || process.env.ELECTRON_DEV === "true";

function getIndexUrl(): string {
  return isDev()
    ? `http://localhost:${DEV_SERVER_PORT}`
    : `file://${path.join(__dirname, "../../renderer/index.html")}`;
}

function createDashboardWindow(): void {
  isReady = false;

  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const { x: dispX, y: dispY } = display.bounds;
  const { width: fullW, height: fullH } = display.size;

  const x = dispX + Math.round((fullW - DASHBOARD.WIDTH) / 2);
  const y = dispY + Math.round((fullH - DASHBOARD.HEIGHT) / 2);

  dashboardWindow = new BrowserWindow({
    width: DASHBOARD.WIDTH,
    height: DASHBOARD.HEIGHT,
    minWidth: DASHBOARD.MIN_WIDTH,
    minHeight: DASHBOARD.MIN_HEIGHT,
    x,
    y,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: true,
    fullscreenable: true,
    show: false,
    frame: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 12, y: 12 },
    vibrancy: "under-window",
    visualEffectState: "active",
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "../../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  dashboardWindow.loadURL(`${getIndexUrl()}#dashboard`);

  dashboardWindow.once("ready-to-show", () => {
    isReady = true;
    if (pendingShow) {
      pendingShow = false;
      dashboardWindow?.show();
      dashboardWindow?.focus();
      dashboardWindow?.webContents.send("window:show");
    }
  });

  // 빨간 버튼(⌘W) 클릭 시 창을 파괴하지 않고 숨김 — 재진입 시 즉시 표시
  dashboardWindow.on("close", (e) => {
    if (!forceClose) {
      e.preventDefault();
      dashboardWindow?.hide();
    }
  });

  dashboardWindow.on("closed", () => {
    dashboardWindow = null;
    isReady = false;
  });
}

/**
 * 앱 시작 시 대시보드 창을 백그라운드에서 미리 로드.
 * 첫 번째 showDashboardWindow() 호출 시 즉시 표시 가능.
 */
export function prewarmDashboardWindow(): void {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) return;
  forceClose = false;
  pendingShow = false;
  createDashboardWindow();
}

export function showDashboardWindow(): void {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    if (isReady) {
      dashboardWindow.show();
      dashboardWindow.focus();
      dashboardWindow.webContents.send("window:show");
    } else {
      // prewarm 진행 중 — ready-to-show 후 자동 표시
      pendingShow = true;
    }
    return;
  }

  forceClose = false;
  pendingShow = true;
  createDashboardWindow();
}

export function closeDashboardWindow(): void {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.hide();
  }
}

export function toggleDashboardWindow(): void {
  if (dashboardWindow && !dashboardWindow.isDestroyed() && dashboardWindow.isVisible()) {
    dashboardWindow.hide();
  } else {
    showDashboardWindow();
  }
}

export function getDashboardWindow(): BrowserWindow | null {
  return dashboardWindow;
}
