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
  getChatConfig: vi.fn().mockReturnValue({ provider: "openai", model: "gpt-5-mini" }),
  setChatConfig: vi.fn(),
  getFavoritedRoomIds: vi.fn().mockReturnValue([]),
  toggleFavoritedRoom: vi.fn(),
}));

vi.mock("./services/chat-rooms", () => ({
  listChatRooms: vi.fn().mockReturnValue([]),
  createChatRoom: vi.fn(),
  getChatRoom: vi.fn(),
  deleteChatRoom: vi.fn(),
  saveChatMessages: vi.fn(),
  toggleChatRoomLock: vi.fn(),
}));

vi.mock("./services/chat", () => ({
  streamChatMessage: vi.fn().mockResolvedValue(undefined),
  getProviderStatuses: vi.fn().mockReturnValue([]),
  setPageContext: vi.fn(),
}));

vi.mock("./windows", () => ({
  getSubWindow: vi.fn(),
  getCompactWindow: vi.fn(),
  getChatWindow: vi.fn(),
  popUpTrayMenu: vi.fn(),
  resizeChatWindow: vi.fn(),
  closeChatWindow: vi.fn(),
  toggleChatWindow: vi.fn(),
  toggleExpandChatWindow: vi.fn().mockReturnValue(false),
  toggleCompactWindow: vi.fn(),
}));

vi.mock("./services/approval", () => ({
  resolveApproval: vi.fn().mockReturnValue(true),
}));

vi.mock("./services/chat-read-state", () => ({
  getAllUnreadCounts: vi.fn().mockReturnValue({}),
  markRoomAsRead: vi.fn(),
  removeRoomReadState: vi.fn(),
  updateTrayBadge: vi.fn(),
}));

