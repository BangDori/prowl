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

vi.mock("./services/launchd", () => ({
  listAllJobs: vi.fn(),
  findJobById: vi.fn(),
  toggleJob: vi.fn(),
  startJob: vi.fn(),
}));

vi.mock("./services/log-reader", () => ({
  readLogContent: vi.fn(),
}));

vi.mock("./services/settings", () => ({
  getSettings: vi.fn(),
  setSettings: vi.fn(),
  getAllJobCustomizations: vi.fn(),
  setJobCustomization: vi.fn(),
  getFocusMode: vi.fn(),
  setFocusMode: vi.fn(),
  getChatConfig: vi.fn().mockReturnValue({ provider: "openai", model: "gpt-4o" }),
  setChatConfig: vi.fn(),
}));

vi.mock("./services/focus-mode", () => ({
  updateFocusModeMonitor: vi.fn(),
}));

vi.mock("./services/chat", () => ({
  sendChatMessage: vi.fn(),
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
import { sendChatMessage } from "./services/chat";
import { updateFocusModeMonitor } from "./services/focus-mode";
import { findJobById, listAllJobs, startJob, toggleJob } from "./services/launchd";
import { readLogContent } from "./services/log-reader";
import {
  getAllJobCustomizations,
  getSettings,
  setFocusMode,
  setJobCustomization,
  setSettings,
} from "./services/settings";
import { closeChatWindow, getSubWindow, resizeChatWindow } from "./windows";

const mockIpcHandle = vi.mocked(ipcMain.handle);
const mockFindJobById = vi.mocked(findJobById);
const mockListAllJobs = vi.mocked(listAllJobs);

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
    expect(channels).toContain("jobs:list");
    expect(channels).toContain("jobs:refresh");
    expect(channels).toContain("jobs:toggle");
    expect(channels).toContain("jobs:run");
    expect(channels).toContain("jobs:logs");
    expect(channels).toContain("settings:get");
    expect(channels).toContain("settings:set");
    expect(channels).toContain("shell:showInFolder");
    expect(channels).toContain("shell:openExternal");
    expect(channels).toContain("jobs:getCustomizations");
    expect(channels).toContain("jobs:setCustomization");
    expect(channels).toContain("focusMode:get");
    expect(channels).toContain("focusMode:set");
    expect(channels).toContain("window:resize");
    expect(channels).toContain("app:quit");
  });

  describe("jobs:list", () => {
    it("listAllJobs를 호출한다", async () => {
      mockListAllJobs.mockReturnValue([]);
      const handler = getHandler("jobs:list");
      const result = await handler({});
      expect(result).toEqual([]);
      expect(listAllJobs).toHaveBeenCalled();
    });
  });

  describe("jobs:toggle", () => {
    it("작업을 찾을 수 없으면 실패를 반환한다", async () => {
      mockFindJobById.mockReturnValue(null);
      const handler = getHandler("jobs:toggle");
      const result = await handler({}, "nonexistent");
      expect(result).toEqual({ success: false, message: "작업을 찾을 수 없습니다." });
    });

    it("작업을 찾으면 toggleJob을 호출한다", async () => {
      mockFindJobById.mockReturnValue({
        id: "com.test",
        label: "com.test",
        plistPath: "/path.plist",
      } as ReturnType<typeof findJobById>);
      vi.mocked(toggleJob).mockReturnValue({ success: true, message: "ok" });

      const handler = getHandler("jobs:toggle");
      await handler({}, "com.test");

      expect(toggleJob).toHaveBeenCalledWith("/path.plist", "com.test");
    });
  });

  describe("jobs:run", () => {
    it("작업을 찾을 수 없으면 실패를 반환한다", async () => {
      mockFindJobById.mockReturnValue(null);
      const handler = getHandler("jobs:run");
      const result = await handler({}, "nonexistent");
      expect(result).toEqual({ success: false, message: "작업을 찾을 수 없습니다." });
    });

    it("비활성화 상태이면 실패를 반환한다", async () => {
      mockFindJobById.mockReturnValue({
        id: "com.test",
        label: "com.test",
        isLoaded: false,
      } as ReturnType<typeof findJobById>);

      const handler = getHandler("jobs:run");
      const result = await handler({}, "com.test");
      expect(result).toEqual({
        success: false,
        message: "작업이 비활성화 상태입니다. 먼저 활성화해주세요.",
      });
    });

    it("활성화 상태이면 startJob을 호출한다", async () => {
      mockFindJobById.mockReturnValue({
        id: "com.test",
        label: "com.test",
        isLoaded: true,
      } as ReturnType<typeof findJobById>);
      vi.mocked(startJob).mockReturnValue({ success: true, message: "시작됨" });

      const handler = getHandler("jobs:run");
      await handler({}, "com.test");

      expect(startJob).toHaveBeenCalledWith("com.test");
    });
  });

  describe("jobs:logs", () => {
    it("작업을 찾을 수 없으면 에러 메시지를 반환한다", async () => {
      mockFindJobById.mockReturnValue(null);
      const handler = getHandler("jobs:logs");
      const result = await handler({}, "nonexistent");
      expect(result).toEqual({ content: "작업을 찾을 수 없습니다.", lastModified: null });
    });

    it("logPath가 없으면 안내 메시지를 반환한다", async () => {
      mockFindJobById.mockReturnValue({
        id: "com.test",
        logPath: null,
      } as ReturnType<typeof findJobById>);

      const handler = getHandler("jobs:logs");
      const result = await handler({}, "com.test");
      expect(result).toEqual({
        content: "이 작업은 로그 파일이 설정되지 않았습니다.",
        lastModified: null,
      });
    });

    it("logPath가 있으면 readLogContent를 호출한다", async () => {
      mockFindJobById.mockReturnValue({
        id: "com.test",
        logPath: "/tmp/test.log",
      } as ReturnType<typeof findJobById>);
      vi.mocked(readLogContent).mockReturnValue({ content: "log data", lastModified: null });

      const handler = getHandler("jobs:logs");
      await handler({}, "com.test", 100);

      expect(readLogContent).toHaveBeenCalledWith("/tmp/test.log", 100);
    });
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

  describe("jobs:getCustomizations", () => {
    it("getAllJobCustomizations를 호출한다", async () => {
      vi.mocked(getAllJobCustomizations).mockReturnValue({ "com.test": { displayName: "테스트" } });
      const handler = getHandler("jobs:getCustomizations");
      const result = await handler({});
      expect(getAllJobCustomizations).toHaveBeenCalled();
      expect(result).toEqual({ "com.test": { displayName: "테스트" } });
    });
  });

  describe("jobs:setCustomization", () => {
    it("setJobCustomization을 호출한다", async () => {
      const handler = getHandler("jobs:setCustomization");
      await handler({}, "com.test", { displayName: "새이름" });
      expect(setJobCustomization).toHaveBeenCalledWith("com.test", { displayName: "새이름" });
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
    it("getChatConfig 결과와 함께 sendChatMessage를 호출한다", async () => {
      const mockResult = {
        success: true,
        message: { id: "msg_1", role: "assistant" as const, content: "응답", timestamp: 1000 },
      };
      vi.mocked(sendChatMessage).mockResolvedValue(mockResult);

      const handler = getHandler("chat:send");
      const result = await handler({}, "안녕", []);

      expect(sendChatMessage).toHaveBeenCalledWith("안녕", [], {
        provider: "openai",
        model: "gpt-4o",
      });
      expect(result).toEqual(mockResult);
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
