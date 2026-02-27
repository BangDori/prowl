/** 앱 설정 탭 섹션 */
import {
  DEFAULT_FOCUS_MODE,
  DEFAULT_SHORTCUTS,
  type FocusMode,
  type ShortcutConfig,
} from "@shared/types";
import Bell from "lucide-react/dist/esm/icons/bell";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import KeyRound from "lucide-react/dist/esm/icons/key-round";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import User from "lucide-react/dist/esm/icons/user";
import { useEffect, useState } from "react";
import { useFocusMode, useUpdateFocusMode } from "../../hooks/useFocusMode";
import { useSettings, useUpdateSettings } from "../../hooks/useSettings";
import FocusModePanel from "../FocusModePanel";
import ShortcutsPanel from "../ShortcutsPanel";
import ToggleSwitch from "../ToggleSwitch";
import SettingsUpdateCard from "./SettingsUpdateCard";

export default function SettingsSection() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: focusMode = DEFAULT_FOCUS_MODE, isLoading: focusLoading } = useFocusMode();
  const updateSettings = useUpdateSettings();
  const updateFocusMode = useUpdateFocusMode();

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyEditing, setApiKeyEditing] = useState(false);
  const [oauthLoading, setOAuthLoading] = useState(false);
  const [oauthError, setOAuthError] = useState<string | null>(null);

  const loading = settingsLoading || focusLoading;
  const notificationsEnabled = settings?.notificationsEnabled ?? true;
  const openaiCredential = settings?.openaiCredential;

  // OAuth 연결 상태 확인
  const isOAuthConnected = openaiCredential?.type === "oauth";
  const isApiKeyConnected = openaiCredential?.type === "api" || !!settings?.openaiApiKey;

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

  // OAuth 핸들러
  const handleOAuthLogin = async () => {
    setOAuthLoading(true);
    setOAuthError(null);

    try {
      // 1. 콜백 서버 시작
      await window.electronAPI.startOAuthServer();

      // 2. 콜백 결과 리스너 등록
      const cleanup = window.electronAPI.onOAuthCallbackResult((result) => {
        if (result.type === "success") {
          // 성공: 자격 증명 저장
          if (settings && result.access && result.refresh && result.expires) {
            updateSettings.mutate({
              ...settings,
              openaiCredential: {
                type: "oauth",
                access: result.access,
                refresh: result.refresh,
                expires: result.expires,
                accountId: result.accountId,
              },
            });
          }
          setOAuthLoading(false);
          setOAuthError(null);
        } else {
          // 실패
          setOAuthLoading(false);
          setOAuthError(result.error || "OAuth 로그인에 실패했습니다.");
        }
      });

      // 3. OAuth 인증 URL 생성 및 브라우저에서 열기
      const auth = await window.electronAPI.createOAuthAuthorization();
      await window.electronAPI.openOAuthUrl(auth.url);

      // 4. cleanup 함수 저장 (컴포넌트 언마운트 시 정리)
      return () => cleanup();
    } catch (error) {
      setOAuthLoading(false);
      setOAuthError(error instanceof Error ? error.message : "OAuth 로그인에 실패했습니다.");
    }
  };

  const handleOAuthDisconnect = () => {
    if (!settings) return;
    updateSettings.mutate({
      ...settings,
      openaiCredential: undefined,
    });
  };

  const handleApiKeyDisconnect = () => {
    if (!settings) return;
    updateSettings.mutate({
      ...settings,
      openaiCredential: undefined,
      openaiApiKey: "",
    });
    setApiKeyInput("");
    setApiKeyEditing(false);
  };

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
              <ToggleSwitch isEnabled={notificationsEnabled} onChange={toggleNotifications} />
            </div>
          </div>
        </div>

        {/* OpenAI 인증 설정 */}
        <div>
          <h3 className="text-xs font-medium text-app-text-muted uppercase tracking-wider mb-3">
            OpenAI Authentication
          </h3>

          {/* OAuth 연결 상태 */}
          {isOAuthConnected ? (
            <div className="glass-card-3d p-3 rounded-lg bg-prowl-card backdrop-blur-xl border border-prowl-border mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">OAuth 연결됨</p>
                    <p className="text-[10px] text-gray-500">OpenAI 계정으로 로그인됨</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOAuthDisconnect}
                  disabled={updateSettings.isPending}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-3 h-3" />
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card-3d p-3 rounded-lg bg-prowl-card backdrop-blur-xl border border-prowl-border mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm">OpenAI OAuth Login</p>
                    <p className="text-[10px] text-gray-500">Sign in with your OpenAI account</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOAuthLogin}
                  disabled={oauthLoading || updateSettings.isPending}
                  className="px-3 py-1.5 text-[11px] rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors disabled:opacity-50 font-medium"
                >
                  {oauthLoading ? "Connecting..." : "Connect"}
                </button>
              </div>
              {oauthError && <p className="mt-2 text-[10px] text-yellow-500">{oauthError}</p>}
            </div>
          )}

          {/* API Key 입력 (OAuth 연결 시 비활성화) */}
          <div
            className={`glass-card-3d p-3 rounded-lg bg-prowl-card backdrop-blur-xl border border-prowl-border ${isOAuthConnected ? "opacity-50" : ""}`}
          >
            <div className="flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">API Key {isOAuthConnected && "(OAuth 연결됨)"}</p>
                <p className="text-[10px] text-gray-500">
                  {isOAuthConnected
                    ? "OAuth가 연결되어 있습니다. API Key를 사용하려면 OAuth를 해제해주세요."
                    : "Alternatively, use an OpenAI API Key"}
                </p>
              </div>
              {!isOAuthConnected && (isApiKeyConnected || apiKeyEditing) ? (
                <div className="flex gap-1 shrink-0">
                  {isApiKeyConnected && !apiKeyEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setApiKeyEditing(true)}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-app-active-bg text-app-text-secondary hover:bg-prowl-border transition-colors"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleApiKeyDisconnect}
                        disabled={updateSettings.isPending}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              ) : null}
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
            <SettingsUpdateCard />
          </div>
        </div>
      </div>
    </div>
  );
}
