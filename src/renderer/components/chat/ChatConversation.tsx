/** 채팅 대화 뷰 (개별 룸의 메시지 표시 및 전송) */
import prowlLying from "@assets/prowl-lying.png";
import prowlProfile from "@assets/prowl-profile.png";
import type { ChatConfig, ChatMessage, ProviderStatus } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Maximize2, Minimize2, Plus, Send, X } from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  useChatRoom,
  useChatUnreadCounts,
  useMarkChatRoomRead,
  useSaveChatMessages,
} from "../../hooks/useChatRooms";
import { queryKeys } from "../../queries/keys";
import ModelSelector from "../ModelSelector";
import MessageBubble from "./MessageBubble";
import PreviewPanel, { type PreviewTab } from "./PreviewPanel";
import UnreadDivider from "./UnreadDivider";

/** 탭 레이블 중복 시 숫자 접미사 부여 */
function dedupeLabel(label: string, existing: PreviewTab[]): string {
  const same = existing.filter((t) => t.label === label || t.label.startsWith(`${label} `));
  return same.length === 0 ? label : `${label} ${same.length + 1}`;
}

/** 채팅 입력창에 표시될 플레이스홀더 메시지 목록 */
const PLACEHOLDERS = [
  "무엇이든 물어봐라냥~",
  "오늘은 뭘 도와줄까냥?",
  "궁금한 게 있으면 말해라냥~",
  "나한테 맡겨라냥! 🐾",
];

