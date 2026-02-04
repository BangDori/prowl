import * as path from "node:path";
import { BrowserWindow, screen } from "electron";
import { DASHBOARD, DEV_SERVER_PORT } from "../constants";

let dashboardWindow: BrowserWindow | null = null;

const isDev = () => process.argv.includes("--dev") || process.env.ELECTRON_DEV === "true";

function getIndexUrl(): string {
  return isDev()
    ? `http://localhost:${DEV_SERVER_PORT}`
    : `file://${path.join(__dirname, "../../renderer/index.html")}`;
}

export function showDashboardWindow(): void {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.focus();
    return;
  }

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
    vibrancy: "sidebar",
    webPreferences: {
      preload: path.join(__dirname, "../../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  dashboardWindow.loadURL(`${getIndexUrl()}#dashboard`);
  dashboardWindow.once("ready-to-show", () => dashboardWindow?.show());
  dashboardWindow.on("closed", () => {
    dashboardWindow = null;
  });
}

export function closeDashboardWindow(): void {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.close();
  }
}

export function getDashboardWindow(): BrowserWindow | null {
  return dashboardWindow;
}
