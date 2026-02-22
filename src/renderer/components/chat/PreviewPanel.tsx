/** 탭 기반 프리뷰 패널 — HTML 및 외부 URL을 브라우저 탭처럼 표시 */

import prowlLogo from "@assets/prowl-logo.png";
import { ChevronLeft, ChevronRight, Plus, RotateCcw, X } from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

export type PreviewTab =
  | { id: string; type: "html"; content: string; label: string }
  | { id: string; type: "url"; url: string; label: string };

export type PageContext = { url: string; title: string; text: string };

/** webview 타입 — executeJavaScript + 탐색 메서드 + Electron 이벤트 지원 */
type WebviewEl = HTMLElement & {
  executeJavaScript(code: string): Promise<unknown>;
  goBack(): void;
  goForward(): void;
  reload(): void;
  stop(): void;
  loadURL(url: string): void;
  canGoBack(): boolean;
  canGoForward(): boolean;
};

/** PreviewPanel이 UrlContent를 명령형으로 제어하기 위한 핸들 */
type UrlHandle = {
  goBack(): void;
  goForward(): void;
  reloadOrStop(): void;
  loadURL(url: string): void;
};

type NavState = {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  currentUrl: string;
};

interface PreviewPanelProps {
  tabs: PreviewTab[];
  activeTabId: string | null;
  onActivateTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onOpenLink?: (url: string, label: string) => void;
  onPageContextChange?: (ctx: PageContext | null) => void;
  onNewTab?: () => void;
  isDragging?: boolean;
}

/**
 * HTML 콘텐츠를 iframe으로 렌더링 — 렌더 후 텍스트 추출, 링크 클릭 시 탭 열기
 *
 * 콜백은 ref로 저장해 effect deps에서 제외한다.
 */
function HtmlContent({
  content,
  label,
  onOpenLink,
  onPageContextChange,
}: {
  content: string;
  label: string;
  onOpenLink?: (url: string, label: string) => void;
  onPageContextChange?: (ctx: PageContext | null) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onOpenLinkRef = useRef(onOpenLink);
  onOpenLinkRef.current = onOpenLink;
  const onPageContextChangeRef = useRef(onPageContextChange);
  onPageContextChangeRef.current = onPageContextChange;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(content);
    doc.close();

    const text = (doc.body?.innerText ?? "").slice(0, 3000);
    onPageContextChangeRef.current?.({ url: "prowl-ui://html", title: label, text });

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a") as HTMLAnchorElement | null;
      if (!anchor?.href) return;
      if (!anchor.href.startsWith("http://") && !anchor.href.startsWith("https://")) return;
      e.preventDefault();
      const anchorLabel = anchor.textContent?.trim() || new URL(anchor.href).hostname;
      onOpenLinkRef.current?.(anchor.href, anchorLabel);
    };

    doc.addEventListener("click", handleClick);
    return () => {
      doc.removeEventListener("click", handleClick);
      onPageContextChangeRef.current?.(null);
    };
  }, [content, label]);

  return <iframe ref={iframeRef} title="HTML Preview" className="w-full h-full border-none" />;
}

/**
 * 외부 URL을 webview로 렌더링 — 네비게이션 이벤트 추적 및 페이지 컨텍스트 추출
 *
 * forwardRef + useImperativeHandle로 부모(PreviewPanel)가 goBack/goForward 등을 호출한다.
 * webview는 .chat-preview-content의 직접 자식으로 height: 100% 유지 (레이아웃 안정성).
 */
const UrlContent = forwardRef<
  UrlHandle,
  {
    url: string;
    onPageContextChange?: (ctx: PageContext | null) => void;
    onNavStateChange?: (s: NavState) => void;
  }