function getRandomPlaceholder(): string {
  return PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
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
  const queryClient = useQueryClient();
  const { data: roomData } = useChatRoom(roomId);
  const { data: unreadCounts } = useChatUnreadCounts();
  const saveMessages = useSaveChatMessages();
  const markRead = useMarkChatRoomRead();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [placeholder] = useState(getRandomPlaceholder);
  const [chatConfig, setChatConfig] = useState<ChatConfig | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [initialized, setInitialized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;
  const initialMessageProcessed = useRef(false);
  const unreadDividerMsgId = useRef<string | null>(null);
  const hasMarkedRead = useRef(false);
  const hasInitialScrolled = useRef(false);

  const [splitRatio, setSplitRatio] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const splitWrapperRef = useRef<HTMLDivElement>(null);

  // roomId 변경 시 상태 리셋 (렌더 중 동기 처리로 race condition 방지)
  const [prevRoomId, setPrevRoomId] = useState(roomId);
  if (prevRoomId !== roomId) {
    setPrevRoomId(roomId);
    setInitialized(false);
    initialMessageProcessed.current = false;
    unreadDividerMsgId.current = null;
    hasMarkedRead.current = false;
    hasInitialScrolled.current = false;
  }

  // 룸 데이터 로드 시 메시지 초기화 + 백그라운드 refetch 반영
  useEffect(() => {
    if (!roomData) return;
    if (!initialized) {
      setMessages(roomData.messages);
      setInitialized(true);
    } else if (!loading && roomData.messages.length > messagesRef.current.length) {
      // main에서 저장한 AI 응답이 디스크에 반영된 경우 (뒤로가기 후 복귀)
      setMessages(roomData.messages);
    }
  }, [roomData, initialized, loading]);

  // 읽음 구분선 위치 계산 + mark-read (roomData·unreadCounts 둘 다 로드 후 한번만)
  useEffect(() => {
    if (!initialized || hasMarkedRead.current || !roomData) return;
    if (unreadCounts === undefined) return;

    const unreadCount = unreadCounts[roomId] ?? 0;
    if (unreadCount > 0 && roomData.messages.length > 0) {
      const firstUnreadIdx = roomData.messages.length - unreadCount;
      if (firstUnreadIdx > 0 && firstUnreadIdx < roomData.messages.length) {
        unreadDividerMsgId.current = roomData.messages[firstUnreadIdx].id;
      }
    }
    const lastMsg = roomData.messages.at(-1);
    if (lastMsg) {
      markRead.mutate({ roomId, lastMessageId: lastMsg.id });
    }
    hasMarkedRead.current = true;
  }, [initialized, roomData, unreadCounts, roomId, markRead]);

  // 채팅 설정 및 프로바이더 목록 로드
  useEffect(() => {
    Promise.all([window.electronAPI.getChatConfig(), window.electronAPI.getChatProviders()]).then(
      ([config, providerList]) => {
        setChatConfig(config);
        setProviders(providerList);
      },
    );
  }, []);

  const handleConfigChange = useCallback((config: ChatConfig) => {
    setChatConfig(config);
    window.electronAPI.setChatConfig(config);
  }, []);

  // ESC 키로 창 닫기
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.electronAPI.closeChatWindow();
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    if (messages.length === 0) return;
    // 초기 진입 시 즉시 이동, 이후 새 메시지는 smooth
    const behavior = hasInitialScrolled.current ? "smooth" : "instant";
    hasInitialScrolled.current = true;
    scrollToBottom(behavior);
  }, [messages, scrollToBottom]);

  // 스트림 이벤트 리스너 (저장은 main, 읽음 처리는 대화방에 있을 때만 renderer)
  useEffect(() => {
    const offMessage = window.electronAPI.onChatStreamMessage((msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    const offDone = window.electronAPI.onChatStreamDone(() => {
      setLoading(false);
      // 대화방에 있으므로 즉시 읽음 처리
      const lastMsg = messagesRef.current.at(-1);
      if (lastMsg) markRead.mutate({ roomId, lastMessageId: lastMsg.id });
      queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms.all });
    });
    const offError = window.electronAPI.onChatStreamError((error) => {
      setLoading(false);
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: error || "오류가 발생했습니다.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
      // 대화방에 있으므로 즉시 읽음 처리
      const lastMsg = messagesRef.current.at(-1);
      if (lastMsg) markRead.mutate({ roomId, lastMessageId: lastMsg.id });
      queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms.all });
    });
    return () => {
      offMessage();
      offDone();
      offError();
    };
  }, [roomId, queryClient, markRead]);

  /** 메시지 전송 핵심 로직 (입력 및 초기 메시지 양쪽에서 사용) */
  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content,
        timestamp: Date.now(),
      };
      const updated = [...messagesRef.current, userMsg];
      messagesRef.current = updated;
      setMessages(updated);
      setLoading(true);

      // 유저 메시지를 즉시 저장 + 읽음 처리 (뒤로가기 시 유실·미열람 방지)
      saveMessages.mutate({ roomId, messages: updated });
      markRead.mutate({ roomId, lastMessageId: userMsg.id });

      // main에 roomId + history(유저 메시지 포함) 전달 → main이 AI 응답 저장까지 책임
      const result = await window.electronAPI.sendChatMessage(roomId, content, updated);
      if (!result.success) {
        setLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "assistant" as const,
            content: "오류가 발생했습니다.",
            timestamp: Date.now(),
          },
        ]);
      }
      // success → 메시지는 stream 이벤트로 도착, 저장은 main이 처리
    },
    [roomId, saveMessages, markRead],
  );

  // 초기 메시지 자동 전송 (로비에서 메시지 입력 후 진입 시)
  useEffect(() => {
    if (initialMessage && initialized && !initialMessageProcessed.current) {
      initialMessageProcessed.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage, initialized, sendMessage]);

  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    sendMessage(content);
  }, [input, loading, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const hasMessages = messages.length > 0 || loading;

  // 탭 기반 프리뷰 패널 상태
  const [previewTabs, setPreviewTabs] = useState<PreviewTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const isSplitView = isExpanded && previewTabs.length > 0;

  /** 탭 추가 또는 동일 콘텐츠 탭 활성화 */
  const addOrActivateTab = useCallback(
    async (newTab: Omit<PreviewTab, "id">) => {
      let activated = false;
      setPreviewTabs((prev) => {
        const key = newTab.type === "html" ? newTab.content : newTab.url;
        const existing = prev.find((t) => (t.type === "html" ? t.content : t.url) === key);
        if (existing) {
          setActiveTabId(existing.id);
          activated = true;
          return prev;
        }
        const id = `tab_${Date.now()}`;
        setActiveTabId(id);
        const label = dedupeLabel(newTab.label, prev);
        return [...prev, { ...newTab, id, label } as PreviewTab];
      });
      if (!isExpanded && !activated) {
        await onToggleExpand();
      }
    },
    [isExpanded, onToggleExpand],
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

  const chatArea = (
    <>
      {/* 대화 영역 */}
      {hasMessages && (
        <div className="chat-messages-area">
          <ConversationHeader
            title={roomData?.title}
            onBack={onBack}
            onClose={() => window.electronAPI.closeChatWindow()}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
          />
          <div className="flex-1 overflow-y-auto px-4 pb-3">
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

      {/* 고양이 로고: 메시지가 없을 때 */}
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

      {/* 하단 입력바 */}
      <div className="chat-input-bar">
        {chatConfig && providers.length > 0 && (
          <ModelSelector config={chatConfig} providers={providers} onSelect={handleConfigChange} />
        )}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          // biome-ignore lint/a11y/noAutofocus: 대화 진입 시 즉시 입력 가능해야 함
          autoFocus
          className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30 resize-none outline-none leading-relaxed max-h-[120px]"
        />
        <button
          type="button"
          onClick={onNewChat}
          title="새 대화"
          className="flex-shrink-0 p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="chat-send-btn"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );

  if (isSplitView) {
    return (
      <div
        ref={splitWrapperRef}
        className={`chat-split-wrapper${isDragging ? " is-dragging" : ""}`}
      >
        <div className="chat-split-left" style={{ width: `${splitRatio * 100}%` }}>
          {chatArea}
        </div>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: 드래그 가능한 분할 구분선 */}
        <div className="chat-split-divider" onMouseDown={handleDividerMouseDown} />
        <PreviewPanel
          tabs={previewTabs}
          activeTabId={activeTabId}
          onActivateTab={setActiveTabId}
          onCloseTab={closeTab}
          onOpenLink={(url, label) => addOrActivateTab({ type: "url", url, label })}
          isDragging={isDragging}
        />
      </div>
    );
  }

  return chatArea;
}

/** 대화 헤더 (뒤로가기 + 제목 + 전체화면 + 닫기) */
function ConversationHeader({
  title,
  onBack,
  onClose,
  isExpanded,
  onToggleExpand,
}: {
  title?: string;
  onBack: () => void;
  onClose: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <div className="chat-conv-header px-3 py-2">
      <button
        type="button"
        onClick={onBack}
        className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-[12px] text-white/50 truncate max-w-[60%]">{title || "새 대화"}</span>
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
          onClick={onClose}
          className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/** 로딩 인디케이터 (3개 바운싱 dot) */
function LoadingIndicator() {
  return (
    <div className="flex justify-start mb-3 chat-bubble-enter">
      <img
        src={prowlProfile}
        alt="Prowl"
        className="flex-shrink-0 w-7 h-7 rounded-full mr-2 mt-1 object-cover"
      />
      <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-white/10">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.15s]" />
          <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.3s]" />
        </div>
      </div>
    </div>
  );
}
