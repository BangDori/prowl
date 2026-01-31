import * as path from "node:path";
import { app, BrowserWindow, Menu, nativeImage, shell, Tray } from "electron";
import { DEV_SERVER_PORT, WINDOW } from "./constants";

let tray: Tray | null = null;
let subWindow: BrowserWindow | null = null;

const isDev = () => process.argv.includes("--dev") || process.env.ELECTRON_DEV === "true";

function getIndexUrl(): string {
  return isDev()
    ? `http://localhost:${DEV_SERVER_PORT}`
    : `file://${path.join(__dirname, "../renderer/index.html")}`;
}

/**
 * 서브페이지 BrowserWindow를 트레이 근처에 열기
 */
function showSubPage(hash: string): void {
  if (subWindow && !subWindow.isDestroyed()) {
    subWindow.loadURL(`${getIndexUrl()}#${hash}`);
    subWindow.show();
    return;
  }

  const trayBounds = tray?.getBounds();
  const x = trayBounds
    ? Math.round(trayBounds.x + trayBounds.width / 2 - WINDOW.WIDTH / 2)
    : undefined;
  const y = trayBounds ? trayBounds.y + trayBounds.height : undefined;

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
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  subWindow.loadURL(`${getIndexUrl()}#${hash}`);
  subWindow.once("ready-to-show", () => subWindow?.show());
  subWindow.on("blur", () => subWindow?.hide());
  subWindow.on("closed", () => {
    subWindow = null;
  });
}

/**
 * 트레이 아이콘 + 네이티브 메뉴 생성
 */
export function createTray(): Tray {
  const iconPath = path.join(__dirname, "../../assets/tray-iconTemplate.png");
  let icon = nativeImage.createEmpty();
  try {
    icon = nativeImage.createFromPath(iconPath);
    icon.setTemplateImage(true);
  } catch {
    console.log("Using default icon");
  }

  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip("Prowl");

  const menu = Menu.buildFromTemplate([
    {
      label: "백그라운드 모니터링",
      click: () => showSubPage("monitor"),
    },
    {
      label: "야간 감시",
      click: () => showSubPage("quiet-hours"),
    },
    { type: "separator" },
    {
      label: "GitHub 저장소 열기",
      click: () => shell.openExternal("https://github.com/BangDori/prowl"),
    },
    { type: "separator" },
    {
      label: "Prowl 종료",
      click: () => app.quit(),
    },
  ]);

  tray.on("click", () => {
    tray?.popUpContextMenu(menu);
  });

  tray.on("right-click", () => {
    tray?.popUpContextMenu(menu);
  });

  return tray;
}

export function getTray(): Tray | null {
  return tray;
}

export function getSubWindow(): BrowserWindow | null {
  return subWindow;
}
