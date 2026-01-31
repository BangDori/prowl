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

function checkPidChanges(): void {
	const focusMode = getFocusMode();
	if (!focusMode.enabled) return;
	if (!isInFocusTime(focusMode.startTime, focusMode.endTime)) return;

	const hour = new Date().getHours();
	const timeComment =
		hour < 6
			? "이 시간까지 깨어있다냥? 집사, 좀 자라옹."
			: "아직 쉬는 시간이다냥. 무리하지 말라옹.";

	for (const procName of WATCHED_PROCESSES) {
		const currentSet = getProcessPids(procName);
		const prevSet = prevProcessPids.get(procName) ?? new Set();
		for (const pid of currentSet) {
			if (!prevSet.has(pid)) {
				sendNotification(
					"Prowl",
					`${procName} 프로세스가 감지됐다냥. ${timeComment}`,
				);
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
