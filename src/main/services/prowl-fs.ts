/** ~/.prowl/ 디렉터리 파일 시스템 읽기/쓰기 서비스 (경로 이탈 방지 포함) */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { PROWL_DATA_DIR } from "@shared/types";
import { app } from "electron";

const MAX_FILE_SIZE = 50 * 1024; // 50KB

/** Prowl 데이터 루트 절대 경로 (~/.prowl) */
function getProwlDir(): string {
  return join(app.getPath("home"), PROWL_DATA_DIR);
}

/** 상대 경로를 절대 경로로 변환하고 경로 이탈 여부 검증 */
function resolveSafe(relPath: string): string {
  const base = getProwlDir();
  const full = resolve(base, relPath);
  if (!full.startsWith(`${base}/`) && full !== base) {
    throw new Error("접근 권한이 없는 경로입니다.");
  }
  return full;
}

import type { ProwlEntry } from "@shared/types";
export type { ProwlEntry };

/** ~/.prowl/ 내부 디렉터리 항목 목록 조회 (1단계, 비재귀) */
export function listProwlDir(relPath = ""): ProwlEntry[] {
  const base = getProwlDir();
  const targetDir = relPath ? resolveSafe(relPath) : base;

  if (!existsSync(targetDir)) return [];

  try {
    return readdirSync(targetDir)
      .map((name) => {
        const fullPath = join(targetDir, name);
        const stat = statSync(fullPath);
        return {
          name,
          path: relative(base, fullPath),
          type: stat.isDirectory() ? "directory" : "file",
          size: stat.isFile() ? stat.size : undefined,
        } satisfies ProwlEntry;
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      });
  } catch {
    return [];
  }
}

/** ~/.prowl/ 내부 파일 내용 읽기 (최대 50KB, UTF-8) */
export function readProwlFile(relPath: string): string {
  const fullPath = resolveSafe(relPath);

  if (!existsSync(fullPath)) {
    throw new Error(`파일을 찾을 수 없습니다: ${relPath}`);
  }

  const stat = statSync(fullPath);
  if (stat.isDirectory()) {
    throw new Error(`경로가 디렉터리입니다 (파일을 지정하세요): ${relPath}`);
  }
  if (stat.size > MAX_FILE_SIZE) {
    throw new Error(`파일이 너무 큽니다: ${stat.size} bytes (최대 ${MAX_FILE_SIZE} bytes)`);
  }

  return readFileSync(fullPath, "utf-8");
}

/** ~/.prowl/ 내부 파일 또는 빈 디렉터리 삭제 */
export function deleteProwlEntry(relPath: string): void {
  const fullPath = resolveSafe(relPath);
  if (!existsSync(fullPath)) {
    throw new Error(`경로를 찾을 수 없습니다: ${relPath}`);
  }
  const stat = statSync(fullPath);
  if (stat.isDirectory()) {
    rmdirSync(fullPath); // 비어 있지 않으면 예외 발생
  } else {
    unlinkSync(fullPath);
  }
}

/** ~/.prowl/ 내부 파일 내용 쓰기 (UTF-8, 부모 디렉터리 자동 생성) */
export function writeProwlFile(relPath: string, content: string): void {
  const fullPath = resolveSafe(relPath);
  const parentDir = dirname(fullPath);
  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true });
  }
  writeFileSync(fullPath, content, "utf-8");
}
