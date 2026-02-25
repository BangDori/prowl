/** 채팅 대화 뷰 (개별 룸의 메시지 표시 및 전송) */
import prowlLying from "@assets/prowl-lying.png";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import X from "lucide-react/dist/esm/icons/x";
import { Fragment, useCallback, useLayoutEffect, useRef, useState } from "react";
import ChatInputBar from "./ChatInputBar";
import ConversationHeader from "./ConversationHeader";
import LoadingIndicator from "./LoadingIndicator";
import MessageBubble from "./MessageBubble";
import PreviewPanel, { type PageContext, type PreviewTab } from "./PreviewPanel";
import UnreadDivider from "./UnreadDivider";
import { useChatMessages } from "./useChatMessages";

/** Omit<PreviewTab, "id"> — TypeScript의 union 분배 미지원으로 명시적 정의 */
type NewPreviewTab =
  | { type: "html"; content: string; label: string }
  | { type: "url"; url: string; label: string };

/** 탭 레이블 중복 시 숫자 접미사 부여 */
function dedupeLabel(label: string, existing: PreviewTab[]): string {
  const same = existing.filter((t) => t.label === label || t.label.startsWith(`${label} `));
  return same.length === 0 ? label : `${label} ${same.length + 1}`;
}

interface ChatConversationProps {
  roomId: string;
  initialMessage?: string | null;
  onBack: () => void;
  onNewChat: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function ChatConversation({
  roomId,
  initialMessage,
  onBack,
  onNewChat,
  isExpanded,
  onToggleExpand,
}: ChatConversationProps) {
  const {
    messages,
    loading,
    sendMessage,
    messagesEndRef,
    unreadDividerMsgId,
    chatConfig,
    providers,
    handleConfigChange,
    roomTitle,
  } = useChatMessages(roomId, initialMessage);

  const [splitRatio, setSplitRatio] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const splitWrapperRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevIsSplitViewRef = useRef(false);

  // isExpanded를 ref로도 추적 — addOrActivateTab 클로저에서 최신 값을 읽기 위함
  const isExpandedRef = useRef(isExpanded);
  isExpandedRef.current = isExpanded;

  // 탭 기반 프리뷰 패널 상태
  const [previewTabs, setPreviewTabs] = useState<PreviewTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const isSplitView = isExpanded && previewTabs.length > 0;

  // 페이지 컨텍스트 (webview 로드 시 자동 추출)
  const [pageContext, setPageContextState] = useState<PageContext | null>(null);

  const handlePageContextChange = useCallback((ctx: PageContext | null) => {
    setPageContextState(ctx);
    window.electronAPI.setPageContext(ctx);
  }, []);

  // 분할 뷰 전환 시 최신 메시지로 스크롤
  useLayoutEffect(() => {
    if (!isSplitView || prevIsSplitViewRef.current) {
      prevIsSplitViewRef.current = isSplitView;
      return;
    }
    prevIsSplitViewRef.current = true;
    const container = messagesContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [isSplitView]);

  /** 탭 추가 또는 동일 콘텐츠 탭 활성화 */
  const addOrActivateTab = useCallback(
    async (newTab: NewPreviewTab) => {
      const key = newTab.type === "html" ? newTab.content : newTab.url;
      const existing = previewTabs.find((t) => (t.type === "html" ? t.content : t.url) === key);

      if (existing) {
        setActiveTabId(existing.id);
        return;
      }

      const id = `tab_${Date.now()}`;
      setPreviewTabs((prev) => {
        const alreadyExists = prev.find((t) => (t.type === "html" ? t.content : t.url) === key);
        if (alreadyExists) return prev;
        const label = dedupeLabel(newTab.label, prev);
        return [...prev, { ...newTab, id, label } as PreviewTab];
      });
      setActiveTabId(id);

      if (!isExpandedRef.current) {
        await onToggleExpand();
      }
    },
    [onToggleExpand, previewTabs],
  );

  /** 탭 닫기 — 마지막 탭 닫힐 시 분할 뷰 자동 해제 */
  const closeTab = useCallback(
    (id: string) => {
      setPreviewTabs((prev) => {
        const next = prev.filter((t) => t.id !== id);
        if (next.length === 0) {
          setActiveTabId(null);
        } else if (activeTabId === id) {
          setActiveTabId(next.at(-1)?.id ?? null);
        }
        return next;
      });
    },
    [activeTabId],
  );

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const wrapper = splitWrapperRef.current;
    if (!wrapper) return;
    setIsDragging(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const handleMouseMove = (moveE: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const ratio = (moveE.clientX - rect.left) / rect.width;
      setSplitRatio(Math.min(Math.max(ratio, 0.2), 0.8));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  const hasMessages = messages.length > 0 || loading;

  const chatArea = (
    <>
      {hasMessages && (
        <div className="chat-messages-area">
          <ConversationHeader
            title={roomTitle}
            onBack={onBack}
            onClose={() => window.electronAPI.closeChatWindow()}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
          />
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 pb-3">
            <div className="flex flex-col justify-end min-h-full">
              {messages.map((msg, idx) => {
                const next = messages[idx + 1];
                const isLastInGroup =
                  !next ||
                  next.role !== msg.role ||
                  Math.abs(next.timestamp - msg.timestamp) > 10 * 60 * 1000;
                return (
                  <Fragment key={msg.id}>
                    {msg.id === unreadDividerMsgId.current && <UnreadDivider />}
                    <MessageBubble
                      message={msg}
                      isLastInGroup={isLastInGroup}
                      onOpenHtml={(html) =>
                        addOrActivateTab({ type: "html", content: html, label: "HTML" })
                      }
                      onOpenLink={(url, label) => addOrActivateTab({ type: "url", url, label })}
                    />
                  </Fragment>
                );
              })}
              {loading && <LoadingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}

      {!hasMessages && (
        <>
          <div className="chat-conv-header px-4 py-2">
            <button
              type="button"
              onClick={onBack}
              className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onToggleExpand}
                title={isExpanded ? "기본 크기로" : "전체화면"}
                className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => window.electronAPI.closeChatWindow()}
                className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1" />
          <div className="relative flex justify-end pr-0 z-10">
            <img
              src={prowlLying}
              alt="Prowl"
              className="w-28 h-auto object-contain opacity-60 drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]"
              style={{ marginBottom: "-12px" }}
            />
          </div>
        </>
      )}

      <ChatInputBar
        isLoading={loading}
        chatConfig={chatConfig}
        providers={providers}
        pageContext={pageContext}
        onSend={sendMessage}
        onNewChat={onNewChat}
        onConfigChange={handleConfigChange}
      />
    </>
  );

  // 항상 동일한 wrapper 구조 유지 — isSplitView 전환 시 chatArea가 remount되지 않도록
  return (
    <div ref={splitWrapperRef} className={`chat-split-wrapper${isDragging ? " is-dragging" : ""}`}>
      <div
        className="chat-split-left"
        style={isSplitView ? { width: `${splitRatio * 100}%` } : { flex: 1 }}
      >
        {chatArea}
      </div>
      {isSplitView && (
        <>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: 드래그 가능한 분할 구분선 */}
          <div className="chat-split-divider" onMouseDown={handleDividerMouseDown} />
          <PreviewPanel
            tabs={previewTabs}
            activeTabId={activeTabId}
            onActivateTab={setActiveTabId}
            onCloseTab={closeTab}
            onNewTab={() => addOrActivateTab({ type: "url", url: "about:blank", label: "새 탭" })}
            onPageContextChange={handlePageContextChange}
            isDragging={isDragging}
          />
        </>
      )}
    </div>
  );
}
