/** 업데이트 확인 카드 — 최신 버전 체크 및 설치 */
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import { useEffect, useState } from "react";
import { useInstallUpdate, useRelaunchApp, useUpdateCheck } from "../../hooks/useUpdate";

type InstallPhase = "idle" | "installing" | "done" | "error";

export default function SettingsUpdateCard() {
  const {
    data: updateResult,
    isFetching: updateChecking,
    refetch: recheckUpdate,
  } = useUpdateCheck();
  const installUpdate = useInstallUpdate();
  const { relaunch } = useRelaunchApp();

  const [cooldown, setCooldown] = useState(0);
  const [installPhase, setInstallPhase] = useState<InstallPhase>("idle");

  const canBrewUpdate = updateResult?.brewStatus === "brew-ready";

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

  return (
    <div className="glass-card-3d p-3 rounded-lg bg-prowl-card backdrop-blur-xl border border-prowl-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${updateChecking ? "animate-spin" : ""}`} />
          <div>
            <p className="text-sm">Check for Updates</p>
            {!updateResult && !updateChecking && (
              <p className="text-[10px] text-gray-500">Check if a new version is available</p>
            )}
            {updateChecking && <p className="text-[10px] text-gray-500">Checking...</p>}
            {updateResult && !updateChecking && (
              <div className="text-[10px]">
                {updateResult.error ? (
                  <p className="text-red-400">{updateResult.error}</p>
                ) : updateResult.hasUpdate ? (
                  <p className="text-accent">
                    v{updateResult.latestVersion} available (current: v{updateResult.currentVersion}
                    )
                  </p>
                ) : (
                  <p className="text-green-400">
                    You're on the latest version (v{updateResult.currentVersion})
                  </p>
                )}
              </div>
            )}
            {installPhase === "done" && (
              <p className="text-[10px] text-green-400">Update installed. Restart to apply.</p>
            )}
            {installPhase === "error" && <p className="text-[10px] text-red-400">Update failed.</p>}
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
  );
}
