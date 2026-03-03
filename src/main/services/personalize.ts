/** 파일 기반 Personalize 설정 서비스 (~/.prowl/personalize/) */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getDataHome } from "@main/lib/prowl-home";
import { PERSONALIZE_SUBFOLDER, PROWL_DATA_DIR } from "@shared/types";

const SYSTEM_PROMPT_FILE = "systemprompt.json";
const TONE_FILE = "tone.json";

/** ~/.prowl/personalize 디렉터리 확보 후 경로 반환 */
export function ensurePersonalizeDir(): string {
  const dir = join(getDataHome(), PROWL_DATA_DIR, PERSONALIZE_SUBFOLDER);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function readStringFile(filePath: string): string {
  if (!existsSync(filePath)) return "";
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return typeof parsed?.value === "string" ? parsed.value : "";
  } catch {
    return "";
  }
}

function writeStringFile(filePath: string, value: string): void {
  writeFileSync(filePath, JSON.stringify({ value }, null, 2), "utf-8");
}

/** 시스템 프롬프트 오버라이드 읽기 */
export function readSystemPrompt(): string {
  return readStringFile(join(ensurePersonalizeDir(), SYSTEM_PROMPT_FILE));
}

/** 시스템 프롬프트 오버라이드 쓰기 */
export function writeSystemPrompt(value: string): void {
  writeStringFile(join(ensurePersonalizeDir(), SYSTEM_PROMPT_FILE), value);
}

/** 톤 & 매너 읽기 */
export function readTone(): string {
  return readStringFile(join(ensurePersonalizeDir(), TONE_FILE));
}

/** 톤 & 매너 쓰기 */
export function writeTone(value: string): void {
  writeStringFile(join(ensurePersonalizeDir(), TONE_FILE), value);
}
