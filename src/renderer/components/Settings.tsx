import React, { useState, useEffect } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { AppSettings } from '../../shared/types';

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const [patterns, setPatterns] = useState<string[]>([]);
  const [newPattern, setNewPattern] = useState('');
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
      console.error('Failed to load settings:', error);
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
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const addPattern = () => {
    const trimmed = newPattern.trim();
    if (!trimmed) return;
    if (patterns.includes(trimmed)) {
      setNewPattern('');
      return;
    }
    saveSettings([...patterns, trimmed]);
    setNewPattern('');
  };

  const removePattern = (index: number) => {
    const newPatterns = patterns.filter((_, i) => i !== index);
    saveSettings(newPatterns);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPattern();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-4">
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700 px-3 py-2 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="btn-icon text-gray-500 dark:text-gray-400"
            title="뒤로"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold">설정</h1>
        </div>
      </header>

      <main className="p-3">
        <section>
          <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            감지 패턴
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            ~/Library/LaunchAgents/ 에서 감지할 plist 파일 패턴을 입력하세요.
          </p>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="com.myapp."
              className="flex-1 px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={addPattern}
              disabled={!newPattern.trim() || saving}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              추가
            </button>
          </div>

          {patterns.length === 0 ? (
            <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
              <p>등록된 패턴이 없습니다.</p>
              <p className="text-xs mt-1">패턴이 없으면 모든 작업이 표시됩니다.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {patterns.map((pattern, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <code className="text-sm text-gray-700 dark:text-gray-300">
                    {pattern}
                  </code>
                  <button
                    onClick={() => removePattern(index)}
                    disabled={saving}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-50"
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
