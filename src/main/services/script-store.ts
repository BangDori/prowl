/** 파일 기반 스크립트 영속 저장소 (~/.prowl/scripts.json) */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ProwlScript, ScriptRunInfo } from "@shared/types";
import { PROWL_DATA_DIR } from "@shared/types";
import { app } from "electron";

const SCRIPTS_FILE = "scripts.json";

/** ~/.prowl 디렉터리 확보 후 경로 반환 */
function ensureDataDir(): string {
  const dir = join(app.getPath("home"), PROWL_DATA_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

/** ~/.prowl/scripts.json 경로 */
function scriptsFilePath(): string {
  return join(ensureDataDir(), SCRIPTS_FILE);
}

/** scripts.json 읽기 */
function readScriptsFile(): ProwlScript[] {
  const filePath = scriptsFilePath();
  if (!existsSync(filePath)) return [];
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** scripts.json 쓰기 */
function writeScriptsFile(scripts: ProwlScript[]): void {
  writeFileSync(scriptsFilePath(), JSON.stringify(scripts, null, 2), "utf-8");
}

/**
 * electron-store 기반 구 경로(~/Library/Application Support/prowl/prowl-scripts.json)에서
 * ~/.prowl/scripts.json 으로 데이터 마이그레이션 (최초 1회)
 */
function migrateFromElectronStore(): void {
  const newPath = scriptsFilePath();
  if (existsSync(newPath)) return;

  const oldPath = join(app.getPath("userData"), "prowl-scripts.json");
  if (!existsSync(oldPath)) return;

  try {
    const raw = readFileSync(oldPath, "utf-8");
    const parsed = JSON.parse(raw) as { scripts?: ProwlScript[] };
    if (Array.isArray(parsed.scripts) && parsed.scripts.length > 0) {
      writeScriptsFile(parsed.scripts);
    }
  } catch {
    // 마이그레이션 실패 시 빈 상태로 시작
  }
}

let migrated = false;

function ensureMigrated(): void {
  if (migrated) return;
  migrated = true;
  migrateFromElectronStore();
}

export function getAllScripts(): ProwlScript[] {
  ensureMigrated();
  return readScriptsFile();
}

export function getScriptById(id: string): ProwlScript | null {
  return getAllScripts().find((s) => s.id === id) ?? null;
}

export function saveScript(script: ProwlScript): void {
  const scripts = getAllScripts();
  const idx = scripts.findIndex((s) => s.id === script.id);
  if (idx >= 0) {
    scripts[idx] = script;
  } else {
    scripts.push(script);
  }
  writeScriptsFile(scripts);
}

export function deleteScriptById(id: string): void {
  const scripts = getAllScripts().filter((s) => s.id !== id);
  writeScriptsFile(scripts);
}

export function updateLastRun(id: string, run: ScriptRunInfo): void {
  const script = getScriptById(id);
  if (!script) return;
  script.lastRun = run;
  saveScript(script);
}

export function toggleScriptEnabled(id: string): boolean {
  const script = getScriptById(id);
  if (!script) return false;
  script.isEnabled = !script.isEnabled;
  saveScript(script);
  return script.isEnabled;
}

export function getScriptStorePath(): string {
  return scriptsFilePath();
}
