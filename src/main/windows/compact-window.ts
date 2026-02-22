/** Task Manager Sticky BrowserWindow 생성 및 관리 */
import * as path from "node:path";
import { BrowserWindow, screen } from "electron";
import { COMPACT, DEV_SERVER_PORT } from "../constants";
import { getCompactExpandedHeight, saveCompactExpandedHeight } from "../services/settings";

let compactWindow: BrowserWindow | null = null;

const isDev = () => process.argv.includes("--dev") || process.env.ELECTRON_DEV === "true";

function getIndexUrl(): string {
  return isDev()
    ? `http://localhost:${DEV_SERVER_PORT}`
    : `file://${path.join(__dirname, "../../renderer/index.html")}`;
}

export function showCompactWindow(): void {
  if (compactWindow && !compactWindow.isDestroyed()) {
    compactWindow.show();
    compactWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true,
    });
    compactWindow.focus();
    return;
  }

  const cursor = screen.getCursorScreenPoint();
  const { workArea } = screen.getDisplayNearestPoint(cursor);
  const x = workArea.x + COMPACT.MARGIN;
  const y = workArea.y + COMPACT.MARGIN;

  compactWindow = new BrowserWindow({
    width: COMPACT.WIDTH,
    height: getCompactExpandedHeight(),
    x,
    y,
    resizable: true,
    minWidth: COMPACT.WIDTH,
    maxWidth: COMPACT.WIDTH,
    minHeight: COMPACT.HEADER_HEIGHT,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    frame: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: -20, y: -20 },
    vibrancy: "under-window",
    visualEffectState: "active",
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "../../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  compactWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
    skipTransformProcessType: true,
  });

  compactWindow.loadURL(`${getIndexUrl()}#compact`);
  compactWindow.once("ready-to-show", () => compactWindow?.show());
  compactWindow.on("closed", () => {
    compactWindow = null;
  });

  // 사용자가 창 높이를 드래그로 변경할 때 저장 (최소화 높이 제외)
  compactWindow.on("resize", () => {
    const win = compactWindow;
    if (!win || win.isDestroyed()) return;
    const [, h] = win.getSize();
    if (h > 50) saveCompactExpandedHeight(h);
  });
}

export function hideCompactWindow(): void {
  if (compactWindow && !compactWindow.isDestroyed()) {
    compactWindow.hide();
  }
}

export function toggleCompactWindow(): void {
  if (compactWindow && !compactWindow.isDestroyed() && compactWindow.isVisible()) {
    hideCompactWindow();
  } else {
    showCompactWindow();
  }
}

export function isCompactVisible(): boolean {
  return compactWindow !== null && !compactWindow.isDestroyed() && compactWindow.isVisible();
}

export function getCompactWindow(): BrowserWindow | null {
  return compactWindow;
}
