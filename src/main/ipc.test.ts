/** IPC 핸들러 등록 유닛 테스트 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
  ipcMain: { handle: vi.fn() },
  app: { quit: vi.fn() },
  shell: {
    showItemInFolder: vi.fn(),
    openExternal: vi.fn(),
  },
}));

vi.mock("./services/settings", () => ({
  getSettings: vi.fn(),
  setSettings: vi.fn(),
  getFocusMode: vi.fn(),
  setFocusMode: vi.fn(),
  getChatConfig: vi.fn().mockReturnValue({ provider: "openai", model: "gpt-4o" }),
  setChatConfig: vi.fn(),
}));

vi.mock("./services/focus-mode", () => ({
  updateFocusModeMonitor: vi.fn(),
}));

vi.mock("./services/chat", () => ({
  streamChatMessage: vi.fn().mockResolvedValue(undefined),
  getProviderStatuses: vi.fn().mockReturnValue([]),
}));

vi.mock("./windows", () => ({
  getSubWindow: vi.fn(),
  popUpTrayMenu: vi.fn(),
  resizeChatWindow: vi.fn(),
  closeChatWindow: vi.fn(),
}));

import { app, ipcMain, shell } from "electron";
import { registerIpcHandlers } from "./ipc";
import { streamChatMessage } from "./services/chat";
import { updateFocusModeMonitor } from "./services/focus-mode";
import { getSettings, setFocusMode, setSettings } from "./services/settings";
import { closeChatWindow, getSubWindow, resizeChatWindow } from "./windows";

const mockIpcHandle = vi.mocked(ipcMain.handle);

// 핸들러를 채널명으로 추출하는 헬퍼
function getHandler(channel: string): (...args: unknown[]) => Promise<unknown> {
  const call = mockIpcHandle.mock.calls.find((c) => c[0] === channel);
  if (!call) throw new Error(`Handler not registered: ${channel}`);
  return call[1] as (...args: unknown[]) => Promise<unknown>;
}

describe("registerIpcHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerIpcHandlers();
  });

  it("모든 IPC 채널을 등록한다", () => {
    const channels = mockIpcHandle.mock.calls.map((c) => c[0]);
    expect(channels).toContain("settings:get");
    expect(channels).toContain("settings:set");
    expect(channels).toContain("shell:showInFolder");
    expect(channels).toContain("shell:openExternal");
    expect(channels).toContain("focusMode:get");
    expect(channels).toContain("focusMode:set");
    expect(channels).toContain("window:resize");
    expect(channels).toContain("app:quit");
  });

  describe("settings:get / settings:set", () => {
    it("getSettings를 호출한다", async () => {
      const handler = getHandler("settings:get");
      await handler({});
      expect(getSettings).toHaveBeenCalled();
    });

    it("setSettings를 호출한다", async () => {
      const settings = {
        patterns: ["test"],
        focusMode: { enabled: false, startTime: "00:00", endTime: "07:00" },
      };
      const handler = getHandler("settings:set");
      await handler({}, settings);
      expect(setSettings).toHaveBeenCalledWith(settings);
    });
  });

  describe("shell:showInFolder / shell:openExternal", () => {
    it("showItemInFolder를 호출한다", async () => {
      const handler = getHandler("shell:showInFolder");
      await handler({}, "/some/path");
      expect(shell.showItemInFolder).toHaveBeenCalledWith("/some/path");
    });

    it("openExternal를 호출한다", async () => {
      const handler = getHandler("shell:openExternal");
      await handler({}, "https://example.com");
      expect(shell.openExternal).toHaveBeenCalledWith("https://example.com");
    });
  });

  describe("focusMode:set", () => {
    it("setFocusMode와 updateFocusModeMonitor를 모두 호출한다", async () => {
      const fm = { enabled: true, startTime: "22:00", endTime: "07:00" };
      const handler = getHandler("focusMode:set");
      await handler({}, fm);

      expect(setFocusMode).toHaveBeenCalledWith(fm);
      expect(updateFocusModeMonitor).toHaveBeenCalledWith(fm);
    });
  });

  describe("window:resize", () => {
    it("윈도우가 없으면 아무 일도 하지 않는다", async () => {
      vi.mocked(getSubWindow).mockReturnValue(null);
      const handler = getHandler("window:resize");
      await handler({}, 300);
      // no error thrown
    });

    it("높이를 MAX_HEIGHT로 클램핑한다", async () => {
      const mockWin = {
        isDestroyed: vi.fn().mockReturnValue(false),
        getSize: vi.fn().mockReturnValue([400, 500]),
        setSize: vi.fn(),
      };
      vi.mocked(getSubWindow).mockReturnValue(mockWin as unknown as Electron.BrowserWindow);

      const handler = getHandler("window:resize");
      await handler({}, 9999);

      expect(mockWin.setSize).toHaveBeenCalledWith(400, 600); // MAX_HEIGHT = 600
    });

    it("높이를 최소 100으로 클램핑한다", async () => {
      const mockWin = {
        isDestroyed: vi.fn().mockReturnValue(false),
        getSize: vi.fn().mockReturnValue([400, 500]),
        setSize: vi.fn(),
      };
      vi.mocked(getSubWindow).mockReturnValue(mockWin as unknown as Electron.BrowserWindow);

      const handler = getHandler("window:resize");
      await handler({}, 10);

      expect(mockWin.setSize).toHaveBeenCalledWith(400, 100);
    });
  });

  describe("app:quit", () => {
    it("app.quit를 호출한다", async () => {
      const handler = getHandler("app:quit");
      await handler({});
      expect(app.quit).toHaveBeenCalled();
    });
  });

  it("채팅 관련 IPC 채널을 등록한다", () => {
    const channels = mockIpcHandle.mock.calls.map((c) => c[0]);
    expect(channels).toContain("chat:send");
    expect(channels).toContain("chat:get-config");
    expect(channels).toContain("chat:set-config");
    expect(channels).toContain("chat:providers");
    expect(channels).toContain("chat:resize");
    expect(channels).toContain("chat:close");
  });

  describe("chat:send", () => {
    it("streamChatMessage를 fire-and-forget으로 호출하고 즉시 success를 반환한다", async () => {
      const handler = getHandler("chat:send");
      const result = await handler({}, "room1", "안녕", []);

      expect(streamChatMessage).toHaveBeenCalledWith("room1", "안녕", [], {
        provider: "openai",
        model: "gpt-4o",
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe("chat:resize", () => {
    it("resizeChatWindow를 호출한다", async () => {
      const handler = getHandler("chat:resize");
      await handler({}, 400);

      expect(resizeChatWindow).toHaveBeenCalledWith(400);
    });
  });

  describe("chat:close", () => {
    it("closeChatWindow를 호출한다", async () => {
      const handler = getHandler("chat:close");
      await handler({});

      expect(closeChatWindow).toHaveBeenCalled();
    });
  });
});
