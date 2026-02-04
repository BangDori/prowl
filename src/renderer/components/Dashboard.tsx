import {
  Bell,
  Box,
  Cog,
  ExternalLink,
  LayoutDashboard,
  Moon,
  Plus,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import prowlProfile from "../../../assets/prowl-profile.png";
import CHANGELOG from "../../shared/changelog.json";
import {
  DEFAULT_FOCUS_MODE,
  type FocusMode,
  type JobCustomization,
  type JobCustomizations,
  type LaunchdJob,
} from "../../shared/types";
import { useJobActions } from "../hooks/useJobActions";
import { useLaunchdJobs } from "../hooks/useLaunchdJobs";
import FocusModePanel from "./FocusModePanel";
import JobList from "./JobList";
import ToggleSwitch from "./ToggleSwitch";

type NavItem = "jobs" | "quiet-hours" | "settings";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
        ${
          active ? "bg-accent/20 text-accent" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function JobsContent() {
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

function QuietHoursContent() {
  const [focusMode, setFocusMode] = useState<FocusMode>(DEFAULT_FOCUS_MODE);

  useEffect(() => {
    window.electronAPI.getFocusMode().then(setFocusMode);
  }, []);

  const saveFocusMode = useCallback(async (updated: FocusMode) => {
    setFocusMode(updated);
    await window.electronAPI.setFocusMode(updated);
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <FocusModePanel focusMode={focusMode} onUpdate={saveFocusMode} />
    </div>
  );
}

function SettingsContent() {
  const [currentVersion, setCurrentVersion] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    window.electronAPI.getAppVersion().then(setCurrentVersion);
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* 알림 설정 */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Notifications
          </h3>
          <div className="p-3 rounded-lg bg-prowl-card border border-prowl-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm">Enable Notifications</p>
                  <p className="text-[10px] text-gray-500">Show alerts when jobs complete</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={notificationsEnabled}
                onChange={() => setNotificationsEnabled(!notificationsEnabled)}
              />
            </div>
          </div>
        </div>

        {/* 버전 정보 */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">About</h3>
          <div className="p-4 rounded-lg bg-prowl-card border border-prowl-border">
            <div className="flex items-center gap-3 mb-4">
              <img src={prowlProfile} alt="Prowl" className="w-10 h-10 rounded-full" />
              <div>
                <h4 className="text-sm font-medium">Prowl</h4>
                <p className="text-[10px] text-gray-500">Background job monitor for macOS</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
                <Sparkles className="w-3 h-3" />v{currentVersion}
              </span>
            </div>

            {/* 버전 히스토리 */}
            <div className="border-t border-prowl-border pt-3 mt-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                Version History
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {CHANGELOG.map((release, index) => (
                  <div
                    key={release.version}
                    className={`p-2 rounded ${index === 0 ? "bg-accent/5" : "bg-prowl-bg/50"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${index === 0 ? "text-accent" : ""}`}>
                        v{release.version}
                      </span>
                      <span className="text-[9px] text-gray-500">{release.date}</span>
                    </div>
                    <ul className="space-y-0.5">
                      {release.changes.map((change) => (
                        <li
                          key={change}
                          className="text-[10px] text-gray-400 flex items-start gap-1.5"
                        >
                          <span className="text-gray-600">•</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 링크 */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Links</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => window.electronAPI.openExternal("https://github.com/BangDori/prowl")}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-prowl-card border border-prowl-border text-left hover:border-gray-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm">GitHub Repository</p>
                <p className="text-[10px] text-gray-500">View source code and contribute</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() =>
                window.electronAPI.openExternal("https://github.com/BangDori/prowl/releases")
              }
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-prowl-card border border-prowl-border text-left hover:border-gray-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm">Check for Updates</p>
                <p className="text-[10px] text-gray-500">View latest releases</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const NAV_LABELS: Record<NavItem, string> = {
  jobs: "Background Monitor",
  "quiet-hours": "Night Watch",
  settings: "Settings",
};

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState<NavItem>("jobs");

  return (
    <div className="flex h-screen bg-prowl-bg text-gray-100">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-prowl-surface border-r border-prowl-border flex flex-col">
        {/* Drag region for window */}
        <div className="h-10 -webkit-app-region-drag" />

        {/* Logo */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2">
            <img src={prowlProfile} alt="Prowl" className="w-6 h-6 rounded-full" />
            <span className="font-semibold text-sm">Prowl</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1">
          <SidebarItem
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Background Monitor"
            active={activeNav === "jobs"}
            onClick={() => setActiveNav("jobs")}
          />
          <SidebarItem
            icon={<Moon className="w-4 h-4" />}
            label="Night Watch"
            active={activeNav === "quiet-hours"}
            onClick={() => setActiveNav("quiet-hours")}
          />
          <SidebarItem
            icon={<Cog className="w-4 h-4" />}
            label="Settings"
            active={activeNav === "settings"}
            onClick={() => setActiveNav("settings")}
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header with drag region */}
        <header className="h-10 border-b border-prowl-border flex items-center px-4 -webkit-app-region-drag">
          <h1 className="text-sm font-medium">{NAV_LABELS[activeNav]}</h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeNav === "jobs" && <JobsContent />}
          {activeNav === "quiet-hours" && <QuietHoursContent />}
          {activeNav === "settings" && <SettingsContent />}
        </div>
      </main>
    </div>
  );
}
