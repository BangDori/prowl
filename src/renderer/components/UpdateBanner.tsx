/** 사이드바 하단 업데이트 인디케이터 */
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import X from "lucide-react/dist/esm/icons/x";
import { useState } from "react";
import { useInstallUpdate, useRelaunchApp, useUpdateCheck } from "../hooks/useUpdate";

type InstallPhase = "idle" | "installing" | "done" | "error";

/**
 * 업데이트 인디케이터 컴포넌트
 *
 * 사이드바 하단에 표시.
 * brew로 설치된 경우에만 업데이트 알림 노출.
 */
export default function UpdateBanner() {
  const { data: updateResult } = useUpdateCheck();
  const installUpdate = useInstallUpdate();
  const { relaunch } = useRelaunchApp();
  const [dismissed, setDismissed] = useState(false);
  const [phase, setPhase] = useState<InstallPhase>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  if (dismissed || !updateResult?.canBrewUpgrade) return null;

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
    <div className="mx-2 mb-3 px-3 py-2.5 rounded-lg bg-accent/8 border border-accent/15">
      {/* Header row: icon + version + dismiss */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <RefreshCw
            className={`w-3.5 h-3.5 ${phase === "installing" ? "text-accent animate-spin" : phase === "done" ? "text-green-400" : "text-accent"}`}
          />
          <span className="text-[11px] font-medium text-app-text-secondary">
            {phase === "idle" && (
              <>
                <span className="text-accent">v{updateResult.latestVersion}</span>
                <span className="text-gray-500 ml-1">available</span>
              </>
            )}
            {phase === "installing" && "Installing..."}
            {phase === "done" && <span className="text-green-400">Ready to restart</span>}
            {phase === "error" && <span className="text-red-400">Update failed</span>}
          </span>
        </div>

        {phase !== "installing" && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-0.5 text-gray-600 hover:text-gray-400 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Progress bar during install */}
      {phase === "installing" && (
        <div className="h-1 rounded-full bg-app-hover-bg overflow-hidden mb-1.5">
          <div className="h-full bg-accent/60 rounded-full animate-pulse w-2/3" />
        </div>
      )}

      {/* Error message */}
      {phase === "error" && <p className="text-[10px] text-red-400/80 truncate">{errorMsg}</p>}

      {/* Action button */}
      {phase === "idle" && (
        <button
          type="button"
          onClick={handleInstall}
          className="w-full py-1 text-[11px] rounded-md bg-accent/15 text-accent hover:bg-accent/25 transition-colors font-medium"
        >
          Update now
        </button>
      )}
      {phase === "done" && (
        <button
          type="button"
          onClick={relaunch}
          className="w-full py-1 text-[11px] rounded-md bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors font-medium flex items-center justify-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Restart
        </button>
      )}
    </div>
  );
}
