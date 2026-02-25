/** HTML 미리보기 — iframe으로 렌더링, 링크 클릭 시 인탭 탐색 */
import { useEffect, useRef } from "react";
import type { PageContext } from "./PreviewPanel";

/**
 * HTML 콘텐츠를 iframe으로 렌더링 — 렌더 후 텍스트 추출, 링크 클릭 시 인탭 탐색
 *
 * 콜백은 ref로 저장해 effect deps에서 제외한다.
 */
export default function PreviewHtmlContent({
  content,
  label,
  onNavigate,
  onPageContextChange,
}: {
  content: string;
  label: string;
  onNavigate?: (url: string) => void;
  onPageContextChange?: (ctx: PageContext | null) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;
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
      onNavigateRef.current?.(anchor.href);
    };

    doc.addEventListener("click", handleClick);
    return () => {
      doc.removeEventListener("click", handleClick);
      onPageContextChangeRef.current?.(null);
    };
  }, [content, label]);

  return <iframe ref={iframeRef} title="HTML Preview" className="w-full h-full border-none" />;
}
