/** 업데이트 가능 알림 배너 */
import { Download, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { useInstallUpdate, useRelaunchApp, useUpdateCheck } from "../hooks/useUpdate";

type InstallPhase = "idle" | "installing" | "done" | "error";

/**
 * 업데이트 배너 컴포넌트
 *
 * DashboardLayout 헤더 아래에 표시.
 * 업데이트 없으면 null 렌더링.
 */
export default function UpdateBanner() {
  const { data: updateResult } = useUpdateCheck();
  const installUpdate = useInstallUpdate();
  const { relaunch } = useRelaunchApp();
  const [dismissed, setDismissed] = useState(false);
  const [phase, setPhase] = useState<InstallPhase>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  if (dismissed || !updateResult?.hasUpdate) return null;

  const canBrewUpdate = updateResult.brewStatus === "brew-ready";

  const handleInstall = async () => {
    setPhase("installing");
    const result = await installUpdate.mutateAsync();
    if (result.success) {
      setPhase("done");
    } else {
      setPhase("error");
      setErrorMsg(result.error ?? "업데이트에 실패했습니다.");
    }
  };

  return (
    <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm min-w-0">
        {phase === "installing" ? (
          <RefreshCw className="w-4 h-4 text-accent animate-spin flex-shrink-0" />
        ) : (
          <Download className="w-4 h-4 text-accent flex-shrink-0" />
        )}

        {phase === "idle" && (
          <span className="truncate">
            <span className="text-accent font-medium">v{updateResult.latestVersion}</span>
            <span className="text-gray-400 ml-1">available</span>
          </span>
        )}
        {phase === "installing" && <span className="text-gray-400">Installing update...</span>}
        {phase === "done" && (
          <span className="text-green-400">Update installed. Restart to apply.</span>
        )}
        {phase === "error" && <span className="text-red-400 truncate">{errorMsg}</span>}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {phase === "idle" && canBrewUpdate && (
          <button
            type="button"
            onClick={handleInstall}
            className="px-2 py-1 text-[10px] rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
          >
            Update
          </button>
        )}
        {phase === "idle" && !canBrewUpdate && (
          <button
            type="button"
            onClick={() => window.electronAPI.openExternal(updateResult.releaseUrl)}
            className="px-2 py-1 text-[10px] rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
          >
            Download
          </button>
        )}
        {phase === "done" && (
          <button
            type="button"
            onClick={relaunch}
            className="px-2 py-1 text-[10px] rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Restart
          </button>
        )}
        {phase !== "installing" && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
