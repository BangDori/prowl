/** 프리뷰 패널의 탭별 브라우저 히스토리 스택을 관리하는 훅 */
import { useEffect, useState } from "react";
import type { PreviewTab } from "./PreviewPanel";

/** 탭 내 이동 가능한 콘텐츠 엔트리 — HTML 또는 URL */
export type NavEntry = { kind: "html"; content: string } | { kind: "url"; url: string };

type TabNav = { entries: NavEntry[]; index: number };

/**
 * 탭별 탐색 히스토리를 관리하는 훅
 *
 * - navigate: 새 엔트리 추가 (forward stack 초기화)
 * - goBack / goForward: 커스텀 히스토리 이동
 * - tabs prop 변화 시 새 탭만 초기화, 기존 히스토리 보존
 */
export function useTabHistory(tabs: PreviewTab[]) {
  const [tabNavs, setTabNavs] = useState<Map<string, TabNav>>(new Map());

  useEffect(() => {
    setTabNavs((prev) => {
      const tabIds = new Set(tabs.map((t) => t.id));
      const needsAdd = tabs.some((t) => !prev.has(t.id));
      const needsRemove = [...prev.keys()].some((id) => !tabIds.has(id));
      if (!needsAdd && !needsRemove) return prev;

      const next = new Map<string, TabNav>();
      for (const [id, nav] of prev) {
        if (tabIds.has(id)) next.set(id, nav);
      }
      for (const tab of tabs) {
        if (!next.has(tab.id)) {
          const init: NavEntry =
            tab.type === "html"
              ? { kind: "html", content: tab.content }
              : { kind: "url", url: tab.url };
          next.set(tab.id, { entries: [init], index: 0 });
        }
      }
      return next;
    });
  }, [tabs]);

  /** 탭의 현재 엔트리 반환 */
  const getEntry = (tabId: string): NavEntry | undefined => {
    const nav = tabNavs.get(tabId);
    return nav ? nav.entries[nav.index] : undefined;
  };

  /** 커스텀 히스토리상 뒤로 가기 가능 여부 */
  const historyCanGoBack = (tabId: string): boolean => (tabNavs.get(tabId)?.index ?? 0) > 0;

  /** 커스텀 히스토리상 앞으로 가기 가능 여부 */
  const historyCanGoForward = (tabId: string): boolean => {
    const nav = tabNavs.get(tabId);
    return nav ? nav.index < nav.entries.length - 1 : false;
  };

  /** 새 엔트리 추가 — forward stack 초기화 후 push */
  const navigate = (tabId: string, entry: NavEntry): void => {
    setTabNavs((prev) => {
      const nav = prev.get(tabId);
      if (!nav) return prev;
      const entries = [...nav.entries.slice(0, nav.index + 1), entry];
      return new Map(prev).set(tabId, { entries, index: entries.length - 1 });
    });
  };

  /** 커스텀 히스토리 뒤로 */
  const historyGoBack = (tabId: string): void => {
    setTabNavs((prev) => {
      const nav = prev.get(tabId);
      if (!nav || nav.index === 0) return prev;
      return new Map(prev).set(tabId, { ...nav, index: nav.index - 1 });
    });
  };

  /** 커스텀 히스토리 앞으로 */
  const historyGoForward = (tabId: string): void => {
    setTabNavs((prev) => {
      const nav = prev.get(tabId);
      if (!nav || nav.index >= nav.entries.length - 1) return prev;
      return new Map(prev).set(tabId, { ...nav, index: nav.index + 1 });
    });
  };

  return {
    getEntry,
    historyCanGoBack,
    historyCanGoForward,
    navigate,
    historyGoBack,
    historyGoForward,
  };
}
