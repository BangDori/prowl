import { execFileSync } from "child_process";
import path from "path";
import { Notification, nativeImage } from "electron";
import { getFocusMode } from "./settings";
import { FocusMode } from "../../shared/types";

const FOCUS_CHECK_INTERVAL_MS = 10_000; // 10초마다 PID 변화 체크
// 감시 대상 프로세스 이름
const WATCHED_PROCESSES = ["claude"];

let intervalId: ReturnType<typeof setInterval> | null = null;
// 이전 폴링의 프로세스 PID 스냅샷 (name → Set<pid>)
let prevProcessPids = new Map<string, Set<number>>();

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

function sendNotification(title: string, message: string): void {
	new Notification({
		title,
		body: message,
		icon: getNotificationIcon(),
	}).show();
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
	"오늘도 충분히 해냈다냥. 내일 더 멋진 코드를 위해 충전하라옹.",
	"지금의 집사도 대단하다냥. 푹 자고 내일 더 빛나라옹.",
	"여기까지 달려온 것만으로 충분하다냥. 나머지는 내일의 집사에게 맡기라옹.",
	"오늘의 노력은 이미 충분하다냥. 자고 일어나면 더 좋은 아이디어가 떠오를 거다옹.",
	"집사의 열정은 인정이다냥. 근데 잠도 실력이라옹.",
];

function pickNudgeMessage(): string {
	return NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];
}

function checkPidChanges(): void {
	const focusMode = getFocusMode();
	if (!focusMode.enabled) return;
	if (!isInFocusTime(focusMode.startTime, focusMode.endTime)) return;

	for (const procName of WATCHED_PROCESSES) {
		const currentSet = getProcessPids(procName);
		const prevSet = prevProcessPids.get(procName) ?? new Set();
		for (const pid of currentSet) {
			if (!prevSet.has(pid)) {
				sendNotification("Prowl", pickNudgeMessage());
				break;
			}
		}
		prevProcessPids.set(procName, currentSet);
	}
}

export function startFocusModeMonitor(): void {
	stopFocusModeMonitor();
	// 현재 스냅샷 저장 (기존 실행 중인 것은 무시)
	for (const procName of WATCHED_PROCESSES) {
		prevProcessPids.set(procName, getProcessPids(procName));
	}
	intervalId = setInterval(checkPidChanges, FOCUS_CHECK_INTERVAL_MS);
}

export function stopFocusModeMonitor(): void {
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = null;
	}
	prevProcessPids.clear();
}

export function updateFocusModeMonitor(focusMode: FocusMode): void {
	if (focusMode.enabled) {
		startFocusModeMonitor();
	} else {
		stopFocusModeMonitor();
	}
}
