/** 메모리 관리 AI 도구 — 사용자 선호/지시 저장/조회/수정/삭제 */
import { tool } from "ai";
import { z } from "zod";
import { waitForApproval } from "./approval";
import { generateId, getCurrentRoomId, notifyMemoryChanged, sendToChat } from "./chat-tools-shared";
import { addMemory, deleteMemory, listMemories, updateMemory } from "./memory";
import { toolRegistry } from "./tool-registry";

const save_memory = tool({
  description:
    "Save a user preference or instruction that should be remembered across conversations. Use when the user explicitly tells you something to always/never do, or personal info to remember.",
  inputSchema: z.object({
    content: z.string().describe("The preference or instruction to remember"),
  }),
  execute: async ({ content }) => {
    try {
      const memory = addMemory(content);
      notifyMemoryChanged();
      return { success: true, memory };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

const list_memories = tool({
  description:
    "List all saved user memories/preferences. Use when the user asks what you remember, or before updating/deleting a memory to find its ID.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      return { memories: listMemories() };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

const update_memory = tool({
  description:
    "Update the content of an existing memory. Use list_memories first to find the memory ID.",
  inputSchema: z.object({
    id: z.string().describe("Memory ID to update"),
    content: z.string().describe("New content for the memory"),
  }),
  execute: async ({ id, content }) => {
    try {
      updateMemory(id, content);
      notifyMemoryChanged();
      return { success: true };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

const delete_memory = tool({
  description: "Delete a saved memory. Use list_memories first to find the memory ID.",
  inputSchema: z.object({
    id: z.string().describe("Memory ID to delete"),
  }),
  execute: async ({ id }) => {
    try {
      // 삭제 전 메모리 내용 조회
      const memory = listMemories().find((m) => m.id === id);
      const displayName = memory ? memory.content.slice(0, 40) : id;

      const approvalId = `approval_${generateId()}`;
      sendToChat("chat:stream-message", getCurrentRoomId(), {
        id: approvalId,
        role: "assistant",
        content: `"${displayName}" 메모리를 삭제할까요?`,
        timestamp: Date.now(),
        approval: {
          id: approvalId,
          status: "pending",
          toolName: "delete_memory",
          displayName,
          args: { id },
        },
      });

      const approved = await waitForApproval(approvalId);
      if (!approved) {
        return { cancelled: true, message: "사용자가 삭제를 취소했습니다." };
      }

      deleteMemory(id);
      notifyMemoryChanged();
      return { success: true };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

// 메모리 관리 툴 등록
toolRegistry.register(
  { name: "memory-manager", label: "메모리 관리", dangerLevel: "safe" },
  { save_memory, list_memories, update_memory, delete_memory },
);
