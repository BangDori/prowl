/** 개별 채팅 메시지 버블 컴포넌트 */
import prowlProfile from "@assets/prowl-profile.png";
import type { ChatMessage, ToolApprovalMeta } from "@shared/types";
import { ArrowUpRight, Check, Copy, Play, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

/** 도구 실행 승인/거부 버튼 패널 */
function ApprovalButtons({
  approval: _approval,
  state,
  onApprove,
  onReject,
}: {
  approval: ToolApprovalMeta;
  state: "pending" | "approved" | "rejected";
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  if (state === "approved") {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/40">
        <Check className="w-3 h-3 text-green-400" />
        <span>실행됨</span>
      </div>
    );
  }

  if (state === "rejected") {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/40">
        <X className="w-3 h-3" />
        <span>취소됨</span>
      </div>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
      <button
        type="button"
        onClick={onApprove}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] bg-accent text-black font-medium hover:bg-accent-hover transition-colors"
      >
        <Play className="w-3 h-3" />
        실행
      </button>
      <button
        type="button"
        onClick={onReject}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] bg-white/10 text-white/70 hover:bg-white/15 transition-colors"
      >
        <X className="w-3 h-3" />
        취소
      </button>
    </div>
  );
}

/** 링크 클릭 시 표시할 레이블 생성 */
function getLinkLabel(href: string, children: React.ReactNode): string {
  const text = String(children ?? "").trim();
  if (text && text !== href) return text;
  try {
    return new URL(href).hostname;
  } catch {
    return href;
  }
}

interface MessageBubbleProps {
  message: ChatMessage;
  /** 같은 발신자의 연속 메시지 그룹에서 마지막 메시지인지 여부 */
  isLastInGroup?: boolean;
  /** HTML 프리뷰 탭 열기 콜백 */
  onOpenHtml?: (html: string) => void;
  /** 외부 링크 탭 열기 콜백 */
  onOpenLink?: (url: string, label: string) => void;
}

/** <prowl-ui> 태그를 제거한 표시용 텍스트 반환 */
function stripProwlUi(content: string): string {
  return content.replace(/<prowl-ui>[\s\S]*?<\/prowl-ui>/g, "").trim();
}

export default function MessageBubble({
  message,
  isLastInGroup = true,
  onOpenHtml,
  onOpenLink,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const hasHtmlOutput = !isUser && /<prowl-ui>/.test(message.content);
  const displayContent = hasHtmlOutput ? stripProwlUi(message.content) : message.content;
  const htmlContent = useMemo(() => {
    if (!hasHtmlOutput) return null;
    return message.content.match(/<prowl-ui>([\s\S]*?)<\/prowl-ui>/)?.[1] ?? null;
  }, [hasHtmlOutput, message.content]);
  const [approvalState, setApprovalState] = useState<"pending" | "approved" | "rejected">(
    message.approval?.status ?? "pending",
  );
  const time = new Date(message.timestamp).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  /** 마크다운 커스텀 컴포넌트 — 링크 핸들러는 onOpenLink를 캡처 */
  const markdownComponents = useMemo(
    () => ({
      h1: ({ children }: { children?: React.ReactNode }) => (
        <strong className="block mt-2 mb-1">{children}</strong>
      ),
      h2: ({ children }: { children?: React.ReactNode }) => (
        <strong className="block mt-2 mb-1">{children}</strong>
      ),
      h3: ({ children }: { children?: React.ReactNode }) => (
        <strong className="block mt-1.5 mb-0.5">{children}</strong>
      ),
      p: ({ children }: { children?: React.ReactNode }) => (
        <p className="mb-1 last:mb-0">{children}</p>
      ),
      ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="list-disc pl-4 mb-1">{children}</ul>
      ),
      ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="list-decimal pl-4 mb-1">{children}</ol>
      ),
      code: ({ children }: { children?: React.ReactNode }) => (
        <code className="bg-white/10 px-1 py-0.5 rounded text-[12px]">{children}</code>
      ),
      pre: ({ children }: { children?: React.ReactNode }) => (
        <pre className="bg-white/10 p-2 rounded-lg my-1 overflow-x-auto text-[12px]">
          {children}
        </pre>
      ),
      a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
        <button
          type="button"
          onClick={() => {
            if (!href) return;
            if (onOpenLink) {
              onOpenLink(href, getLinkLabel(href, children));
            } else {
              window.electronAPI.openExternal(href);
            }
          }}
          className="inline-flex items-baseline gap-0.5 text-accent hover:text-accent-hover underline underline-offset-2 cursor-pointer"
        >
          <span>{children}</span>
          <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 inline-block translate-y-[1px]" />
        </button>
      ),
    }),
    [onOpenLink],
  );

  const showMeta = isLastInGroup;

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} ${showMeta ? "mb-3" : "mb-1"} chat-bubble-enter group`}
    >
      {!isUser &&
        (showMeta ? (
          <img
            src={prowlProfile}
            alt="Prowl"
            className="flex-shrink-0 w-7 h-7 rounded-full mr-2 mt-1 object-cover"
          />
        ) : (
          <div className="w-7 mr-2 flex-shrink-0" />
        ))}
      <div className={`max-w-[85%] flex ${isUser ? "items-end" : "items-end"} gap-1`}>
        {showMeta && isUser && (
          <span className="text-[10px] text-white/30 mb-0.5 flex-shrink-0">{time}</span>
        )}
        <div
          className={`relative px-3 py-2 rounded-2xl text-[13px] leading-relaxed break-words ${
            isUser
              ? "bg-accent text-black rounded-br-sm whitespace-pre-wrap"
              : "bg-white/10 text-white/90 rounded-bl-sm"
          }`}
        >
          {isUser ? (
            displayContent
          ) : (
            <>
              {displayContent && (
                <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownComponents}>
                  {displayContent}
                </Markdown>
              )}
              {hasHtmlOutput && onOpenHtml && htmlContent && (
                <button
                  type="button"
                  onClick={() => onOpenHtml(htmlContent)}
                  className="mt-1.5 flex items-center gap-1.5 text-[11px] text-accent hover:text-accent-hover transition-colors select-none"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                  HTML 보기
                </button>
              )}
            </>
          )}
          {message.approval && (
            <ApprovalButtons
              approval={message.approval}
              state={approvalState}
              onApprove={async () => {
                setApprovalState("approved");
                await window.electronAPI.approveTool(message.approval?.id);
              }}
              onReject={async () => {
                setApprovalState("rejected");
                await window.electronAPI.rejectTool(message.approval?.id);
              }}
            />
          )}
          {!hasHtmlOutput && (
            <button
              type="button"
              onClick={handleCopy}
              className={`absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${
                isUser ? "text-black/30 hover:text-black/60" : "text-white/30 hover:text-white/60"
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
        {showMeta && !isUser && (
          <span className="text-[10px] text-white/30 mb-0.5 flex-shrink-0">{time}</span>
        )}
      </div>
    </div>
  );
}
