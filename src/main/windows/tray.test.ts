/** 트레이 유닛 테스트 */
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    setVisibleOnAllWorkspaces: vi.fn(),
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
  screen: {
    getCursorScreenPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    getDisplayNearestPoint: vi.fn().mockReturnValue({
      id: 1,
      workArea: { x: 0, y: 0, width: 1920, height: 1080 },
    }),
  },
}));

import { Menu, Tray } from "electron";
import { createTray, getSubWindow, getTray, popUpTrayMenu } from "./tray";

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
      popUpTrayMenu();

      expect(Menu.buildFromTemplate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: "Background Monitor" }),
          expect.objectContaining({ label: "Quit Prowl" }),
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
