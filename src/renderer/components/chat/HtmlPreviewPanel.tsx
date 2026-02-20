/** HTML 구조화 UI 프리뷰 패널 (iframe 기반 렌더링) */
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface HtmlPreviewPanelProps {
  html: string;
  onClose: () => void;
}

export default function HtmlPreviewPanel({ html, onClose }: HtmlPreviewPanelProps) {
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
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 z-10 p-1 rounded-md bg-black/10 text-gray-500 hover:text-gray-800 hover:bg-black/20 transition-colors"
        title="닫기"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <iframe ref={iframeRef} title="HTML Preview" className="w-full h-full border-none" />
    </div>
  );
}
