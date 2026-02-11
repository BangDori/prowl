import { useJobActions } from "@renderer/hooks/useJobActions";
import { useLaunchdJobs } from "@renderer/hooks/useLaunchdJobs";
import { useSettings, useUpdateSettings } from "@renderer/hooks/useSettings";
import type { JobCustomization, JobCustomizations, LaunchdJob } from "@shared/types";
import { Box, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import JobList from "../JobList";

/**
 * 작업 목록 섹션 컴포넌트
 */
export default function JobsSection() {
  const { jobs, loading, refresh } = useLaunchdJobs();
  const actions = useJobActions(refresh);
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [customizations, setCustomizations] = useState<JobCustomizations>({});

  const [newPattern, setNewPattern] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const patterns = settings?.patterns ?? [];
  const patternLoading = settingsLoading;
  const saving = updateSettings.isPending;

  useEffect(() => {
    window.electronAPI.getJobCustomizations().then(setCustomizations);
  }, []);

  const updateCustomization = async (jobId: string, customization: JobCustomization) => {
    await window.electronAPI.setJobCustomization(jobId, customization);
    setCustomizations((prev) => ({ ...prev, [jobId]: customization }));
  };

  const savePatterns = (newPatterns: string[]) => {
    if (!settings) return;
    updateSettings.mutate({ ...settings, patterns: newPatterns });
  };

  const addPattern = () => {
    const trimmed = newPattern.trim();
    if (!trimmed || patterns.includes(trimmed)) {
      setNewPattern("");
      setAdding(false);
      return;
    }
    savePatterns([...patterns, trimmed]);
    setNewPattern("");
    setAdding(false);
  };

  const removePattern = (index: number) => {
    savePatterns(patterns.filter((_, i) => i !== index));
  };

  const startAdding = () => {
    setAdding(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="job-card">
            <div className="flex-1">
              <div className="skeleton h-4 w-32 mb-2" />
              <div className="skeleton h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 패턴 칩 바 */}
      {!patternLoading && (
        <div className="flex items-center gap-1.5 flex-wrap px-4 py-2 border-b border-prowl-border">
          <span className="text-[10px] text-gray-500 mr-1">패턴</span>
          {patterns.map((pattern, index) => (
            <span
              key={pattern}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-prowl-card text-[11px] font-mono text-gray-400"
            >
              {pattern}
              <button
                type="button"
                onClick={() => removePattern(index)}
                disabled={saving}
                className="text-gray-500 hover:text-red-400 disabled:opacity-50"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {adding ? (
            <input
              ref={inputRef}
              type="text"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPattern();
                }
                if (e.key === "Escape") {
                  setNewPattern("");
                  setAdding(false);
                }
              }}
              onBlur={addPattern}
              placeholder="com.example."
              className="text-[11px] font-mono px-2 py-0.5 rounded border border-prowl-border bg-transparent outline-none w-28 text-gray-300"
            />
          ) : (
            <button
              type="button"
              onClick={startAdding}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] text-gray-500 hover:text-gray-300 hover:bg-prowl-card transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* 작업 목록 */}
      {jobs.length === 0 ? (
        <div className="empty-state py-16 flex-1">
          <Box className="w-12 h-12 text-gray-500 mb-4" />
          <p className="text-sm font-medium mb-1">등록된 작업이 없습니다</p>
          <p className="text-xs text-gray-500">~/Library/LaunchAgents/</p>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1">
          <JobList
            jobs={jobs as LaunchdJob[]}
            actions={actions}
            customizations={customizations}
            onUpdateCustomization={updateCustomization}
          />
        </div>
      )}
    </div>
  );
}
