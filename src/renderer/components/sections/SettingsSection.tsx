import { DEFAULT_FOCUS_MODE, type FocusMode } from "@shared/types";
import { Bell, ExternalLink, Moon, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import FocusModePanel from "../FocusModePanel";
import ToggleSwitch from "../ToggleSwitch";

/**
 * 설정 섹션 컴포넌트
 *
 * 앱의 전체 설정을 관리합니다.
 * - Night Watch (집중 모드) 설정
 * - 알림 설정 (활성화/비활성화)
 * - 외부 링크 (GitHub, 릴리즈)
 */
export default function SettingsSection() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [focusMode, setFocusMode] = useState<FocusMode>(DEFAULT_FOCUS_MODE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([window.electronAPI.getSettings(), window.electronAPI.getFocusMode()]).then(
      ([settings, focus]) => {
        setNotificationsEnabled(settings.notificationsEnabled);
        setFocusMode(focus);
        setLoading(false);
      },
    );
  }, []);

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    const current = await window.electronAPI.getSettings();
    await window.electronAPI.setSettings({ ...current, notificationsEnabled: newValue });
  };

  const saveFocusMode = useCallback(async (updated: FocusMode) => {
    setFocusMode(updated);
    await window.electronAPI.setFocusMode(updated);
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="skeleton h-4 w-32" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Night Watch 설정 */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Moon className="w-3.5 h-3.5" />
            Night Watch
          </h3>
          <FocusModePanel focusMode={focusMode} onUpdate={saveFocusMode} />
        </div>

        {/* 알림 설정 */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Notifications
          </h3>
          <div className="p-3 rounded-lg bg-prowl-card border border-prowl-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm">Enable Notifications</p>
                  <p className="text-[10px] text-gray-500">Show alerts when jobs complete</p>
                </div>
              </div>
              <ToggleSwitch enabled={notificationsEnabled} onChange={toggleNotifications} />
            </div>
          </div>
        </div>

        {/* 링크 */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Links</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => window.electronAPI.openExternal("https://github.com/BangDori/prowl")}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-prowl-card border border-prowl-border text-left hover:border-gray-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm">GitHub Repository</p>
                <p className="text-[10px] text-gray-500">View source code and contribute</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() =>
                window.electronAPI.openExternal("https://github.com/BangDori/prowl/releases")
              }
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-prowl-card border border-prowl-border text-left hover:border-gray-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm">Check for Updates</p>
                <p className="text-[10px] text-gray-500">View latest releases</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
