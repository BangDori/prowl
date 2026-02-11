/** 채팅 BrowserWindow 생성 및 관리 */
import * as path from "node:path";
import { BrowserWindow, screen } from "electron";
import { CHAT_WINDOW, DEV_SERVER_PORT } from "../constants";

let chatWindow: BrowserWindow | null = null;

const isDev = () => process.argv.includes("--dev") || process.env.ELECTRON_DEV === "true";

function getIndexUrl(): string {
  return isDev()
    ? `http://localhost:${DEV_SERVER_PORT}`
    : `file://${path.join(__dirname, "../../renderer/index.html")}`;
}

export function showChatWindow(): void {
  // 커서가 있는 디스플레이 기준, 가로 중앙 + 하단 배치
  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const { x: dispX, y: dispY } = display.bounds;
  const { width: fullW, height: fullH } = display.size;

  const x = dispX + Math.round((fullW - CHAT_WINDOW.WIDTH) / 2);
  const y = dispY + fullH - CHAT_WINDOW.EXPANDED_HEIGHT - CHAT_WINDOW.BOTTOM_MARGIN;

  if (chatWindow && !chatWindow.isDestroyed()) {
    chatWindow.setPosition(x, y);
    chatWindow.setOpacity(1);
    chatWindow.setIgnoreMouseEvents(false);
    chatWindow.focus();
    return;
  }

  chatWindow = new BrowserWindow({
    width: CHAT_WINDOW.WIDTH,
    height: CHAT_WINDOW.EXPANDED_HEIGHT,
    x,
    y,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "../../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  chatWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
    skipTransformProcessType: true,
  });
  chatWindow.loadURL(`${getIndexUrl()}#chat`);
  chatWindow.once("ready-to-show", () => chatWindow?.show());
  chatWindow.on("closed", () => {
    chatWindow = null;
  });
}

export function closeChatWindow(): void {
  if (!chatWindow || chatWindow.isDestroyed()) return;
  chatWindow.setOpacity(0);
  chatWindow.setIgnoreMouseEvents(true);
}

export function getChatWindow(): BrowserWindow | null {
  return chatWindow;
}

export function resizeChatWindow(height: number): void {
  if (!chatWindow || chatWindow.isDestroyed()) return;

  const clamped = Math.min(Math.max(height, CHAT_WINDOW.INPUT_HEIGHT), CHAT_WINDOW.EXPANDED_HEIGHT);
  const [currentW, currentH] = chatWindow.getSize();
  const [currentX, currentY] = chatWindow.getPosition();

  // 윈도우 하단 위치를 유지하면서 높이만 변경
  const newY = currentY + (currentH - clamped);

  chatWindow.setBounds({ x: currentX, y: newY, width: currentW, height: clamped });
}