import { app, ipcMain, shell } from "electron";
import { registerIpcHandlers } from "./ipc";
import { resolveApproval } from "./services/approval";
import { setPageContext, streamChatMessage } from "./services/chat";
import { listChatRooms } from "./services/chat-rooms";
import {
  getFavoritedRoomIds,
  getSettings,
  setSettings,
  toggleFavoritedRoom,
} from "./services/settings";
import { closeChatWindow, getSubWindow, resizeChatWindow, toggleChatWindow } from "./windows";

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
    expect(channels).toContain("shell:show-in-folder");
    expect(channels).toContain("shell:open-external");
    expect(channels).toContain("window:resize");
    expect(channels).toContain("app:quit");
    expect(channels).toContain("chat-rooms:list");
    expect(channels).toContain("chat-rooms:toggle-favorite");
  });

  describe("settings:get / settings:set", () => {
    it("getSettings를 호출한다", async () => {
      const handler = getHandler("settings:get");
      await handler({});
      expect(getSettings).toHaveBeenCalled();
    });

    it("setSettings를 호출한다", async () => {
      const incoming = {
        patterns: ["test"],
        favoritedRoomIds: [],
      };
      vi.mocked(getSettings).mockReturnValue({ ...incoming } as never);

      const handler = getHandler("settings:set");
      await handler({}, incoming);
      expect(setSettings).toHaveBeenCalledWith(incoming);
    });

    it("favoritedRoomIds는 현재 저장된 값을 유지한다 (Dashboard stale 캐시 덮어쓰기 방지)", async () => {
      const stored = { favoritedRoomIds: ["roomA", "roomB"] };
      vi.mocked(getSettings).mockReturnValue(stored as never);

      const incomingWithStale = {
        favoritedRoomIds: [], // Dashboard stale 캐시 (빈 배열)
      };
      const handler = getHandler("settings:set");
      await handler({}, incomingWithStale);

      expect(setSettings).toHaveBeenCalledWith({
        ...incomingWithStale,
        favoritedRoomIds: ["roomA", "roomB"], // 현재 저장된 값 유지
      });
    });
  });

  describe("shell:show-in-folder / shell:open-external", () => {
    it("showItemInFolder를 호출한다", async () => {
      const handler = getHandler("shell:show-in-folder");
      await handler({}, "/some/path");
      expect(shell.showItemInFolder).toHaveBeenCalledWith("/some/path");
    });

    it("openExternal를 호출한다", async () => {
      const handler = getHandler("shell:open-external");
      await handler({}, "https://example.com");
      expect(shell.openExternal).toHaveBeenCalledWith("https://example.com");
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
    expect(channels).toContain("chat:toggle");
    expect(channels).toContain("chat:approve-tool");
    expect(channels).toContain("chat:reject-tool");
    expect(channels).toContain("chat:set-page-context");
  });

  describe("chat:toggle", () => {
    it("toggleChatWindow를 호출하고 success를 반환한다", async () => {
      const handler = getHandler("chat:toggle");
      const result = await handler({});

      expect(toggleChatWindow).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it("예외 발생 시 success: false를 반환한다", async () => {
      vi.mocked(toggleChatWindow).mockImplementationOnce(() => {
        throw new Error("window error");
      });

      const handler = getHandler("chat:toggle");
      const result = await handler({});

      expect(result).toEqual({ success: false, error: "Error: window error" });
    });
  });

  describe("chat:approve-tool / chat:reject-tool", () => {
    it("approve-tool: resolveApproval(id, true)를 호출하고 success를 반환한다", async () => {
      vi.mocked(resolveApproval).mockReturnValue(true);

      const handler = getHandler("chat:approve-tool");
      const result = await handler({}, "approval-123");

      expect(resolveApproval).toHaveBeenCalledWith("approval-123", true);
      expect(result).toEqual({ success: true });
    });

    it("reject-tool: resolveApproval(id, false)를 호출한다", async () => {
      vi.mocked(resolveApproval).mockReturnValue(true);

      const handler = getHandler("chat:reject-tool");
      const result = await handler({}, "approval-123");

      expect(resolveApproval).toHaveBeenCalledWith("approval-123", false);
      expect(result).toEqual({ success: true });
    });

    it("pending에 없는 id면 success: false 반환", async () => {
      vi.mocked(resolveApproval).mockReturnValue(false);

      const handler = getHandler("chat:approve-tool");
      const result = await handler({}, "not-exist");

      expect(result).toEqual({ success: false });
    });
  });

  describe("chat:set-page-context", () => {
    it("페이지 컨텍스트를 설정하고 success를 반환한다", async () => {
      const handler = getHandler("chat:set-page-context");
      const ctx = { url: "https://example.com", title: "Example", text: "본문 내용" };
      const result = await handler({}, ctx);

      expect(setPageContext).toHaveBeenCalledWith(ctx);
      expect(result).toEqual({ success: true });
    });

    it("null을 전달하면 컨텍스트를 초기화한다", async () => {
      const handler = getHandler("chat:set-page-context");
      const result = await handler({}, null);

      expect(setPageContext).toHaveBeenCalledWith(null);
      expect(result).toEqual({ success: true });
    });
  });

  describe("chat:send", () => {
    it("streamChatMessage를 fire-and-forget으로 호출하고 즉시 success를 반환한다", async () => {
      const handler = getHandler("chat:send");
      const result = await handler({}, "room1", "안녕", []);

      expect(streamChatMessage).toHaveBeenCalledWith("room1", "안녕", [], {
        provider: "openai",
        model: "gpt-5-mini",
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

  describe("chat-rooms:list", () => {
    it("getFavoritedRoomIds 결과를 listChatRooms에 전달한다", async () => {
      const favIds = ["room1", "room2"];
      vi.mocked(getFavoritedRoomIds).mockReturnValue(favIds);
      vi.mocked(listChatRooms).mockReturnValue([]);

      const handler = getHandler("chat-rooms:list");
      await handler({});

      expect(getFavoritedRoomIds).toHaveBeenCalled();
      expect(listChatRooms).toHaveBeenCalledWith(favIds);
    });
  });

  describe("chat-rooms:toggle-favorite", () => {
    it("toggleFavoritedRoom을 호출하고 success를 반환한다", async () => {
      const handler = getHandler("chat-rooms:toggle-favorite");
      const result = await handler({}, "roomA");

      expect(toggleFavoritedRoom).toHaveBeenCalledWith("roomA");
      expect(result).toEqual({ success: true });
    });

    it("예외 발생 시 success: false를 반환한다", async () => {
      vi.mocked(toggleFavoritedRoom).mockImplementationOnce(() => {
        throw new Error("store error");
      });

      const handler = getHandler("chat-rooms:toggle-favorite");
      const result = await handler({}, "roomA");

      expect(result).toEqual({ success: false, error: "Error: store error" });
    });
  });
});
