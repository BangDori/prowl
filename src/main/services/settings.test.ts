/** 설정 서비스 유닛 테스트 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted ensures these are available before vi.mock factory runs
const {
  mockGet,
  mockSet,
  mockReadSystemPrompt,
  mockReadTone,
  mockWriteSystemPrompt,
  mockWriteTone,
} = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockReadSystemPrompt: vi.fn().mockReturnValue(""),
  mockReadTone: vi.fn().mockReturnValue(""),
  mockWriteSystemPrompt: vi.fn(),
  mockWriteTone: vi.fn(),
}));

vi.mock("electron-store", () => ({
  default: class {
    get = mockGet;
    set = mockSet;
  },
}));

vi.mock("./personalize", () => ({
  readSystemPrompt: mockReadSystemPrompt,
  readTone: mockReadTone,
  writeSystemPrompt: mockWriteSystemPrompt,
  writeTone: mockWriteTone,
  ensurePersonalizeDir: vi.fn(),
}));

import { DEFAULT_SETTINGS } from "@shared/types";
import { getFavoritedRoomIds, getSettings, setSettings, toggleFavoritedRoom } from "./settings";

describe("settings 서비스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadSystemPrompt.mockReturnValue("");
    mockReadTone.mockReturnValue("");
  });

  describe("getSettings", () => {
    it("저장된 설정에 aiPersonalization을 파일에서 병합해 반환한다", () => {
      const stored = { notificationsEnabled: true, favoritedRoomIds: [] };
      mockGet.mockReturnValue(stored);
      mockReadSystemPrompt.mockReturnValue("custom prompt");
      mockReadTone.mockReturnValue("formal");

      const result = getSettings();

      expect(result).toMatchObject(stored);
      expect(result.aiPersonalization).toEqual({
        systemPromptOverride: "custom prompt",
        toneCustom: "formal",
      });
    });

    it("값이 없으면 DEFAULT_SETTINGS에 빈 aiPersonalization을 병합한다", () => {
      mockGet.mockReturnValue(null);

      const result = getSettings();

      expect(result).toMatchObject(DEFAULT_SETTINGS);
      expect(result.aiPersonalization).toEqual({ systemPromptOverride: "", toneCustom: "" });
    });
  });

  describe("setSettings", () => {
    it("aiPersonalization을 파일로 쓰고 나머지는 store에 저장한다", () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        aiPersonalization: { systemPromptOverride: "my prompt", toneCustom: "casual" },
      };

      setSettings(settings);

      expect(mockWriteSystemPrompt).toHaveBeenCalledWith("my prompt");
      expect(mockWriteTone).toHaveBeenCalledWith("casual");
      expect(mockSet).toHaveBeenCalledWith("settings", DEFAULT_SETTINGS);
    });

    it("aiPersonalization이 없어도 store에 정상 저장한다", () => {
      setSettings(DEFAULT_SETTINGS);

      expect(mockWriteSystemPrompt).not.toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith("settings", DEFAULT_SETTINGS);
    });
  });

  describe("getFavoritedRoomIds", () => {
    it("favoritedRoomIds가 있으면 반환한다", () => {
      mockGet.mockReturnValue({ ...DEFAULT_SETTINGS, favoritedRoomIds: ["roomA", "roomB"] });

      expect(getFavoritedRoomIds()).toEqual(["roomA", "roomB"]);
    });

    it("favoritedRoomIds가 없으면 빈 배열을 반환한다", () => {
      mockGet.mockReturnValue({});

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
      mockGet.mockReturnValue({ notificationsEnabled: true });

      toggleFavoritedRoom("roomX");

      expect(mockSet).toHaveBeenCalledWith("settings", {
        notificationsEnabled: true,
        favoritedRoomIds: ["roomX"],
      });
    });
  });
});
