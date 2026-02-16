/** 앱 루트 컴포넌트: 라우팅 및 전역 상태 */
import { DEFAULT_FOCUS_MODE, type FocusMode } from "@shared/types";
import { QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import BackgroundMonitor from "./components/BackgroundMonitor";
import Dashboard from "./components/Dashboard";
import FocusModePanel from "./components/FocusModePanel";
import { useAutoResize } from "./hooks/useAutoResize";
import { useFocusMode, useUpdateFocusMode } from "./hooks/useFocusMode";
import { queryClient } from "./queries/client";

function getHashRoute(): string {
  return window.location.hash.replace("#", "") || "";
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

function AppContent() {
  const [route, setRoute] = useState(getHashRoute);
  const containerRef = useAutoResize(false);

  const { data: focusMode = DEFAULT_FOCUS_MODE } = useFocusMode();
  const updateFocusMode = useUpdateFocusMode();

  useEffect(() => {
    const onHashChange = () => setRoute(getHashRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const saveFocusMode = useCallback(
    (updated: FocusMode) => {
      updateFocusMode.mutate(updated);
    },
    [updateFocusMode],
  );

  const closeWindow = useCallback(() => {
    window.electronAPI.navigateBack();
  }, []);

  if (route === "dashboard") {
    return <Dashboard />;
  }

  return (
    <div
      ref={containerRef}
      className="bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100"
    >
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
