/** 설정 서비스 유닛 테스트 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted ensures these are available before vi.mock factory runs
const { mockGet, mockSet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
}));

vi.mock("electron-store", () => ({
  default: class {
    get = mockGet;
    set = mockSet;
  },
}));

import { DEFAULT_SETTINGS } from "@shared/types";
import { getFavoritedRoomIds, getSettings, setSettings, toggleFavoritedRoom } from "./settings";

describe("settings 서비스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSettings", () => {
    it("저장된 설정을 반환한다", () => {
      const settings = { patterns: ["com.test.*"] };
      mockGet.mockReturnValue(settings);

      expect(getSettings()).toEqual(settings);
      expect(mockGet).toHaveBeenCalledWith("settings");
    });

    it("값이 없으면 DEFAULT_SETTINGS를 반환한다", () => {
      mockGet.mockReturnValue(null);

      expect(getSettings()).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe("setSettings", () => {
    it("설정을 저장한다", () => {
      const settings = { patterns: ["com.app.*"] };
      setSettings(settings);

      expect(mockSet).toHaveBeenCalledWith("settings", settings);
    });
  });

  describe("getFavoritedRoomIds", () => {
    it("favoritedRoomIds가 있으면 반환한다", () => {
      mockGet.mockReturnValue({ ...DEFAULT_SETTINGS, favoritedRoomIds: ["roomA", "roomB"] });

      expect(getFavoritedRoomIds()).toEqual(["roomA", "roomB"]);
    });

    it("favoritedRoomIds가 없으면 빈 배열을 반환한다", () => {
      mockGet.mockReturnValue({}); // 필드 없음

      expect(getFavoritedRoomIds()).toEqual([]);
    });
  });

  describe("toggleFavoritedRoom", () => {
    it("없는 방을 추가한다", () => {
      mockGet.mockReturnValue({ ...DEFAULT_SETTINGS, favoritedRoomIds: [] });

      toggleFavoritedRoom("roomA");

      expect(mockSet).toHaveBeenCalledWith("settings", {
        ...DEFAULT_SETTINGS,
        favoritedRoomIds: ["roomA"],
      });
    });

    it("이미 있는 방은 제거한다", () => {
      mockGet.mockReturnValue({ ...DEFAULT_SETTINGS, favoritedRoomIds: ["roomA", "roomB"] });

      toggleFavoritedRoom("roomA");

      expect(mockSet).toHaveBeenCalledWith("settings", {
        ...DEFAULT_SETTINGS,
        favoritedRoomIds: ["roomB"],
      });
    });

    it("favoritedRoomIds 필드가 없는 기존 설정에서도 동작한다 (마이그레이션 시나리오)", () => {
      // 리팩터링 전 저장된 설정 (favoritedRoomIds 없음)
      mockGet.mockReturnValue({ notificationsEnabled: true });

      toggleFavoritedRoom("roomX");

      expect(mockSet).toHaveBeenCalledWith("settings", {
        notificationsEnabled: true,
        favoritedRoomIds: ["roomX"],
      });
    });
  });
});
