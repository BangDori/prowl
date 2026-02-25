/** 카테고리 관리 AI 도구 — 목록/추가/이름변경/삭제 */
import { tool } from "ai";
import { z } from "zod";
import { waitForApproval } from "./approval";
import { addCategory, deleteCategory, listCategories, renameCategory } from "./categories";
import {
  generateId,
  getCurrentRoomId,
  notifyCategoriesChanged,
  notifyTasksChanged,
  sendToChat,
} from "./chat-tools-shared";
import { toolRegistry } from "./tool-registry";

const list_categories = tool({
  description: "List all task categories.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      return { categories: listCategories() };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

const add_category = tool({
  description: "Add a new task category.",
  inputSchema: z.object({
    name: z.string().describe("Category name"),
  }),
  execute: async ({ name }) => {
    try {
      const category = addCategory(name);
      notifyCategoriesChanged();
      return { success: true, category };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

const rename_category = tool({
  description:
    "Rename an existing category. All tasks with the old category name will be updated automatically.",
  inputSchema: z.object({
    oldName: z.string().describe("Current category name"),
    newName: z.string().describe("New category name"),
  }),
  execute: async ({ oldName, newName }) => {
    try {
      renameCategory(oldName, newName);
      notifyCategoriesChanged();
      notifyTasksChanged();
      return { success: true };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

const delete_category = tool({
  description:
    "Delete a category. Tasks assigned to it will be moved to '기타'. Cannot delete '기타'.",
  inputSchema: z.object({
    name: z.string().describe("Category name to delete"),
  }),
  execute: async ({ name }) => {
    try {
      const approvalId = `approval_${generateId()}`;
      sendToChat("chat:stream-message", getCurrentRoomId(), {
        id: approvalId,
        role: "assistant",
        content: `"${name}" 카테고리를 삭제할까요? 해당 카테고리의 태스크는 '기타'로 변경됩니다.`,
        timestamp: Date.now(),
        approval: {
          id: approvalId,
          status: "pending",
          toolName: "delete_category",
          displayName: name,
          args: { name },
        },
      });

      const approved = await waitForApproval(approvalId);
      if (!approved) {
        return { cancelled: true, message: "사용자가 삭제를 취소했습니다." };
      }

      deleteCategory(name);
      notifyCategoriesChanged();
      notifyTasksChanged();
      return { success: true };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

// 카테고리 관리 툴 등록
toolRegistry.register(
  { name: "category-manager", label: "카테고리 관리", dangerLevel: "moderate" },
  { list_categories, add_category, rename_category, delete_category },
);
