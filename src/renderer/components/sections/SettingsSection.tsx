/** 앱 설정 탭 섹션 */
import {
  DEFAULT_FOCUS_MODE,
  DEFAULT_SHORTCUTS,
  type FocusMode,
  type ShortcutConfig,
} from "@shared/types";
import { Bell, ExternalLink, KeyRound, Pencil, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useFocusMode, useUpdateFocusMode } from "../../hooks/useFocusMode";
import { useSettings, useUpdateSettings } from "../../hooks/useSettings";
import { useInstallUpdate, useRelaunchApp, useUpdateCheck } from "../../hooks/useUpdate";
import FocusModePanel from "../FocusModePanel";
import ShortcutsPanel from "../ShortcutsPanel";
import ToggleSwitch from "../ToggleSwitch";

type InstallPhase = "idle" | "installing" | "done" | "error";

/**
 * 설정 섹션 컴포넌트
 */
export default function SettingsSection() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: focusMode = DEFAULT_FOCUS_MODE, isLoading: focusLoading } = useFocusMode();
  const updateSettings = useUpdateSettings();
  const updateFocusMode = useUpdateFocusMode();

  const {
    data: updateResult,
    isFetching: updateChecking,
    refetch: recheckUpdate,
  } = useUpdateCheck();
  const installUpdate = useInstallUpdate();
  const { relaunch } = useRelaunchApp();

  const [cooldown, setCooldown] = useState(0);
  const [installPhase, setInstallPhase] = useState<InstallPhase>("idle");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyEditing, setApiKeyEditing] = useState(false);

  const loading = settingsLoading || focusLoading;
  const notificationsEnabled = settings?.notificationsEnabled ?? true;

  // settings 초기 로드 시 API 키 입력창 초기화
  useEffect(() => {
    if (settings?.openaiApiKey && !apiKeyEditing) {
      setApiKeyInput(settings.openaiApiKey);
    }
  }, [settings?.openaiApiKey, apiKeyEditing]);

  const saveApiKey = () => {
    if (!settings) return;
    updateSettings.mutate(
      { ...settings, openaiApiKey: apiKeyInput.trim() },
      { onSuccess: () => setApiKeyEditing(false) },
    );
  };

  const hasSavedApiKey = !!settings?.openaiApiKey;

  const toggleNotifications = async () => {
    if (!settings) return;
    updateSettings.mutate({ ...settings, notificationsEnabled: !notificationsEnabled });
  };

  const saveFocusMode = (updated: FocusMode) => {
    updateFocusMode.mutate(updated);
  };

  const saveShortcuts = (updated: ShortcutConfig) => {
    if (!settings) return;
    updateSettings.mutate({ ...settings, shortcuts: updated });
  };

  const handleCheckForUpdates = async () => {
    const { data } = await recheckUpdate();
    if (data && !data.error && !data.hasUpdate) {
      setCooldown(600);
    }
  };

  const handleInstall = async () => {
    setInstallPhase("installing");
    const result = await installUpdate.mutateAsync();
    setInstallPhase(result.success ? "done" : "error");
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

  const canBrewUpdate = updateResult?.brewStatus === "brew-ready";

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Night Watch 설정 */}
        <div>
          <h3 className="text-xs font-medium text-app-text-muted uppercase tracking-wider mb-3">
            Night Watch
          </h3>
          <div className="glass-card-3d rounded-lg bg-prowl-card backdrop-blur-xl border border-prowl-border">
            <FocusModePanel focusMode={focusMode} onUpdate={saveFocusMode} />
          </div>
        </div>

        {/* 알림 설정 */}
        <div>
          <h3 className="text-xs font-medium text-app-text-muted uppercase tracking-wider mb-3">
            Notifications
          </h3>
          <div className="glass-card-3d p-3 rounded-lg bg-prowl-card backdrop-blur-xl border border-prowl-border">
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

        {/* API 키 설정 */}
        <div>
          <h3 className="text-xs font-medium text-app-text-muted uppercase tracking-wider mb-3">
            API Keys
          </h3>
          <div className="glass-card-3d p-3 rounded-lg bg-prowl-card backdrop-blur-xl border border-prowl-border">
            <div className="flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">OpenAI API Key</p>
                <p className="text-[10px] text-gray-500">Used for Prowl Chat (GPT models)</p>
              </div>
              {hasSavedApiKey && !apiKeyEditing ? (
                <button
                  type="button"
                  onClick={() => setApiKeyEditing(true)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-app-active-bg text-app-text-secondary hover:bg-prowl-border transition-colors shrink-0"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  Change
                </button>
              ) : (
                <div className="flex gap-2 shrink-0">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveApiKey()}
                    placeholder="sk-proj-..."
                    className="w-40 text-[11px] px-2 py-1 rounded bg-app-input-bg border border-app-input-border text-app-text-primary placeholder:text-app-text-ghost outline-none focus:border-accent/50"
                  />
                  <button
                    type="button"
                    onClick={saveApiKey}
                    disabled={updateSettings.isPending}
                    className="px-2 py-1 text-[10px] rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 단축키 설정 */}
        <div>
          <h3 className="text-xs font-medium text-app-text-muted uppercase tracking-wider mb-3">
            Shortcuts
          </h3>
          <div className="glass-card-3d rounded-lg bg-prowl-card backdrop-blur-xl border border-prowl-border">
            <ShortcutsPanel
              shortcuts={settings?.shortcuts ?? DEFAULT_SHORTCUTS}
              onUpdate={saveShortcuts}
            />
          </div>
        </div>

        {/* 링크 */}
        <div>
          <h3 className="text-xs font-medium text-app-text-muted uppercase tracking-wider mb-3">
            Links
          </h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => window.electronAPI.openExternal("https://github.com/BangDori/prowl")}
              className="glass-card-3d w-full flex items-center gap-3 p-3 rounded-lg bg-prowl-card backdrop-blur-xl border border-prowl-border text-left"
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm">GitHub Repository</p>
                <p className="text-[10px] text-gray-500">View source code and contribute</p>
              </div>
            </button>
            <div className="glass-card-3d p-3 rounded-lg bg-prowl-card backdrop-blur-xl border border-prowl-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw
                    className={`w-4 h-4 text-gray-400 ${updateChecking ? "animate-spin" : ""}`}
                  />
                  <div>
                    <p className="text-sm">Check for Updates</p>
                    {!updateResult && !updateChecking && (
                      <p className="text-[10px] text-gray-500">
                        Check if a new version is available
                      </p>
                    )}
                    {updateChecking && <p className="text-[10px] text-gray-500">Checking...</p>}
                    {updateResult && !updateChecking && (
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
                    {installPhase === "done" && (
                      <p className="text-[10px] text-green-400">
                        Update installed. Restart to apply.
                      </p>
                    )}
                    {installPhase === "error" && (
                      <p className="text-[10px] text-red-400">Update failed.</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {updateResult?.hasUpdate &&
                    installPhase === "idle" &&
                    (canBrewUpdate ? (
                      <button
                        type="button"
                        onClick={handleInstall}
                        className="px-2 py-1 text-[10px] rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                      >
                        Update
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => window.electronAPI.openExternal(updateResult.releaseUrl)}
                        className="px-2 py-1 text-[10px] rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                      >
                        Download
                      </button>
                    ))}
                  {installPhase === "installing" && (
                    <span className="text-[10px] text-app-text-muted">Installing...</span>
                  )}
                  {installPhase === "done" && (
                    <button
                      type="button"
                      onClick={relaunch}
                      className="px-2 py-1 text-[10px] rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                    >
                      Restart
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCheckForUpdates}
                    disabled={updateChecking || cooldown > 0}
                    className="px-2 py-1 text-[10px] rounded bg-app-active-bg text-app-text-secondary hover:bg-prowl-border transition-colors disabled:opacity-50"
                  >
                    {updateChecking ? "Checking" : cooldown > 0 ? "Checked" : "Check"}
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
