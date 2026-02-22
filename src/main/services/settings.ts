/** electron-store 기반 앱 설정 읽기/쓰기 */
import {
  type AppSettings,
  type ChatConfig,
  DEFAULT_CHAT_CONFIG,
  DEFAULT_FOCUS_MODE,
  DEFAULT_SETTINGS,
  type FocusMode,
} from "@shared/types";
import Store from "electron-store";

interface StoreSchema {
  settings: AppSettings;
  chatConfig: ChatConfig;
  compactExpandedHeight?: number;
}

const store = new Store<StoreSchema>({
  defaults: {
    settings: DEFAULT_SETTINGS,
    chatConfig: DEFAULT_CHAT_CONFIG,
  },
});

export function getSettings(): AppSettings {
  return store.get("settings") ?? DEFAULT_SETTINGS;
}

export function setSettings(settings: AppSettings): void {
  store.set("settings", settings);
}

export function getFocusMode(): FocusMode {
  return getSettings().focusMode ?? DEFAULT_FOCUS_MODE;
}

export function setFocusMode(focusMode: FocusMode): void {
  const settings = getSettings();
  setSettings({ ...settings, focusMode });
}

// 알림 설정
export function isNotificationsEnabled(): boolean {
  return getSettings().notificationsEnabled ?? true;
}

// 채팅 설정
export function getChatConfig(): ChatConfig {
  return store.get("chatConfig") ?? DEFAULT_CHAT_CONFIG;
}

export function setChatConfig(config: ChatConfig): void {
  store.set("chatConfig", config);
}

// Task Manager 창 높이
export function getCompactExpandedHeight(): number {
  return store.get("compactExpandedHeight") ?? 400;
}

export function saveCompactExpandedHeight(height: number): void {
  store.set("compactExpandedHeight", height);
}
