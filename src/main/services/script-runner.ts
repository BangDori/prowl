/** Prowl 내부 스크립트 스케줄러 및 실행 엔진 */
import { exec } from "node:child_process";
import { homedir } from "node:os";
import { promisify } from "node:util";
import type { ProwlSchedule, ProwlScript, ScriptRunInfo } from "@shared/types";
import { getAllScripts, updateLastRun } from "./script-store";

const execAsync = promisify(exec);

/** 스케줄 타이머 맵 (id → timeout handle) */
const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** 현재 시각 기준 다음 실행까지 남은 ms (manual이면 -1) */
function msUntilNext(schedule: ProwlSchedule): number {
  const now = new Date();

  if (schedule.type === "daily") {
    const next = new Date(now);
    next.setHours(schedule.hour, schedule.minute, 0, 0);
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
    return next.getTime() - now.getTime();
  }

  if (schedule.type === "weekly") {
    const next = new Date(now);
    const daysUntil = (schedule.weekday - now.getDay() + 7) % 7 || 7;
    next.setDate(next.getDate() + daysUntil);
    next.setHours(schedule.hour, schedule.minute, 0, 0);
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 7);
    return next.getTime() - now.getTime();
  }

  if (schedule.type === "interval") {
    return schedule.seconds * 1000;
  }

  return -1; // manual
}

/** 단일 스크립트 실행 */
export async function runScript(script: ProwlScript): Promise<ScriptRunInfo> {
  const runAt = new Date().toISOString();
  const expandedScript = script.script.replace(/^~/, homedir());

  try {
    const { stdout, stderr } = await execAsync(expandedScript, {
      shell: "/bin/bash",
      env: { ...process.env, HOME: homedir() },
      timeout: 60_000,
    });
    const output = (stdout + stderr).trim().slice(0, 2000);
    const run: ScriptRunInfo = { runAt, success: true, output, exitCode: 0 };
    updateLastRun(script.id, run);
    return run;
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; code?: number; message?: string };
    const output = ((e.stdout ?? "") + (e.stderr ?? "") + (e.message ?? "")).trim().slice(0, 2000);
    const run: ScriptRunInfo = { runAt, success: false, output, exitCode: e.code ?? 1 };
    updateLastRun(script.id, run);
    return run;
  }
}

/** 스크립트를 스케줄에 따라 예약 */
function scheduleScript(script: ProwlScript): void {
  cancelSchedule(script.id);

  const ms = msUntilNext(script.schedule);
  if (ms < 0) return; // manual

  const handle = setTimeout(async () => {
    timers.delete(script.id);
    await runScript(script);
    // 실행 후 재스케줄 (interval은 항상, daily/weekly는 다음 주기)
    const fresh = (await import("./script-store")).getScriptById(script.id);
    if (fresh?.isEnabled) scheduleScript(fresh);
  }, ms);

  timers.set(script.id, handle);
}

/** 스크립트 스케줄 취소 */
export function cancelSchedule(id: string): void {
  const handle = timers.get(id);
  if (handle) {
    clearTimeout(handle);
    timers.delete(id);
  }
}

/** 앱 시작 시 모든 활성 스크립트 스케줄 등록 */
export function initScriptRunner(): void {
  const scripts = getAllScripts();
  for (const script of scripts) {
    if (script.isEnabled) {
      scheduleScript(script);
    }
  }
  console.log(`[ScriptRunner] ${scripts.filter((s) => s.isEnabled).length} scripts scheduled`);
}

/** 스크립트 추가/수정 후 스케줄 갱신 */
export function refreshSchedule(script: ProwlScript): void {
  if (script.isEnabled) {
    scheduleScript(script);
  } else {
    cancelSchedule(script.id);
  }
}
