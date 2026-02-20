/** 탭 기반 프리뷰 패널 — HTML 및 외부 URL을 브라우저 탭처럼 표시 */
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export type PreviewTab =
  | { id: string; type: "html"; content: string; label: string }
  | { id: string; type: "url"; url: string; label: string };

interface PreviewPanelProps {
  tabs: PreviewTab[];
  activeTabId: string | null;
  onActivateTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  isDragging?: boolean;
}

/** HTML 콘텐츠를 iframe으로 렌더링 */
function HtmlContent({ content }: { content: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(content);
      doc.close();
    }
  }, [content]);

  return <iframe ref={iframeRef} title="HTML Preview" className="w-full h-full border-none" />;
}

/** 외부 URL을 webview로 렌더링 (X-Frame-Options 우회) */
function UrlContent({ url }: { url: string }) {
  return <webview src={url} style={{ width: "100%", height: "100%", display: "flex" }} />;
}

export default function PreviewPanel({
  tabs,
  activeTabId,
  onActivateTab,
  onCloseTab,
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
        {activeTab?.type === "html" && <HtmlContent content={activeTab.content} />}
        {activeTab?.type === "url" && <UrlContent url={activeTab.url} />}
      </div>
    </div>
  );
}
