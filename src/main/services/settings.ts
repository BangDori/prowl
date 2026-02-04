import Store from "electron-store";
import {
  type AppSettings,
  DEFAULT_FOCUS_MODE,
  DEFAULT_SETTINGS,
  type FocusMode,
  type JobCustomization,
  type JobCustomizations,
} from "../../shared/types";

interface StoreSchema {
  settings: AppSettings;
  jobCustomizations: JobCustomizations;
}

const store = new Store<StoreSchema>({
  defaults: {
    settings: DEFAULT_SETTINGS,
    jobCustomizations: {},
  },
});

export function getSettings(): AppSettings {
  return store.get("settings") ?? DEFAULT_SETTINGS;
}

export function setSettings(settings: AppSettings): void {
  store.set("settings", settings);
}

export function getPatterns(): string[] {
  return getSettings().patterns;
}

export function getFocusMode(): FocusMode {
  return getSettings().focusMode ?? DEFAULT_FOCUS_MODE;
}

export function setFocusMode(focusMode: FocusMode): void {
  const settings = getSettings();
  setSettings({ ...settings, focusMode });
}

// 작업 커스터마이징 관련 함수들
export function getAllJobCustomizations(): JobCustomizations {
  return store.get("jobCustomizations");
}

export function setJobCustomization(jobId: string, customization: JobCustomization): void {
  const customizations = store.get("jobCustomizations");
  customizations[jobId] = customization;
  store.set("jobCustomizations", customizations);
}

// 알림 설정
export function isNotificationsEnabled(): boolean {
  return getSettings().notificationsEnabled ?? true;
}
