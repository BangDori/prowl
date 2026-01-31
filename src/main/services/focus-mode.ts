import { execFileSync } from "child_process";
import path from "path";
import { Notification, nativeImage, app } from "electron";
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

function checkPidChanges(): void {
	const focusMode = getFocusMode();
	if (!focusMode.enabled) {
		console.log("[focus-mode] disabled, skipping");
		return;
	}
	if (!isInFocusTime(focusMode.startTime, focusMode.endTime)) {
		console.log("[focus-mode] outside time range, skipping");
		return;
	}

	for (const procName of WATCHED_PROCESSES) {
		const currentSet = getProcessPids(procName);
		const prevSet = prevProcessPids.get(procName) ?? new Set();
		console.log(
			`[focus-mode] ${procName}: prev=${[...prevSet]} current=${[...currentSet]}`,
		);
		for (const pid of currentSet) {
			if (!prevSet.has(pid)) {
				console.log(`[focus-mode] new pid detected: ${pid}`);
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
