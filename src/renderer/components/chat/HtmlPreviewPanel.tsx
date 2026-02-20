/** HTML 구조화 UI 프리뷰 패널 (iframe 기반 렌더링) */
import { useEffect, useRef } from "react";

interface HtmlPreviewPanelProps {
  html: string;
}

export default function HtmlPreviewPanel({ html }: HtmlPreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
  }, [html]);

  return (
    <div className="chat-html-preview">
      <iframe ref={iframeRef} title="HTML Preview" className="w-full h-full border-none" />
    </div>
  );
}
