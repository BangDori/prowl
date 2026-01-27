import { useState, useEffect, useCallback } from "react";
import { useLaunchdJobs } from "./hooks/useLaunchdJobs";
import { useJobActions } from "./hooks/useJobActions";
import JobList from "./components/JobList";
import Header from "./components/Header";
import Settings from "./components/Settings";
import { JobCustomization, JobCustomizations } from "../shared/types";

type View = "main" | "settings";

export default function App() {
  const [view, setView] = useState<View>("main");
  const { jobs, loading, error, refresh } = useLaunchdJobs();
  const actions = useJobActions(refresh);
  const [customizations, setCustomizations] = useState<JobCustomizations>({});

  // 커스터마이징 데이터 로드
  useEffect(() => {
    window.electronAPI.getJobCustomizations().then(setCustomizations);
  }, []);

  // 커스터마이징 업데이트
  const updateCustomization = useCallback(
    async (jobId: string, customization: JobCustomization) => {
      await window.electronAPI.setJobCustomization(jobId, customization);
      setCustomizations((prev) => ({
        ...prev,
        [jobId]: customization,
      }));
    },
    [],
  );

  const handleBackFromSettings = () => {
    setView("main");
    refresh();
  };

  if (view === "settings") {
    return <Settings onBack={handleBackFromSettings} />;
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100">
      <Header
        onRefresh={refresh}
        onSettings={() => setView("settings")}
        loading={loading}
      />

      <main
        className="p-4 pt-2 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 52px)" }}
      >
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {loading && jobs.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="job-card">
                <div className="flex items-center gap-3">
                  <div className="skeleton w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-32 mb-2" />
                    <div className="skeleton h-3 w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-icon">🔍</p>
            <p className="text-sm font-medium mb-1">등록된 작업이 없습니다</p>
            <p className="text-xs">~/Library/LaunchAgents/</p>
          </div>
        ) : (
          <JobList
            jobs={jobs}
            actions={actions}
            customizations={customizations}
            onUpdateCustomization={updateCustomization}
          />
        )}
      </main>
    </div>
  );
}
