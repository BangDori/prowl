/** 시스템 트레이 아이콘 및 메뉴 관리 */
import * as path from "node:path";
import { app, BrowserWindow, Menu, nativeImage, screen, shell, Tray } from "electron";
import { DEV_SERVER_PORT, WINDOW } from "../constants";
import { showChatWindow } from "./chat-window";
import { showDashboardWindow } from "./dashboard-window";

let tray: Tray | null = null;
let subWindow: BrowserWindow | null = null;

const isDev = () => process.argv.includes("--dev") || process.env.ELECTRON_DEV === "true";

function getIndexUrl(): string {
  return isDev()
    ? `http://localhost:${DEV_SERVER_PORT}`
    : `file://${path.join(__dirname, "../../renderer/index.html")}`;
}

/**
 * 커서가 있는 디스플레이 기준으로 서브윈도우 위치 계산
 * - 트레이 아이콘이 같은 디스플레이에 있으면 트레이 아래에 표시
 * - 다른 디스플레이면 해당 디스플레이 상단 중앙에 표시
 */
function calcSubWindowPosition(): { x: number; y: number } {
  const cursor = screen.getCursorScreenPoint();
  const cursorDisplay = screen.getDisplayNearestPoint(cursor);
  const trayBounds = tray?.getBounds();

  if (trayBounds) {
    const trayCenter = {
      x: trayBounds.x + trayBounds.width / 2,
      y: trayBounds.y + trayBounds.height / 2,
    };
    const trayDisplay = screen.getDisplayNearestPoint(trayCenter);

    if (trayDisplay.id === cursorDisplay.id) {
      return {
        x: Math.round(trayBounds.x + trayBounds.width / 2 - WINDOW.WIDTH / 2),
        y: trayBounds.y + trayBounds.height,
      };
    }
  }

  const { x: dx, y: dy, width: dw } = cursorDisplay.workArea;
  return {
    x: Math.round(dx + dw / 2 - WINDOW.WIDTH / 2),
    y: dy,
  };
}

/**
 * 서브페이지 BrowserWindow를 활성 디스플레이에 열기
 */
function showSubPage(hash: string): void {
  if (subWindow && !subWindow.isDestroyed()) {
    const pos = calcSubWindowPosition();
    subWindow.setPosition(pos.x, pos.y);
    subWindow.loadURL(`${getIndexUrl()}#${hash}`);
    subWindow.setOpacity(1);
    subWindow.setIgnoreMouseEvents(false);
    subWindow.focus();
    return;
  }

  const { x, y } = calcSubWindowPosition();

  subWindow = new BrowserWindow({
    width: WINDOW.WIDTH,
    height: WINDOW.HEIGHT,
    x,
    y,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "../../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  subWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
    skipTransformProcessType: true,
  });
  subWindow.loadURL(`${getIndexUrl()}#${hash}`);
  subWindow.once("ready-to-show", () => subWindow?.show());
  subWindow.on("blur", () => {
    setTimeout(() => {
      if (subWindow && !subWindow.isDestroyed() && !subWindow.isFocused()) {
        subWindow.setOpacity(0);
        subWindow.setIgnoreMouseEvents(true);
      }
    }, 200);
  });
  subWindow.on("closed", () => {
    subWindow = null;
  });
}

/**
 * 메뉴 아이콘 로드 헬퍼
 */
function loadMenuIcon(name: string): Electron.NativeImage {
  const iconPath = path.join(__dirname, `../../../assets/menu-icons/${name}Template.png`);
  try {
    const icon = nativeImage.createFromPath(iconPath);
    icon.setTemplateImage(true);
    return icon;
  } catch {
    return nativeImage.createEmpty();
  }
}

/**
 * 트레이 아이콘 + 네이티브 메뉴 생성
 */
export function createTray(): Tray {
  const iconPath = path.join(__dirname, "../../../assets/tray-iconTemplate.png");
  let icon = nativeImage.createEmpty();
  try {
    icon = nativeImage.createFromPath(iconPath);
    icon.setTemplateImage(true);
  } catch {
    console.log("Using default icon");
  }

  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip("Prowl");

  tray.on("click", () => {
    popUpTrayMenu();
  });

  tray.on("right-click", () => {
    popUpTrayMenu();
  });

  return tray;
}

export function popUpTrayMenu(): void {
  if (!tray) return;

  const menu = Menu.buildFromTemplate([
    {
      label: "Go to Dashboard",
      icon: loadMenuIcon("layout-dashboard"),
      click: () => showDashboardWindow(),
    },
    { type: "separator" },
    {
      label: "Background Monitor",
      icon: loadMenuIcon("monitor"),
      click: () => showSubPage("monitor"),
    },
    {
      label: "Prowl Chat",
      icon: loadMenuIcon("message-circle"),
      accelerator: "CommandOrControl+Shift+P",
      click: () => showChatWindow(),
    },
    { type: "separator" },
    {
      label: "Open GitHub Repository",
      icon: loadMenuIcon("github"),
      click: () => shell.openExternal("https://github.com/BangDori/prowl"),
    },
    { type: "separator" },
    {
      label: "Quit Prowl",
      icon: loadMenuIcon("power"),
      click: () => app.quit(),
    },
  ]);

  tray.popUpContextMenu(menu);
}

export function getTray(): Tray | null {
  return tray;
}

export function getSubWindow(): BrowserWindow | null {
  return subWindow;
}
