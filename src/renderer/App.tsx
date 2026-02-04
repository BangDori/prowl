import { useCallback, useEffect, useState } from "react";
import { DEFAULT_FOCUS_MODE, type FocusMode } from "../shared/types";
import BackgroundMonitor from "./components/BackgroundMonitor";
import ChatView from "./components/ChatView";
import Dashboard from "./components/Dashboard";
import FocusModePanel from "./components/FocusModePanel";
import { useAutoResize } from "./hooks/useAutoResize";

function getHashRoute(): string {
  return window.location.hash.replace("#", "") || "";
}

export default function App() {
  const [route, setRoute] = useState(getHashRoute);
  const [focusMode, setFocusMode] = useState<FocusMode>(DEFAULT_FOCUS_MODE);
  const isChat = route === "chat";
  const containerRef = useAutoResize(isChat);

  useEffect(() => {
    const onHashChange = () => setRoute(getHashRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    window.electronAPI.getFocusMode().then(setFocusMode);
  }, []);

  // chat 라우트일 때 html/body 배경을 투명으로
  useEffect(() => {
    if (route === "chat") {
      document.documentElement.style.background = "transparent";
      document.body.style.background = "transparent";
    }
    return () => {
      document.documentElement.style.background = "";
      document.body.style.background = "";
    };
  }, [route]);

  const saveFocusMode = useCallback(async (updated: FocusMode) => {
    setFocusMode(updated);
    await window.electronAPI.setFocusMode(updated);
  }, []);

  const closeWindow = useCallback(() => {
    window.electronAPI.navigateBack();
  }, []);

  if (route === "dashboard") {
    return <Dashboard />;
  }

  return (
    <div
      ref={containerRef}
      className={
        isChat
          ? "text-gray-100"
          : "bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100"
      }
    >
      {route === "monitor" ? (
        <BackgroundMonitor onBack={closeWindow} />
      ) : route === "quiet-hours" ? (
        <FocusModePanel focusMode={focusMode} onUpdate={saveFocusMode} onBack={closeWindow} />
      ) : isChat ? (
        <ChatView />
      ) : (
        <div className="p-4 text-sm text-gray-500">Loading...</div>
      )}
    </div>
  );
}
