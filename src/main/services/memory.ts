/** 파일 기반 Memory CRUD 서비스 (~/.prowl/memories.json) */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Memory } from "@shared/types";
import { PROWL_DATA_DIR } from "@shared/types";
import { app } from "electron";

const MEMORY_FILE = "memories.json";

/** Prowl 데이터 루트 (~/.prowl) 확보 */
function ensureDataDir(): string {
  const dir = join(app.getPath("home"), PROWL_DATA_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

/** memories.json 경로 */
function memoryFilePath(): string {
  return join(ensureDataDir(), MEMORY_FILE);
}

/** 메모리 파일 읽기 */
function readMemoryFile(): Memory[] {
  const filePath = memoryFilePath();
  if (!existsSync(filePath)) return [];
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 메모리 파일 쓰기 */
function writeMemoryFile(memories: Memory[]): void {
  writeFileSync(memoryFilePath(), JSON.stringify(memories, null, 2), "utf-8");
}

/** 고유 ID 생성 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

/** 전체 메모리 조회 */
export function listMemories(): Memory[] {
  return readMemoryFile();
}

/** 메모리 추가 */
export function addMemory(content: string): Memory {
  const memories = readMemoryFile();
  const memory: Memory = {
    id: generateId(),
    content,
    createdAt: new Date().toISOString(),
  };
  memories.push(memory);
  writeMemoryFile(memories);
  return memory;
}

/** 메모리 수정 */
export function updateMemory(id: string, content: string): void {
  const memories = readMemoryFile();
  const idx = memories.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error(`Memory not found: ${id}`);
  memories[idx].content = content;
  writeMemoryFile(memories);
}

/** 메모리 삭제 */
export function deleteMemory(id: string): void {
  const memories = readMemoryFile().filter((m) => m.id !== id);
  writeMemoryFile(memories);
}
