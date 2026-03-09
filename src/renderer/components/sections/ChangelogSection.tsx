/** 변경 로그 탭 섹션 */
import prowlProfile from "@assets/prowl-profile.png";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import { type ReactNode, useEffect, useState } from "react";
import changelogRaw from "../../../../CHANGELOG.md?raw";

/** 기여자 정보 */
interface Contributor {
  handle: string;
  url: string;
}

/** 체인지로그 항목 타입 */
interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  contributors: Contributor[];
}

/**
 * 변경 항목 텍스트에서 기여자(@username) 패턴을 제거하고
 * 추출된 기여자 목록을 반환
 */
function extractContributors(text: string): { cleaned: string; contributors: Contributor[] } {
  const contributors: Contributor[] = [];
  const cleaned = text.replace(/,?\s*\[@([^\]]+)\]\(([^)]+)\)/g, (_, handle, url) => {
    contributors.push({ handle, url });
    return "";
  });
  return { cleaned: cleaned.replace(/\(\s*\)/g, "").trim(), contributors };
}

/**
 * CHANGELOG.md 파일을 파싱하여 구조화된 데이터로 변환
 * 각 릴리즈별로 unique 기여자를 수집
 */
function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const lines = markdown.split("\n");
  let currentEntry: ChangelogEntry | null = null;

  for (const line of lines) {
    // 기존 형식: ## [1.8.0] - 2026-02-04
    const bracketMatch = line.match(/^## \[(.+?)\] - (\d{4}-\d{2}-\d{2})/);
    if (bracketMatch) {
      if (currentEntry) entries.push(currentEntry);
      currentEntry = {
        version: bracketMatch[1],
        date: bracketMatch[2],
        changes: [],
        contributors: [],
      };
      continue;
    }
    // Changesets 형식: ## 1.8.0 (날짜 없음)
    const versionMatch = line.match(/^## (\d+\.\d+\.\d+)\s*$/);
    if (versionMatch) {
      if (currentEntry) entries.push(currentEntry);
      currentEntry = { version: versionMatch[1], date: "", changes: [], contributors: [] };
      continue;
    }
    // Changesets 섹션 헤더 스킵: ### Patch Changes 등
    if (line.startsWith("### ")) continue;
    // 변경사항 항목: - 텍스트
    const itemMatch = line.match(/^-\s+(.+)/);
    if (itemMatch && currentEntry) {
      const { cleaned, contributors } = extractContributors(itemMatch[1]);
      currentEntry.changes.push(cleaned);
      for (const c of contributors) {
        if (!currentEntry.contributors.some((x) => x.handle === c.handle)) {
          currentEntry.contributors.push(c);
        }
      }
    }
  }
  if (currentEntry) entries.push(currentEntry);
  return entries;
}

const CHANGELOG = parseChangelog(changelogRaw);

/**
 * "[텍스트](url)" 패턴을 클릭 가능한 링크로 렌더링
 * 링크가 없는 순수 텍스트는 그대로 반환
 */
function renderWithLinks(text: string): ReactNode {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  if (parts.length === 1) return text;
  return parts.map((part) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (match) {
      return (
        <button
          key={match[2]}
          type="button"
          className="text-accent hover:underline cursor-pointer"
          onClick={() => window.electronAPI.openExternal(match[2])}
        >
          {match[1]}
        </button>
      );
    }
    return part;
  });
}

/**
 * 체인지로그 섹션 컴포넌트
 *
 * 앱의 버전 히스토리를 표시합니다.
 * - 현재 버전 헤더
 * - 각 릴리즈의 변경사항 목록 (PR 링크만 표시)
 * - 각 릴리즈 카드 하단에 해당 버전 기여자 표시 (중복 없이)
 */
export default function ChangelogSection() {
  const [currentVersion, setCurrentVersion] = useState("");

  useEffect(() => {
    window.electronAPI.getAppVersion().then(setCurrentVersion);
  }, []);

  return (
    <div className="h-full overflow-y-auto -webkit-app-region-drag">
      <div className="p-4">
        {/* 현재 버전 헤더 */}
        <div className="glass-card-3d flex items-center gap-3 mb-4 p-3 rounded-lg bg-prowl-card border border-prowl-border">
          <img src={prowlProfile} alt="Prowl" className="w-8 h-8 rounded-full" />
          <div>
            <h4 className="text-sm font-medium">Prowl</h4>
            <p className="text-[10px] text-gray-500">Background job monitor for macOS</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-prowl-border text-[10px] text-gray-400 hover:text-accent hover:border-accent/40 transition-colors cursor-pointer"
              onClick={() =>
                window.electronAPI.openExternal("https://github.com/BangDori/prowl/releases")
              }
            >
              <ExternalLink className="w-3 h-3" />
              Releases
            </button>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
              <Sparkles className="w-3 h-3" />v{currentVersion}
            </span>
          </div>
        </div>

        {/* 버전 히스토리 */}
        <div className="space-y-3">
          {CHANGELOG.map((release, index) => (
            <div
              key={release.version}
              className={`glass-card-3d p-3 rounded-lg border ${
                index === 0 ? "bg-accent/5 border-accent/20" : "bg-prowl-card border-prowl-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${index === 0 ? "text-accent" : ""}`}>
                  v{release.version}
                </span>
                {release.date && <span className="text-[10px] text-gray-500">{release.date}</span>}
              </div>
              <ul className="space-y-1">
                {release.changes.map((change) => (
                  <li
                    key={change}
                    className="text-xs text-app-text-secondary flex items-start gap-2"
                  >
                    <span className="text-gray-600 mt-0.5">•</span>
                    <span>{renderWithLinks(change)}</span>
                  </li>
                ))}
              </ul>
              {release.contributors.filter((c) => c.handle !== "BangDori").length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-[10px] text-gray-500 self-center">by</span>
                  {release.contributors
                    .filter((c) => c.handle !== "BangDori")
                    .map((c) => (
                      <button
                        key={c.handle}
                        type="button"
                        className="text-[10px] text-accent hover:underline cursor-pointer"
                        onClick={() => window.electronAPI.openExternal(c.url)}
                      >
                        @{c.handle}
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
