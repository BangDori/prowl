/** 글로벌 단축키 등록/해제 서비스 */

import type { IpcResult, ShortcutConfig } from "@shared/types";
import { globalShortcut } from "electron";
import { toggleChatWindow, toggleCompactWindow } from "../windows";

/** 단축키 액션 → 핸들러 매핑 */
const ACTION_MAP: Record<keyof ShortcutConfig, () => void> = {
  toggleChat: () => toggleChatWindow(),
  toggleTaskManager: () => toggleCompactWindow(),
};

/**
 * 모든 글로벌 단축키를 해제하고, config 기반으로 재등록한다.
 * 빈 문자열인 항목은 건너뛴다 (비활성화).
 */
export function registerGlobalShortcuts(config: ShortcutConfig): IpcResult {
  globalShortcut.unregisterAll();

  const errors: string[] = [];

  for (const [action, accelerator] of Object.entries(config)) {
    if (!accelerator) continue;

    const handler = ACTION_MAP[action as keyof ShortcutConfig];
    if (!handler) continue;

    const ok = globalShortcut.register(accelerator, handler);
    if (!ok) {
      errors.push(`"${accelerator}" 등록 실패 (다른 앱에서 사용 중일 수 있음)`);
    }
  }

  return errors.length > 0 ? { success: false, error: errors.join("; ") } : { success: true };
}
