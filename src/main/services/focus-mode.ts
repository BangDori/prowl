import { execFileSync } from "node:child_process";
import path from "node:path";
import { app, Notification, nativeImage } from "electron";
import type { FocusMode } from "../../shared/types";
import { getFocusMode } from "./settings";

const FOCUS_CHECK_INTERVAL_MS = 10_000; // 10초마다 PID 변화 체크
// 감시 대상 프로세스 이름
const WATCHED_PROCESSES = ["claude"];

const NUDGE_INTERVAL_MS = 5 * 60 * 1000; // 5분마다 알림

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastNotifiedAt = 0;

function isInFocusTime(startTime: string, endTime: string): boolean {
  const now = new Date();
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // 자정을 넘기는 경우 (예: 22:00 ~ 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

let notificationIcon: Electron.NativeImage | null = null;

function getNotificationIcon(): Electron.NativeImage {
  if (!notificationIcon) {
    notificationIcon = nativeImage.createFromPath(
      path.join(__dirname, "../../assets/prowl-profile.png"),
    );
  }
  return notificationIcon;
}

function sendNudgeToRenderer(message: string): void {
  import("../tray").then(({ getSubWindow, showSubPage }) => {
    let win = getSubWindow();
    if (!win || win.isDestroyed()) {
      // 윈도우가 없으면 monitor 페이지를 열고 로드 완료 후 전송
      showSubPage("monitor");
      win = getSubWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.once("did-finish-load", () => {
          win!.webContents.send("focusMode:nudge", message);
        });
      }
      return;
    }
    win.webContents.send("focusMode:nudge", message);
    if (!win.isVisible()) {
      win.show();
    }
  });
}

function sendNotification(title: string, message: string): void {
  console.log(
    `[focus-mode] sendNotification called, isReady=${app.isReady()}, supported=${Notification.isSupported()}`,
  );
  const n = new Notification({
    title,
    body: message,
    icon: getNotificationIcon(),
  });
  n.on("show", () => console.log("[focus-mode] notification shown"));
  n.show();
}

/** pgrep으로 특정 이름의 프로세스 PID 목록을 가져온다 */
function getProcessPids(name: string): Set<number> {
  try {
    const output = execFileSync("pgrep", ["-x", name], {
      encoding: "utf-8",
    });
    return new Set(output.trim().split("\n").filter(Boolean).map(Number));
  } catch {
    // pgrep은 매칭 프로세스가 없으면 exit code 1
    return new Set();
  }
}

const NUDGE_MESSAGES = [
  "이 시간에 또 코딩이다냥? 집사 내일 눈 퉁퉁 붓는다옹.",
  "아직도 안 잔 거다냥…? 모니터 끄고 이불 속으로 들어가라옹.",
  "새벽 코딩은 버그만 늘어난다냥. 자고 일어나서 하라옹.",
  "집사, 지금 몇 시인지 알고 있다냥? 키보드에서 손 떼라옹.",
  "이 시간에 커밋하면 내일의 집사가 운다냥. 제발 자라옹.",
  "또 밤새려고? 천재는 잠을 자야 완성된다옹.",
  "집사의 코드는 도망 안 간다냥. 근데 건강은 도망간다옹.",
];

function pickNudgeMessage(): string {
  return NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];
}

function checkProcesses(): void {
  const focusMode = getFocusMode();
  if (!focusMode.enabled) return;
  if (!isInFocusTime(focusMode.startTime, focusMode.endTime)) return;

  const hasProcess = WATCHED_PROCESSES.some((name) => getProcessPids(name).size > 0);
  if (!hasProcess) return;

  const now = Date.now();
  if (now - lastNotifiedAt < NUDGE_INTERVAL_MS) return;

  lastNotifiedAt = now;
  const message = pickNudgeMessage();
  sendNotification("Prowl", message);
  sendNudgeToRenderer(message);
}

export function startFocusModeMonitor(): void {
  stopFocusModeMonitor();
  lastNotifiedAt = 0;
  intervalId = setInterval(checkProcesses, FOCUS_CHECK_INTERVAL_MS);
}

export function stopFocusModeMonitor(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  lastNotifiedAt = 0;
}

export function updateFocusModeMonitor(focusMode: FocusMode): void {
  if (focusMode.enabled) {
    startFocusModeMonitor();
  } else {
    stopFocusModeMonitor();
  }
}