>(({ url, onPageContextChange, onNavStateChange }, ref) => {
  const webviewRef = useRef<HTMLElement>(null);
  const onPageContextChangeRef = useRef(onPageContextChange);
  onPageContextChangeRef.current = onPageContextChange;
  const onNavStateChangeRef = useRef(onNavStateChange);
  onNavStateChangeRef.current = onNavStateChange;
  const isLoadingRef = useRef(false);

  useImperativeHandle(ref, () => ({
    goBack: () => (webviewRef.current as WebviewEl | null)?.goBack(),
    goForward: () => (webviewRef.current as WebviewEl | null)?.goForward(),
    reloadOrStop: () => {
      const wv = webviewRef.current as WebviewEl | null;
      isLoadingRef.current ? wv?.stop() : wv?.reload();
    },
    loadURL: (u: string) => (webviewRef.current as WebviewEl | null)?.loadURL(u),
  }));

  useEffect(() => {
    const webview = webviewRef.current as WebviewEl | null;
    if (!webview) return;

    const pushNav = (loading: boolean, currentUrl?: string) => {
      isLoadingRef.current = loading;
      onNavStateChangeRef.current?.({
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward(),
        isLoading: loading,
        currentUrl: currentUrl ?? url,
      });
    };

    const handleFinishLoad = async () => {
      let currentUrl = url;
      let title = "";
      let text = "";
      try {
        currentUrl = String(await webview.executeJavaScript("location.href"));
        title = String(await webview.executeJavaScript("document.title"));
        text = String(await webview.executeJavaScript("document.body.innerText")).slice(0, 3000);
      } catch {
        /* CSP 등 무시 */
      }
      pushNav(false, currentUrl);
      onPageContextChangeRef.current?.({ url: currentUrl, title, text });
    };

    const handleStartLoading = () => pushNav(true);
    const handleNavigate = (e: Event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const navUrl = (e as any).url as string | undefined;
      if (navUrl) pushNav(false, navUrl);
    };

    webview.addEventListener("did-finish-load", handleFinishLoad);
    webview.addEventListener("did-start-loading", handleStartLoading);
    webview.addEventListener("did-navigate", handleNavigate);
    webview.addEventListener("did-navigate-in-page", handleNavigate);
    return () => {
      webview.removeEventListener("did-finish-load", handleFinishLoad);
      webview.removeEventListener("did-start-loading", handleStartLoading);
      webview.removeEventListener("did-navigate", handleNavigate);
      webview.removeEventListener("did-navigate-in-page", handleNavigate);
      onPageContextChangeRef.current?.(null);
    };
  }, [url]);

  return (
    <webview
      ref={webviewRef as React.RefObject<HTMLElement>}
      src={url}
      style={{ width: "100%", height: "100%", display: "flex" }}
    />
  );
});
UrlContent.displayName = "UrlContent";

/** about:blank 탭에 표시되는 Prowl 브랜딩 페이지 */
function BlankPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 10,
        background: "rgba(14, 11, 22, 0.96)",
      }}
    >
      <img src={prowlLogo} alt="Prowl" style={{ width: 88, height: 88, opacity: 0.8 }} />
      <span
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "rgba(255,255,255,0.6)",
          letterSpacing: "0.14em",
        }}
      >
        PROWL
      </span>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", marginTop: 4 }}>
        URL을 입력해 탐색하세요
      </span>
    </div>
  );
}

export default function PreviewPanel({
  tabs,
  activeTabId,
  onActivateTab,
  onCloseTab,
  onOpenLink,
  onPageContextChange,
  onNewTab,
  isDragging,
}: PreviewPanelProps) {
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs.at(-1);
  const urlContentRef = useRef<UrlHandle>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

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
    // about:blank 탭은 URL 입력창을 비워 placeholder가 보이게 함
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

  const isBlankTab = activeTab?.type === "url" && activeTab.url === "about:blank";
  const isActiveUrl = activeTab?.type === "url";

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let target = navInput.trim();
    if (!target || target === "about:blank") return;
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = `https://${target}`;
    }
    if (isBlankTab && activeTab) {
      // 빈 탭: 새 URL 탭 열고 이 탭 닫기 (webview가 없으므로 loadURL 불가)
      try {
        onOpenLink?.(target, new URL(target).hostname);
      } catch {
        onOpenLink?.(target, target);
      }
      onCloseTab(activeTab.id);
    } else {
      urlContentRef.current?.loadURL(target);
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

      {/* URL 탭 전용 네비게이션 바 — .chat-preview-content 위의 flex 형제 */}
      {isActiveUrl && (
        <div className="chat-preview-nav">
          <button
            type="button"
            onClick={() => urlContentRef.current?.goBack()}
            disabled={!navState.canGoBack}
            title="뒤로"
            className="p-1 rounded text-white/50 hover:text-white/80 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => urlContentRef.current?.goForward()}
            disabled={!navState.canGoForward}
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
                setNavInput(
                  navState.currentUrl || (activeTab?.type === "url" ? activeTab.url : ""),
                );
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
        {activeTab?.type === "html" && (
          <HtmlContent
            content={activeTab.content}
            label={activeTab.label}
            onOpenLink={onOpenLink}
            onPageContextChange={onPageContextChange}
          />
        )}
        {activeTab?.type === "url" && !isBlankTab && (
          <UrlContent
            ref={urlContentRef}
            url={activeTab.url}
            onPageContextChange={onPageContextChange}
            onNavStateChange={handleNavStateChange}
          />
        )}
        {isBlankTab && <BlankPage />}
      </div>
    </div>
  );
}
