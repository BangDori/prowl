import { useCallback, useEffect, useState } from "react";
import { DEFAULT_FOCUS_MODE, type FocusMode } from "../shared/types";
import BackgroundMonitor from "./components/BackgroundMonitor";
import FocusModePanel from "./components/FocusModePanel";
import NightNudgeSplash from "./components/NightNudgeSplash";
import { useAutoResize } from "./hooks/useAutoResize";

function getHashRoute(): string {
  return window.location.hash.replace("#", "") || "";
}

export default function App() {
  const [route, setRoute] = useState(getHashRoute);
  const [focusMode, setFocusMode] = useState<FocusMode>(DEFAULT_FOCUS_MODE);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
  const containerRef = useAutoResize();

  useEffect(() => {
    const onHashChange = () => setRoute(getHashRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    window.electronAPI.getFocusMode().then(setFocusMode);
  }, []);

  useEffect(() => {
    return window.electronAPI.onFocusNudge((message) => {
      setNudgeMessage(message);
    });
  }, []);

  const saveFocusMode = useCallback(async (updated: FocusMode) => {
    setFocusMode(updated);
    await window.electronAPI.setFocusMode(updated);
  }, []);

  const closeWindow = useCallback(() => {
    window.close();
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100"
    >
      {nudgeMessage && (
        <NightNudgeSplash message={nudgeMessage} onDismiss={() => setNudgeMessage(null)} />
      )}
      {route === "monitor" ? (
        <BackgroundMonitor onBack={closeWindow} />
      ) : route === "quiet-hours" ? (
        <FocusModePanel focusMode={focusMode} onUpdate={saveFocusMode} onBack={closeWindow} />
      ) : (
        <div className="p-4 text-sm text-gray-500">Loading...</div>
      )}
    </div>
  );
}
