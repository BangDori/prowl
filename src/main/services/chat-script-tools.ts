/** 채팅 AI 스크립트 관리 도구 — list/create/run/toggle */
import type { ProwlScript } from "@shared/types";
import { tool } from "ai";
import { z } from "zod";
import { getChatWindow } from "../windows";
import { waitForApproval } from "./approval";
import { generateScriptFromPrompt } from "./script-ai";
import { refreshSchedule, runScript } from "./script-runner";
import { getAllScripts, getScriptById, saveScript, toggleScriptEnabled } from "./script-store";
import { toolRegistry } from "./tool-registry";

function sendToChat(channel: string, ...args: unknown[]): void {
  const win = getChatWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args);
  }
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

const list_scripts = tool({
  description:
    "등록된 모든 Prowl 스크립트 목록 조회. 상태(활성/비활성), 스케줄, 마지막 실행 정보 포함.",
  inputSchema: z.object({
    filter: z.enum(["all", "enabled", "disabled"]).optional().describe("필터 (기본값: all)"),
  }),
  execute: async ({ filter }) => {
    const scripts = getAllScripts();
    const filtered =
      filter === "enabled"
        ? scripts.filter((s) => s.isEnabled)
        : filter === "disabled"
          ? scripts.filter((s) => !s.isEnabled)
          : scripts;
    return {
      scripts: filtered.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        isEnabled: s.isEnabled,
        scheduleText: s.scheduleText,
        lastRun: s.lastRun ? { success: s.lastRun.success, runAt: s.lastRun.runAt } : null,
      })),
      total: filtered.length,
    };
  },
});

const run_script = tool({
  description: `스크립트를 즉시 실행. ⚠️ 이 도구는 실제 셸 커맨드를 실행하므로, 반드시 먼저 실행 의도를 사용자에게 알린 뒤 호출하라. 호출하면 앱에서 승인 팝업이 표시되며 사용자가 거부하면 자동 취소된다.`,
  inputSchema: z.object({
    id: z.string().describe("스크립트 ID"),
    name: z.string().optional().describe("스크립트 이름 (표시용)"),
  }),
  execute: async ({ id, name }) => {
    const script = getScriptById(id);
    if (!script) return { error: `스크립트를 찾을 수 없음: ${id}` };

    const approvalId = `approval_${genId()}`;
    const displayName = name ?? script.name;

    // 승인 요청 메시지 — renderer가 버튼 UI로 렌더링
    sendToChat("chat:stream-message", {
      id: approvalId,
      role: "assistant",
      content: `"${displayName}" 스크립트를 실행할까요?`,
      timestamp: Date.now(),
      approval: {
        id: approvalId,
        status: "pending",
        toolName: "run_script",
        displayName,
        args: { id },
      },
    });

    const approved = await waitForApproval(approvalId);
    if (!approved) {
      return { cancelled: true, message: "사용자가 실행을 취소했습니다." };
    }

    const result = await runScript(script);
    return {
      success: result.success,
      output: result.output,
      exitCode: result.exitCode,
    };
  },
});

const toggle_script = tool({
  description: "스크립트 활성화/비활성화 전환. 활성화 시 스케줄에 따라 자동 실행 등록됨.",
  inputSchema: z.object({
    id: z.string().describe("스크립트 ID"),
    enable: z.boolean().describe("true = 활성화, false = 비활성화"),
  }),
  execute: async ({ id, enable }) => {
    const script = getScriptById(id);
    if (!script) return { error: `스크립트를 찾을 수 없음: ${id}` };

    if (script.isEnabled !== enable) {
      toggleScriptEnabled(id);
      const updated = getScriptById(id);
      if (updated) refreshSchedule(updated);
    }

    return { success: true, id, name: script.name, isEnabled: enable };
  },
});

const create_script = tool({
  description:
    "자연어 설명으로 새 Prowl 스크립트 생성. 생성 후 비활성 상태로 저장되므로, 활성화가 필요하면 toggle_script를 이어서 호출하라.",
  inputSchema: z.object({
    prompt: z
      .string()
      .describe(
        "스크립트가 할 일과 실행 주기를 자연어로 설명. 예: '매일 오전 9시에 ~/backup.sh 실행'",
      ),
  }),
  execute: async ({ prompt }) => {
    try {
      const draft = await generateScriptFromPrompt(prompt);
      const script: ProwlScript = {
        id: `script_${genId()}`,
        name: draft.name,
        description: draft.description,
        script: draft.script,
        schedule: draft.schedule,
        scheduleText: draft.scheduleText,
        isEnabled: false,
        createdAt: new Date().toISOString(),
        lastRun: null,
      };
      saveScript(script);
      return {
        success: true,
        script: {
          id: script.id,
          name: script.name,
          description: script.description,
          scheduleText: script.scheduleText,
          isEnabled: script.isEnabled,
        },
      };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

toolRegistry.register(
  {
    name: "script-manager",
    label: "스크립트 관리",
    dangerLevel: "dangerous",
    description: "스크립트 생성/조회/실행/토글",
  },
  { list_scripts, create_script, run_script, toggle_script },
);
