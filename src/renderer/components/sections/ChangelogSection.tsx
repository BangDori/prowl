/** 변경 로그 탭 섹션 */
import prowlProfile from "@assets/prowl-profile.png";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import changelogRaw from "../../../../CHANGELOG.md?raw";

/** 체인지로그 항목 타입 */
interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

/**
 * CHANGELOG.md 파일을 파싱하여 구조화된 데이터로 변환
 * @param markdown - CHANGELOG.md 원본 문자열
 * @returns 파싱된 체인지로그 엔트리 배열
 */
function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const lines = markdown.split("\n");
  let currentEntry: ChangelogEntry | null = null;

  for (const line of lines) {
    // Match version header: ## [1.8.0] - 2026-02-04
    const headerMatch = line.match(/^## \[(.+?)\] - (\d{4}-\d{2}-\d{2})/);
    if (headerMatch) {
      if (currentEntry) entries.push(currentEntry);
      currentEntry = { version: headerMatch[1], date: headerMatch[2], changes: [] };
      continue;
    }
    // Match change item: - 변경사항
    const itemMatch = line.match(/^- (.+)/);
    if (itemMatch && currentEntry) {
      currentEntry.changes.push(itemMatch[1]);
    }
  }
  if (currentEntry) entries.push(currentEntry);
  return entries;
}

const CHANGELOG = parseChangelog(changelogRaw);

/**
 * 체인지로그 섹션 컴포넌트
 *
 * 앱의 버전 히스토리를 표시합니다.
 * - 현재 버전 헤더
 * - 각 릴리즈의 변경사항 목록
 */
export default function ChangelogSection() {
  const [currentVersion, setCurrentVersion] = useState("");

  useEffect(() => {
    window.electronAPI.getAppVersion().then(setCurrentVersion);
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        {/* 현재 버전 헤더 */}
        <div className="glass-card-3d flex items-center gap-3 mb-4 p-3 rounded-lg bg-prowl-card backdrop-blur-xl border border-white/[0.06]">
          <img src={prowlProfile} alt="Prowl" className="w-8 h-8 rounded-full" />
          <div>
            <h4 className="text-sm font-medium">Prowl</h4>
            <p className="text-[10px] text-gray-500">Background job monitor for macOS</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
            <Sparkles className="w-3 h-3" />v{currentVersion}
          </span>
        </div>

        {/* 버전 히스토리 */}
        <div className="space-y-3">
          {CHANGELOG.map((release, index) => (
            <div
              key={release.version}
              className={`glass-card-3d p-3 rounded-lg border backdrop-blur-xl ${
                index === 0 ? "bg-accent/5 border-accent/20" : "bg-prowl-card border-white/[0.06]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${index === 0 ? "text-accent" : ""}`}>
                  v{release.version}
                </span>
                <span className="text-[10px] text-gray-500">{release.date}</span>
              </div>
              <ul className="space-y-1">
                {release.changes.map((change) => (
                  <li key={change} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-gray-600 mt-0.5">•</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
