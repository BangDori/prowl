import { ChevronLeft, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { JobCustomization, JobCustomizations, LaunchdJob } from "../../shared/types";
import { useJobActions } from "../hooks/useJobActions";
import { useLaunchdJobs } from "../hooks/useLaunchdJobs";
import JobList from "./JobList";

interface BackgroundMonitorProps {
  onBack: () => void;
}

export default function BackgroundMonitor({ onBack }: BackgroundMonitorProps) {
  const { jobs, loading, refresh } = useLaunchdJobs();
  const actions = useJobActions(refresh);
  const [customizations, setCustomizations] = useState<JobCustomizations>({});

  const [patterns, setPatterns] = useState<string[]>([]);
  const [newPattern, setNewPattern] = useState("");
  const [patternLoading, setPatternLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.electronAPI.getJobCustomizations().then(setCustomizations);
    async function loadPatterns() {
      try {
        const settings = await window.electronAPI.getSettings();
        setPatterns(settings.patterns);
      } finally {
        setPatternLoading(false);
      }
    }
    loadPatterns();
  }, []);

  const updateCustomization = async (jobId: string, customization: JobCustomization) => {
    await window.electronAPI.setJobCustomization(jobId, customization);
    setCustomizations((prev) => ({ ...prev, [jobId]: customization }));
  };

  const savePatterns = async (newPatterns: string[]) => {
    setSaving(true);
    try {
      const current = await window.electronAPI.getSettings();
      await window.electronAPI.setSettings({ ...current, patterns: newPatterns });
      setPatterns(newPatterns);
      refresh();
    } finally {
      setSaving(false);
    }
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

  return (
    <div>
      <header className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-prowl-border">
        <button
          type="button"
          onClick={onBack}
          className="btn-icon text-gray-500 dark:text-gray-400 p-0.5"
          title="뒤로"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xs font-semibold">백그라운드 모니터링</h1>
      </header>

      {/* 패턴 칩 바 */}
      {!patternLoading && (
        <div className="flex items-center gap-1 flex-wrap px-3 py-1.5 border-b border-gray-100 dark:border-prowl-border">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mr-0.5">패턴</span>
          {patterns.map((pattern, index) => (
            <span
              key={pattern}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-prowl-card text-[10px] font-mono text-gray-600 dark:text-gray-400"
            >
              {pattern}
              <button
                type="button"
                onClick={() => removePattern(index)}
                disabled={saving}
                className="text-gray-400 hover:text-red-500 disabled:opacity-50"
              >
                <X className="w-2.5 h-2.5" />
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
              className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-gray-300 dark:border-prowl-border bg-transparent outline-none w-24"
            />
          ) : (
            <button
              type="button"
              onClick={startAdding}
              className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-prowl-card transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      )}

      <main className="overflow-y-auto" style={{ maxHeight: "calc(4.5 * 64px)" }}>
        {loading && jobs.length === 0 ? (
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="job-card">
                <div className="flex-1">
                  <div className="skeleton h-4 w-32 mb-2" />
                  <div className="skeleton h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state py-8">
            <p className="text-sm font-medium mb-1">등록된 작업이 없습니다</p>
            <p className="text-xs">~/Library/LaunchAgents/</p>
          </div>
        ) : (
          <JobList
            jobs={jobs as LaunchdJob[]}
            actions={actions}
            customizations={customizations}
            onUpdateCustomization={updateCustomization}
          />
        )}
      </main>
    </div>
  );
}
