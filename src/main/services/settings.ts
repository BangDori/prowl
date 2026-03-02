/** electron-store 기반 앱 설정 읽기/쓰기 */
import {
  type AppSettings,
  type ChatConfig,
  DEFAULT_CHAT_CONFIG,
  DEFAULT_SETTINGS,
} from "@shared/types";
import Store from "electron-store";
import { readSystemPrompt, readTone, writeSystemPrompt, writeTone } from "./personalize";

/** electron-store에 실제 저장되는 스키마 (aiPersonalization은 파일로 분리) */
type StoredSettings = Omit<AppSettings, "aiPersonalization">;

interface StoreSchema {
  settings: StoredSettings;
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
  const stored = (store.get("settings") ?? DEFAULT_SETTINGS) as StoredSettings;
  return {
    ...stored,
    aiPersonalization: {
      systemPromptOverride: readSystemPrompt(),
      toneCustom: readTone(),
    },
  };
}

export function setSettings(settings: AppSettings): void {
  const { aiPersonalization, ...rest } = settings;

  if (aiPersonalization !== undefined) {
    writeSystemPrompt(aiPersonalization.systemPromptOverride ?? "");
    writeTone(aiPersonalization.toneCustom ?? "");
  }

  store.set("settings", rest as StoredSettings);
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

// 즐겨찾기 ChatRoom ID 목록
export function getFavoritedRoomIds(): string[] {
  return getSettings().favoritedRoomIds ?? [];
}

export function toggleFavoritedRoom(roomId: string): void {
  const settings = getSettings();
  const ids = settings.favoritedRoomIds ?? [];
  const next = ids.includes(roomId) ? ids.filter((id) => id !== roomId) : [...ids, roomId];
  setSettings({ ...settings, favoritedRoomIds: next });
}

// Task Manager 창 높이
export function getCompactExpandedHeight(): number {
  return store.get("compactExpandedHeight") ?? 400;
}

export function saveCompactExpandedHeight(height: number): void {
  store.set("compactExpandedHeight", height);
}
