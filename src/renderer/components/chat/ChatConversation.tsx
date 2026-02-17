/** 채팅 대화 뷰 (개별 룸의 메시지 표시 및 전송) */
import prowlLying from "@assets/prowl-lying.png";
import prowlProfile from "@assets/prowl-profile.png";
import type { ChatConfig, ChatMessage, ProviderStatus } from "@shared/types";
import { ChevronLeft, Plus, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatRoom, useSaveChatMessages } from "../../hooks/useChatRooms";
import ModelSelector from "../ModelSelector";
import MessageBubble from "./MessageBubble";

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
}

export default function ChatConversation({
  roomId,
  initialMessage,
  onBack,
  onNewChat,
}: ChatConversationProps) {
  const { data: roomData } = useChatRoom(roomId);
  const saveMessages = useSaveChatMessages();

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

  // roomId 변경 시 상태 리셋 (렌더 중 동기 처리로 race condition 방지)
  const [prevRoomId, setPrevRoomId] = useState(roomId);
  if (prevRoomId !== roomId) {
    setPrevRoomId(roomId);
    setInitialized(false);
    initialMessageProcessed.current = false;
  }

  // 룸 데이터 로드 시 메시지 초기화
  useEffect(() => {
    if (roomData && !initialized) {
      setMessages(roomData.messages);
      setInitialized(true);
    }
  }, [roomData, initialized]);

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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(scrollToBottom, [messages, scrollToBottom]);

  // 스트림 이벤트 리스너
  useEffect(() => {
    const offMessage = window.electronAPI.onChatStreamMessage((msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    const offDone = window.electronAPI.onChatStreamDone(() => {
      setLoading(false);
      saveMessages.mutate({ roomId, messages: messagesRef.current });
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
      saveMessages.mutate({ roomId, messages: messagesRef.current });
    });
    return () => {
      offMessage();
      offDone();
      offError();
    };
  }, [roomId, saveMessages]);

  /** 메시지 전송 핵심 로직 (입력 및 초기 메시지 양쪽에서 사용) */
  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      const result = await window.electronAPI.sendChatMessage(content, messagesRef.current);
      if (!result.success) {
        setLoading(false);
        const errMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: result.error || "오류가 발생했습니다.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
        saveMessages.mutate({ roomId, messages: messagesRef.current });
      }
      // success → 메시지는 stream 이벤트로 도착
    },
    [roomId, saveMessages],
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

  return (
    <>
      {/* 대화 영역 */}
      {hasMessages && (
        <div className="chat-messages-area">
          <ConversationHeader
            title={roomData?.title}
            onBack={onBack}
            onClose={() => window.electronAPI.closeChatWindow()}
          />
          <div className="flex-1 overflow-y-auto px-4 pb-3">
            <div className="flex flex-col justify-end min-h-full">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {loading && <LoadingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* 고양이 로고: 메시지가 없을 때 */}
      {!hasMessages && (
        <>
          <div className="flex items-center justify-between px-4 py-2">
            <button
              type="button"
              onClick={onBack}
              className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => window.electronAPI.closeChatWindow()}
              className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
}

/** 대화 헤더 (뒤로가기 + 제목 + 닫기) */
function ConversationHeader({
  title,
  onBack,
  onClose,
}: {
  title?: string;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <button
        type="button"
        onClick={onBack}
        className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-[12px] text-white/50 truncate max-w-[60%]">{title || "새 대화"}</span>
      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
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
