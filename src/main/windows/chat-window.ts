/** 채팅 BrowserWindow 생성 및 관리 */
import * as path from "node:path";
import { BrowserWindow, screen } from "electron";
import { CHAT_WINDOW, DEV_SERVER_PORT } from "../constants";

let chatWindow: BrowserWindow | null = null;
let isExpanded = false;
let savedBounds: import("electron").Rectangle | null = null;

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
    // 전체화면 상태라면 기본 크기로 복귀, renderer에 상태 동기화 이벤트 전송
    if (isExpanded) {
      isExpanded = false;
      savedBounds = null;
      chatWindow.setMovable(true);
      chatWindow.setSize(CHAT_WINDOW.WIDTH, CHAT_WINDOW.EXPANDED_HEIGHT);
      chatWindow.webContents.send("chat:expand-reset");
    }
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
    isExpanded = false;
    savedBounds = null;
  });
}

export function toggleChatWindow(): void {
  if (chatWindow && !chatWindow.isDestroyed() && chatWindow.getOpacity() > 0) {
    closeChatWindow();
  } else {
    showChatWindow();
  }
}

export function closeChatWindow(): void {
  if (!chatWindow || chatWindow.isDestroyed()) return;
  chatWindow.setOpacity(0);
  chatWindow.setIgnoreMouseEvents(true);
}

export function getChatWindow(): BrowserWindow | null {
  return chatWindow;
}

/** 채팅 윈도우가 보이고 포커스된 상태인지 확인 */
export function isChatWindowActive(): boolean {
  if (!chatWindow || chatWindow.isDestroyed()) return false;
  return chatWindow.getOpacity() > 0 && chatWindow.isFocused();
}

export function resizeChatWindow(height: number): void {
  if (!chatWindow || chatWindow.isDestroyed()) return;
  if (isExpanded) return; // 전체화면 상태에서는 리사이즈 무시

  const clamped = Math.min(Math.max(height, CHAT_WINDOW.INPUT_HEIGHT), CHAT_WINDOW.EXPANDED_HEIGHT);
  const [currentW, currentH] = chatWindow.getSize();
  const [currentX, currentY] = chatWindow.getPosition();

  // 윈도우 하단 위치를 유지하면서 높이만 변경
  const newY = currentY + (currentH - clamped);

  chatWindow.setBounds({ x: currentX, y: newY, width: currentW, height: clamped });
}

/** 채팅 윈도우 전체화면 토글. 전환 후 isExpanded 상태를 반환한다. */
export function toggleExpandChatWindow(): boolean {
  if (!chatWindow || chatWindow.isDestroyed()) return false;

  if (!isExpanded) {
    savedBounds = chatWindow.getBounds();
    const cursor = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursor);
    chatWindow.setMovable(false);
    chatWindow.setBounds(display.workArea, true);
    isExpanded = true;
  } else {
    if (savedBounds) {
      chatWindow.setBounds(savedBounds, true);
      savedBounds = null;
    }
    chatWindow.setMovable(true);
    isExpanded = false;
  }

  return isExpanded;
}

/** 채팅 윈도우 전체화면 여부 반환 */
export function isChatWindowExpanded(): boolean {
  return isExpanded;
}

/** 채팅 윈도우를 열고 특정 룸으로 네비게이션 이벤트 전송 */
export function navigateToChatRoom(roomId: string): void {
  // showChatWindow() 호출 전 창 존재 여부 확인
  // 창이 있으면(opacity=0 포함) React가 이미 마운트된 상태이므로 즉시 전송 가능
  const windowAlreadyExists = !!(chatWindow && !chatWindow.isDestroyed());
  showChatWindow();

  if (windowAlreadyExists) {
    chatWindow?.webContents.send("chat:navigate-to-room", roomId);
  } else if (chatWindow && !chatWindow.isDestroyed()) {
    // 새로 생성된 창: did-finish-load 후 React 마운트 대기
    chatWindow.webContents.once("did-finish-load", () => {
      setTimeout(() => {
        chatWindow?.webContents.send("chat:navigate-to-room", roomId);
      }, 500);
    });
  }
}
