import { ChevronLeft, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const [patterns, setPatterns] = useState<string[]>([]);
  const [newPattern, setNewPattern] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    async function load() {
      try {
        const settings = await window.electronAPI.getSettings();
        setPatterns(settings.patterns);
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveSettings = async (newPatterns: string[]) => {
    setSaving(true);
    try {
      const current = await window.electronAPI.getSettings();
      await window.electronAPI.setSettings({ ...current, patterns: newPatterns });
      setPatterns(newPatterns);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const addPattern = () => {
    const trimmed = newPattern.trim();
    if (!trimmed) return;
    if (patterns.includes(trimmed)) {
      setNewPattern("");
      return;
    }
    saveSettings([...patterns, trimmed]);
    setNewPattern("");
  };

  const removePattern = (index: number) => {
    const newPatterns = patterns.filter((_, i) => i !== index);
    saveSettings(newPatterns);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPattern();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-500 text-sm">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100">
      <header className="app-header">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="btn-icon text-gray-500 dark:text-gray-400"
            title="뒤로"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-semibold">설정</h1>
        </div>
      </header>

      <main className="p-4">
        <section>
          <h2 className="section-title mb-2">감지 패턴</h2>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
            ~/Library/LaunchAgents/ 에서 감지할 plist 파일 패턴을 입력하세요.
          </p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="com.myapp."
              className="flex-1 input-field"
            />
            <button
              type="button"
              onClick={addPattern}
              disabled={!newPattern.trim() || saving}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              추가
            </button>
          </div>

          {patterns.length === 0 ? (
            <div className="empty-state py-8">
              <p className="text-sm mb-1">등록된 패턴이 없습니다</p>
              <p className="text-xs">패턴이 없으면 모든 작업이 표시됩니다.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {patterns.map((pattern, index) => (
                <li
                  key={pattern}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-prowl-card rounded-lg border border-gray-200 dark:border-prowl-border"
                >
                  <code className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {pattern}
                  </code>
                  <button
                    type="button"
                    onClick={() => removePattern(index)}
                    disabled={saving}
                    className="btn-icon text-gray-400 hover:text-red-500 disabled:opacity-50"
                    title="삭제"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

    </div>
  );
}
