/** 탭 기반 프리뷰 패널 — HTML 및 외부 URL을 브라우저 탭처럼 표시 */

import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Plus from "lucide-react/dist/esm/icons/plus";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import X from "lucide-react/dist/esm/icons/x";
import { useCallback, useEffect, useRef, useState } from "react";
import PreviewBlankPage from "./PreviewBlankPage";
import PreviewHtmlContent from "./PreviewHtmlContent";
import PreviewUrlContent, { type NavState, type UrlHandle } from "./PreviewUrlContent";
import { type NavEntry, useTabHistory } from "./useTabHistory";

export type PreviewTab =
  | { id: string; type: "html"; content: string; label: string }
  | { id: string; type: "url"; url: string; label: string };

export type PageContext = { url: string; title: string; text: string };

interface PreviewPanelProps {
  tabs: PreviewTab[];
  activeTabId: string | null;
  onActivateTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onPageContextChange?: (ctx: PageContext | null) => void;
  onNewTab?: () => void;
  isDragging?: boolean;
}

export default function PreviewPanel({
  tabs,
  activeTabId,
  onActivateTab,
  onCloseTab,
  onPageContextChange,
  onNewTab,
  isDragging,
}: PreviewPanelProps) {
  const {
    getEntry,
    historyCanGoBack,
    historyCanGoForward,
    navigate,
    historyGoBack,
    historyGoForward,
  } = useTabHistory(tabs);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs.at(-1);
  const urlContentRef = useRef<UrlHandle>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // 현재 활성 탭의 히스토리 엔트리 — HTML/URL 렌더링 결정에 사용
  const currentEntry: NavEntry | undefined = getEntry(activeTab?.id ?? "");
  const isCurrentUrl = currentEntry?.kind === "url";
  const isBlankEntry = currentEntry?.kind === "url" && currentEntry.url === "about:blank";
  // webview에 전달할 실제 URL
  const currentUrl = currentEntry?.kind === "url" ? currentEntry.url : "";

  const [navState, setNavState] = useState<NavState>({
    canGoBack: false,
    canGoForward: false,
    isLoading: false,
    currentUrl: "",
  });
  const [navInput, setNavInput] = useState("");
  const isInputFocused = useRef(false);

  // 활성 탭 변경 시 nav 상태 초기화, 새 빈 탭이면 URL 입력창 자동 포커스
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  useEffect(() => {
    const tab = tabsRef.current.find((t) => t.id === activeTabId) ?? tabsRef.current.at(-1);
    const initUrl = tab?.type === "url" && tab.url !== "about:blank" ? tab.url : "";
    setNavState({ canGoBack: false, canGoForward: false, isLoading: false, currentUrl: initUrl });
    if (!isInputFocused.current) setNavInput(initUrl);
    if (tab?.type === "url" && tab.url === "about:blank") {
      setTimeout(() => {
        urlInputRef.current?.focus();
        urlInputRef.current?.select();
      }, 50);
    }
  }, [activeTabId]);

  const handleNavStateChange = useCallback((state: NavState) => {
    setNavState(state);
    if (!isInputFocused.current) setNavInput(state.currentUrl);
  }, []);

  // 커스텀 히스토리 + webview 히스토리 합산
  const canGoBackTotal = navState.canGoBack || historyCanGoBack(activeTab?.id ?? "");
  const canGoForwardTotal = historyCanGoForward(activeTab?.id ?? "") || navState.canGoForward;

  const handleGoBack = useCallback(() => {
    if (navState.canGoBack) {
      urlContentRef.current?.goBack();
    } else if (activeTab) {
      historyGoBack(activeTab.id);
    }
  }, [navState.canGoBack, activeTab, historyGoBack]);

  const handleGoForward = useCallback(() => {
    if (activeTab && historyCanGoForward(activeTab.id)) {
      historyGoForward(activeTab.id);
    } else {
      urlContentRef.current?.goForward();
    }
  }, [activeTab, historyCanGoForward, historyGoForward]);

  /** 인탭 탐색 — HTML 링크 클릭 또는 URL 입력 시 커스텀 히스토리에 추가 */
  const handleNavigateInTab = useCallback(
    (url: string) => {
      if (activeTab) {
        navigate(activeTab.id, { kind: "url", url });
        if (!isInputFocused.current) setNavInput(url);
      }
    },
    [activeTab, navigate],
  );

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let target = navInput.trim();
    if (!target || target === "about:blank") return;
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = `https://${target}`;
    }
    if (currentEntry?.kind === "url" && !isBlankEntry) {
      // 기존 URL 탭: webview 내에서 직접 로드
      urlContentRef.current?.loadURL(target);
    } else {
      // HTML 탭 또는 blank 탭: 커스텀 히스토리에 추가
      handleNavigateInTab(target);
    }
    isInputFocused.current = false;
  };

  return (
    <div className={`chat-preview-panel${isDragging ? " is-dragging" : ""}`}>
      {/* 탭 바 */}
      <div className="chat-preview-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onActivateTab(tab.id)}
            className={`chat-preview-tab${tab.id === activeTab?.id ? " is-active" : ""}`}
          >
            <span className="chat-preview-tab-label">{tab.label}</span>
            <button
              type="button"
              className="chat-preview-tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </button>
        ))}
        {onNewTab && (
          <button type="button" onClick={onNewTab} className="chat-preview-tab-new" title="새 탭">
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* URL 탭 전용 네비게이션 바 */}
      {isCurrentUrl && (
        <div className="chat-preview-nav">
          <button
            type="button"
            onClick={handleGoBack}
            disabled={!canGoBackTotal}
            title="뒤로"
            className="p-1 rounded text-white/50 hover:text-white/80 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleGoForward}
            disabled={!canGoForwardTotal}
            title="앞으로"
            className="p-1 rounded text-white/50 hover:text-white/80 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => urlContentRef.current?.reloadOrStop()}
            title={navState.isLoading ? "중지" : "새로고침"}
            className="p-1 rounded text-white/50 hover:text-white/80 transition-colors"
          >
            {navState.isLoading ? (
              <X className="w-3.5 h-3.5" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
          </button>
          <form onSubmit={handleUrlSubmit} style={{ flex: 1, minWidth: 0 }}>
            <input
              type="text"
              value={navInput}
              onChange={(e) => setNavInput(e.target.value)}
              onFocus={() => {
                isInputFocused.current = true;
              }}
              onBlur={() => {
                isInputFocused.current = false;
                setNavInput(navState.currentUrl || currentUrl);
              }}
              ref={urlInputRef}
              placeholder="URL 입력..."
              className="w-full bg-white/10 rounded px-2 py-0.5 text-[11px] text-white/70 placeholder:text-white/25 outline-none focus:bg-white/15 focus:text-white/90 transition-colors"
              spellCheck={false}
            />
          </form>
        </div>
      )}

      {/* 콘텐츠 영역 — webview/iframe이 직접 자식으로 height: 100% 유지 */}
      <div className="chat-preview-content">
        {currentEntry?.kind === "html" && (
          <PreviewHtmlContent
            content={currentEntry.content}
            label={activeTab?.label ?? ""}
            onNavigate={handleNavigateInTab}
            onPageContextChange={onPageContextChange}
          />
        )}
        {currentEntry?.kind === "url" && !isBlankEntry && (
          <PreviewUrlContent
            ref={urlContentRef}
            url={currentUrl}
            onPageContextChange={onPageContextChange}
            onNavStateChange={handleNavStateChange}
            onNewWindow={handleNavigateInTab}
          />
        )}
        {isBlankEntry && <PreviewBlankPage onNavigate={handleNavigateInTab} />}
      </div>
    </div>
  );
}
