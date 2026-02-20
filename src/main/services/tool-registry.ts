/** 채팅 AI 도구 레지스트리 — 툴셋 동적 등록 및 조회 */
import type { ToolSet } from "ai";

export type DangerLevel = "safe" | "moderate" | "dangerous";

export interface ToolSetMetadata {
  name: string;
  label: string;
  dangerLevel: DangerLevel;
  description?: string;
}

interface RegisteredSet {
  meta: ToolSetMetadata;
  tools: ToolSet;
}

/** 채팅 AI가 사용할 수 있는 모든 도구를 관리하는 레지스트리 */
class ToolRegistry {
  private sets = new Map<string, RegisteredSet>();

  /** 도구 세트 등록 (모듈 로드 시 자동 호출) */
  register(meta: ToolSetMetadata, tools: ToolSet): void {
    this.sets.set(meta.name, { meta, tools });
  }

  /** 등록된 모든 도구를 하나의 맵으로 반환 */
  getAllTools(): ToolSet {
    const result: ToolSet = {};
    for (const { tools } of this.sets.values()) {
      Object.assign(result, tools);
    }
    return result;
  }

  /** 시스템 프롬프트에 주입할 기능 목록 요약 */
  getContextSummary(): string {
    const lines: string[] = [];
    for (const { meta, tools } of this.sets.values()) {
      const toolNames = Object.keys(tools).join(", ");
      lines.push(`- ${meta.label} (${toolNames})`);
    }
    return lines.join("\n");
  }
}

export const toolRegistry = new ToolRegistry();
