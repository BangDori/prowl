import { describe, it, expect, vi, beforeEach } from "vitest";

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

import {
  getSettings,
  setSettings,
  getPatterns,
  getFocusMode,
  setFocusMode,
  getAllJobCustomizations,
  setJobCustomization,
} from "./settings";
import { DEFAULT_FOCUS_MODE, DEFAULT_SETTINGS } from "../../shared/types";

describe("settings 서비스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSettings", () => {
    it("저장된 설정을 반환한다", () => {
      const settings = { patterns: ["com.test.*"], focusMode: DEFAULT_FOCUS_MODE };
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
      const settings = { patterns: ["com.app.*"], focusMode: DEFAULT_FOCUS_MODE };
      setSettings(settings);

      expect(mockSet).toHaveBeenCalledWith("settings", settings);
    });
  });

  describe("getPatterns", () => {
    it("settings에서 patterns 배열을 반환한다", () => {
      mockGet.mockReturnValue({ patterns: ["com.claude.*"], focusMode: DEFAULT_FOCUS_MODE });

      expect(getPatterns()).toEqual(["com.claude.*"]);
    });
  });

  describe("getFocusMode", () => {
    it("focusMode가 있으면 반환한다", () => {
      const fm = { enabled: true, startTime: "22:00", endTime: "07:00" };
      mockGet.mockReturnValue({ patterns: [], focusMode: fm });

      expect(getFocusMode()).toEqual(fm);
    });

    it("focusMode가 없으면 DEFAULT_FOCUS_MODE를 반환한다", () => {
      mockGet.mockReturnValue({ patterns: [] });

      expect(getFocusMode()).toEqual(DEFAULT_FOCUS_MODE);
    });
  });

  describe("setFocusMode", () => {
    it("기존 설정을 유지하면서 focusMode를 업데이트한다", () => {
      const existing = { patterns: ["com.test.*"], focusMode: DEFAULT_FOCUS_MODE };
      mockGet.mockReturnValue(existing);

      const newFm = { enabled: true, startTime: "23:00", endTime: "06:00" };
      setFocusMode(newFm);

      expect(mockSet).toHaveBeenCalledWith("settings", {
        patterns: ["com.test.*"],
        focusMode: newFm,
      });
    });
  });

  describe("getAllJobCustomizations", () => {
    it("저장된 커스터마이징을 반환한다", () => {
      const customs = { "com.test.job": { displayName: "테스트" } };
      mockGet.mockReturnValue(customs);

      expect(getAllJobCustomizations()).toEqual(customs);
    });
  });

  describe("setJobCustomization", () => {
    it("특정 작업의 커스터마이징을 저장한다", () => {
      const existing = { "com.old.job": { displayName: "기존" } };
      mockGet.mockReturnValue(existing);

      setJobCustomization("com.new.job", { displayName: "신규" });

      expect(mockSet).toHaveBeenCalledWith("jobCustomizations", {
        "com.old.job": { displayName: "기존" },
        "com.new.job": { displayName: "신규" },
      });
    });
  });
});
