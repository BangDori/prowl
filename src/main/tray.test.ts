import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTrayInstance = {
  setToolTip: vi.fn(),
  on: vi.fn(),
  getBounds: vi.fn(),
  popUpContextMenu: vi.fn(),
};

vi.mock("electron", () => ({
  Tray: vi.fn().mockImplementation(() => mockTrayInstance),
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadURL: vi.fn(),
    once: vi.fn(),
    on: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    isDestroyed: vi.fn().mockReturnValue(false),
    getSize: vi.fn().mockReturnValue([400, 500]),
    setSize: vi.fn(),
  })),
  Menu: {
    buildFromTemplate: vi.fn().mockReturnValue({}),
  },
  nativeImage: {
    createEmpty: vi.fn().mockReturnValue({
      isEmpty: vi.fn().mockReturnValue(true),
      setTemplateImage: vi.fn(),
    }),
    createFromPath: vi.fn().mockReturnValue({
      isEmpty: vi.fn().mockReturnValue(false),
      setTemplateImage: vi.fn(),
    }),
  },
  app: { quit: vi.fn() },
  shell: { openExternal: vi.fn() },
}));

import { Tray, Menu } from "electron";
import { createTray, getTray, getSubWindow } from "./tray";

describe("tray", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTray", () => {
    it("Tray 인스턴스를 생성하고 반환한다", () => {
      const tray = createTray();

      expect(Tray).toHaveBeenCalled();
      expect(mockTrayInstance.setToolTip).toHaveBeenCalledWith("Prowl");
      expect(tray).toBe(mockTrayInstance);
    });

    it("컨텍스트 메뉴를 구성한다", () => {
      createTray();

      expect(Menu.buildFromTemplate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: "백그라운드 모니터링" }),
          expect.objectContaining({ label: "Prowl 종료" }),
        ]),
      );
    });

    it("click과 right-click 이벤트를 등록한다", () => {
      createTray();

      const events = mockTrayInstance.on.mock.calls.map((c: unknown[]) => c[0]);
      expect(events).toContain("click");
      expect(events).toContain("right-click");
    });
  });

  describe("getTray", () => {
    it("createTray 호출 후 트레이 인스턴스를 반환한다", () => {
      createTray();
      expect(getTray()).toBe(mockTrayInstance);
    });
  });

  describe("getSubWindow", () => {
    it("초기 상태에서 null을 반환한다", () => {
      expect(getSubWindow()).toBeNull();
    });
  });
});
