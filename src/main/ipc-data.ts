/** 메모리 / 카테고리 / Prowl 파일 IPC 핸들러 */
import { handleIpc } from "./ipc-utils";
import { addCategory, deleteCategory, listCategories, renameCategory } from "./services/categories";
import { addMemory, deleteMemory, listMemories, updateMemory } from "./services/memory";
import { deleteProwlEntry, listProwlDir, readProwlFile, writeProwlFile } from "./services/prowl-fs";
import { getChatWindow, getCompactWindow, getDashboardWindow } from "./windows";

function notifyTasksChanged(): void {
  for (const win of [getCompactWindow(), getDashboardWindow()]) {
    if (win && !win.isDestroyed()) win.webContents.send("tasks:changed");
  }
}

function notifyCategoriesChanged(): void {
  for (const win of [getCompactWindow(), getDashboardWindow(), getChatWindow()]) {
    if (win && !win.isDestroyed()) win.webContents.send("categories:changed");
  }
}

export function registerDataHandlers(): void {
  // ── Memory ──────────────────────────────────────────

  handleIpc("memory:list", async () => {
    return listMemories();
  });

  handleIpc("memory:add", async (content) => {
    try {
      addMemory(content);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("memory:update", async (id, content) => {
    try {
      updateMemory(id, content);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("memory:delete", async (id) => {
    try {
      deleteMemory(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ── Categories ──────────────────────────────────────

  handleIpc("categories:list", async () => {
    return listCategories();
  });

  handleIpc("categories:add", async (name) => {
    try {
      addCategory(name);
      notifyCategoriesChanged();
      notifyTasksChanged();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("categories:rename", async (oldName, newName) => {
    try {
      renameCategory(oldName, newName);
      notifyCategoriesChanged();
      notifyTasksChanged();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("categories:delete", async (name) => {
    try {
      deleteCategory(name);
      notifyCategoriesChanged();
      notifyTasksChanged();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ── Prowl Files ──────────────────────────────────────

  handleIpc("prowl-files:list", async (relPath) => {
    return listProwlDir(relPath);
  });

  handleIpc("prowl-files:read", async (relPath) => {
    return readProwlFile(relPath);
  });

  handleIpc("prowl-files:write", async (relPath, content) => {
    try {
      writeProwlFile(relPath, content);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("prowl-files:delete", async (relPath) => {
    try {
      deleteProwlEntry(relPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
