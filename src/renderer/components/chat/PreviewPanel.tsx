/** 탭 기반 프리뷰 패널 — HTML 및 외부 URL을 브라우저 탭처럼 표시 */
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export type PreviewTab =
  | { id: string; type: "html"; content: string; label: string }
  | { id: string; type: "url"; url: string; label: string };

export type PageContext = { url: string; title: string; text: string };

/** 최소 webview 타입 (executeJavaScript + Electron 이벤트 지원) */
type WebviewEl = HTMLElement & {
  executeJavaScript(code: string): Promise<unknown>;
};

interface PreviewPanelProps {
  tabs: PreviewTab[];
  activeTabId: string | null;
  onActivateTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onOpenLink?: (url: string, label: string) => void;
  onPageContextChange?: (ctx: PageContext | null) => void;
  isDragging?: boolean;
}

/** HTML 콘텐츠를 iframe으로 렌더링 — 렌더 후 텍스트 추출, 링크 클릭 시 탭 열기 */
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

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(content);
    doc.close();

    // doc.write 후 동기적으로 텍스트 추출 가능
    const text = (doc.body?.innerText ?? "").slice(0, 3000);
    onPageContextChange?.({ url: "prowl-ui://html", title: label, text });

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a") as HTMLAnchorElement | null;
      if (!anchor?.href) return;
      if (!anchor.href.startsWith("http://") && !anchor.href.startsWith("https://")) return;
      e.preventDefault();
      const anchorLabel = anchor.textContent?.trim() || new URL(anchor.href).hostname;
      onOpenLink?.(anchor.href, anchorLabel);
    };

    doc.addEventListener("click", handleClick);
    return () => {
      doc.removeEventListener("click", handleClick);
      onPageContextChange?.(null);
    };
  }, [content, label, onOpenLink, onPageContextChange]);

  return <iframe ref={iframeRef} title="HTML Preview" className="w-full h-full border-none" />;
}

/** 외부 URL을 webview로 렌더링 — 로드 완료 시 페이지 컨텍스트 추출 */
function UrlContent({
  url,
  onPageContextChange,
}: {
  url: string;
  onPageContextChange?: (ctx: PageContext | null) => void;
}) {
  const webviewRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const webview = webviewRef.current as WebviewEl | null;
    if (!webview) return;

    const handleLoad = async () => {
      try {
        const title = await webview.executeJavaScript("document.title");
        const text = await webview.executeJavaScript("document.body.innerText");
        onPageContextChange?.({
          url,
          title: String(title),
          text: String(text).slice(0, 3000),
        });
      } catch {
        // webview 내부 오류 무시 (CSP 등)
      }
    };

    webview.addEventListener("did-finish-load", handleLoad);
    return () => {
      webview.removeEventListener("did-finish-load", handleLoad);
      onPageContextChange?.(null);
    };
  }, [url, onPageContextChange]);

  return (
    <webview
      ref={webviewRef as React.RefObject<HTMLElement>}
      src={url}
      style={{ width: "100%", height: "100%", display: "flex" }}
    />
  );
}

export default function PreviewPanel({
  tabs,
  activeTabId,
  onActivateTab,
  onCloseTab,
  onOpenLink,
  onPageContextChange,
  isDragging,
}: PreviewPanelProps) {
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs.at(-1);

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
      </div>

      {/* 콘텐츠 영역 */}
      <div className="chat-preview-content">
        {activeTab?.type === "html" && (
          <HtmlContent
            content={activeTab.content}
            label={activeTab.label}
            onOpenLink={onOpenLink}
            onPageContextChange={onPageContextChange}
          />
        )}
        {activeTab?.type === "url" && (
          <UrlContent url={activeTab.url} onPageContextChange={onPageContextChange} />
        )}
      </div>
    </div>
  );
}
