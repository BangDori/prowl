import { DEFAULT_FOCUS_MODE, type FocusMode, type UpdateCheckResult } from "@shared/types";
import { Bell, ExternalLink, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useFocusMode, useUpdateFocusMode } from "../../hooks/useFocusMode";
import { useSettings, useUpdateSettings } from "../../hooks/useSettings";
import FocusModePanel from "../FocusModePanel";
import ToggleSwitch from "../ToggleSwitch";

type UpdateStatus = "idle" | "checking" | "checked";

/**
 * 설정 섹션 컴포넌트
 */
export default function SettingsSection() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: focusMode = DEFAULT_FOCUS_MODE, isLoading: focusLoading } = useFocusMode();
  const updateSettings = useUpdateSettings();
  const updateFocusMode = useUpdateFocusMode();

  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const loading = settingsLoading || focusLoading;
  const notificationsEnabled = settings?.notificationsEnabled ?? true;

  const toggleNotifications = async () => {
    if (!settings) return;
    updateSettings.mutate({ ...settings, notificationsEnabled: !notificationsEnabled });
  };

  const saveFocusMode = (updated: FocusMode) => {
    updateFocusMode.mutate(updated);
  };

  const handleCheckForUpdates = async () => {
    setUpdateStatus("checking");
    const result = await window.electronAPI.checkForUpdates();
    setUpdateResult(result);
    setUpdateStatus("checked");

    // 최신 버전이면 10분 쿨다운
    if (!result.error && !result.hasUpdate) {
      setCooldown(600);
    }
  };

  // 쿨다운 타이머
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

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
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Night Watch
          </h3>
          <div className="rounded-lg bg-prowl-card border border-prowl-border">
            <FocusModePanel focusMode={focusMode} onUpdate={saveFocusMode} />
          </div>
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
            <div className="p-3 rounded-lg bg-prowl-card border border-prowl-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw
                    className={`w-4 h-4 text-gray-400 ${updateStatus === "checking" ? "animate-spin" : ""}`}
                  />
                  <div>
                    <p className="text-sm">Check for Updates</p>
                    {updateStatus === "idle" && (
                      <p className="text-[10px] text-gray-500">
                        Check if a new version is available
                      </p>
                    )}
                    {updateStatus === "checking" && (
                      <p className="text-[10px] text-gray-500">Checking...</p>
                    )}
                    {updateStatus === "checked" && updateResult && (
                      <div className="text-[10px]">
                        {updateResult.error ? (
                          <p className="text-red-400">{updateResult.error}</p>
                        ) : updateResult.hasUpdate ? (
                          <p className="text-accent">
                            v{updateResult.latestVersion} available (current: v
                            {updateResult.currentVersion})
                          </p>
                        ) : (
                          <p className="text-green-400">
                            You're on the latest version (v{updateResult.currentVersion})
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {updateStatus === "checked" && updateResult?.hasUpdate && (
                    <button
                      type="button"
                      onClick={() => window.electronAPI.openExternal(updateResult.releaseUrl)}
                      className="px-2 py-1 text-[10px] rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                    >
                      Download
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCheckForUpdates}
                    disabled={updateStatus === "checking" || cooldown > 0}
                    className="px-2 py-1 text-[10px] rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    {updateStatus === "checking" ? "Checking" : cooldown > 0 ? "Checked" : "Check"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
