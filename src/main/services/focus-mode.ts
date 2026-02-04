import { execFileSync } from "node:child_process";
import type { FocusMode } from "@shared/types";
import { getFocusMode } from "./settings";

const FOCUS_CHECK_INTERVAL_MS = 10_000; // 10초마다 PID 변화 체크
// 감시 대상 프로세스 이름
const WATCHED_PROCESSES = ["claude"];

const NUDGE_INTERVAL_MS = 1 * 60 * 1000; // 1분마다 알림

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastNotifiedAt = 0;

export function isInFocusTime(startTime: string, endTime: string): boolean {
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

const NUDGE_SPLASH_DURATION_MS = 10_000;

function showNudgeSplash(message: string): void {
  import("../windows/splash").then(({ createSplashWindow, dismissSplash }) => {
    const win = createSplashWindow();
    // 10초간 닫기 방지
    const preventClose = (e: Electron.Event) => e.preventDefault();
    win.on("close", preventClose);
    setTimeout(() => {
      if (!win.isDestroyed()) win.removeListener("close", preventClose);
    }, NUDGE_SPLASH_DURATION_MS);
    // splash.html 로드 완료 후 nudge 메시지 오버레이 삽입
    win.webContents.once("did-finish-load", () => {
      const escaped = message.replace(/'/g, "\\'").replace(/\n/g, "\\n");
      win.webContents
        .executeJavaScript(`
        document.querySelector('.title-svg')?.remove();

        // 꾹꾹체 웹폰트 + 스타일 추가
        const style = document.createElement('style');
        style.textContent = \`
          @font-face {
            font-family: 'memomentKkukKkuk';
            src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2508-2@1.0/memomentKkukKkuk.woff2') format('woff2');
            font-weight: normal;
            font-style: normal;
          }
          @keyframes bubble-in {
            0% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.9); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          }
          @keyframes cursor-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        \`;
        document.head.appendChild(style);

        const overlay = document.createElement('div');
        overlay.style.cssText = \`
          position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
          z-index: 10; text-align: left; max-width: 360px; padding: 20px 28px;
          opacity: 0; animation: bubble-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 2s forwards;
          background: radial-gradient(ellipse at 30% 20%, rgba(40,36,28,0.7), rgba(14,14,16,0.65));
          border: 1px solid rgba(212,184,112,0.1);
          border-radius: 4px 20px 20px 20px;
          backdrop-filter: blur(16px);
          box-shadow: 0 0 60px rgba(212,184,112,0.05), 0 8px 32px rgba(0,0,0,0.4);
          font-family: 'memomentKkukKkuk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
        \`;

        // 위쪽 꼬리 (고양이 입에서 나오는 느낌)
        const tail = document.createElement('div');
        tail.style.cssText = \`
          position: absolute; top: -10px; left: 28px;
          width: 0; height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 10px solid rgba(30,28,22,0.68);
        \`;\
        overlay.appendChild(tail);

        const textEl = document.createElement('p');
        textEl.style.cssText = 'font-size:15px;color:#E8E8EC;line-height:1.8;font-weight:300;margin:0;min-height:1.8em;';
        overlay.appendChild(textEl);

        document.body.appendChild(overlay);

        // 한 글자씩 타이핑 효과
        const fullText = '${escaped}';
        let i = 0;
        const cursor = document.createElement('span');
        cursor.textContent = '|';
        cursor.style.cssText = 'color:#D4B870;animation:cursor-blink 0.8s step-end infinite;margin-left:1px;font-weight:100;';
        textEl.appendChild(cursor);

        const typeInterval = setInterval(() => {
          if (i < fullText.length) {
            if (fullText[i] === '\\n') {
              cursor.before(document.createElement('br'));
            } else {
              cursor.before(document.createTextNode(fullText[i]));
            }
            i++;
          } else {
            clearInterval(typeInterval);
            setTimeout(() => cursor.remove(), 1200);
          }
        }, 50);
      `)
        .catch(() => {});
    });
    // 자동 dismiss
    setTimeout(async () => {
      await dismissSplash();
    }, NUDGE_SPLASH_DURATION_MS);
  });
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
  "냐아… 이 시간에 또 코딩이다냥?\n집사 내일 눈 퉁퉁 붓는다옹… 🐾",
  "…아직도 안 잤다냥?\n모니터 끄고 이불 속으로 들어가라옹 😾",
  "으으… 새벽 코딩은 버그만 늘어난다냥\n자고 일어나서 하라옹 💤",
  "집사… 지금 몇 시인지 알고 있다냥?\n키보드에서 손 떼라옹… 🐱",
  "이 시간에 커밋하면 내일의 집사가 운다냥\n제발 자라옹… 😿",
  "냐… 또 밤새려고?\n천재는 잠을 자야 완성된다옹 🌙",
  "집사의 코드는 도망 안 간다냥…\n근데 건강은 도망간다옹 🐈‍⬛",
  "…그르르르… 자라옹…\n내일 또 모니터 앞에 앉을 거잖다냥 😴",
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
  showNudgeSplash(message);
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
