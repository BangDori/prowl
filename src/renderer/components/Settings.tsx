import { useState, useEffect } from "react";
import { ChevronLeft, X, Github, Plus } from "lucide-react";

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const [patterns, setPatterns] = useState<string[]>([]);
  const [newPattern, setNewPattern] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await window.electronAPI.getSettings();
      setPatterns(settings.patterns);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newPatterns: string[]) => {
    setSaving(true);
    try {
      await window.electronAPI.setSettings({ patterns: newPatterns });
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
            ~/Library/prowl/ 에서 감지할 plist 파일 패턴을 입력하세요.
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
              <p className="text-xs">
                패턴이 없으면 모든 작업이 표시됩니다.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {patterns.map((pattern, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-prowl-card rounded-lg border border-gray-200 dark:border-prowl-border"
                >
                  <code className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {pattern}
                  </code>
                  <button
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

      <footer className="fixed bottom-0 left-0 right-0 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-xl border-t border-gray-200 dark:border-prowl-border px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            추가 기능 제안 및 이슈 제보는 언제나 환영합니다
          </p>
          <button
            onClick={() =>
              window.electronAPI.openExternal(
                "https://github.com/BangDori/prowl",
              )
            }
            className="btn-icon text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            title="GitHub"
          >
            <Github className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
