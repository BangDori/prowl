import { Plus, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import prowlLying from "../../../assets/prowl-lying.png";
import prowlProfile from "../../../assets/prowl-profile.png";
import type { ChatMessage } from "../../shared/types";

const PLACEHOLDERS = [
  "뭐가 궁금하냥...",
  "오늘은 뭘 도와줄까냥~",
  "말해봐, 듣고 있다냥 🐾",
  "심심하다냥... 뭐 없어?",
  "나한테 맡겨봐냥!",
];

function getRandomPlaceholder(): string {
  return PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const time = new Date(message.timestamp).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 chat-bubble-enter`}>
      {!isUser && (
        <img
          src={prowlProfile}
          alt="Prowl"
          className="flex-shrink-0 w-7 h-7 rounded-full mr-2 mt-1 object-cover"
        />
      )}
      <div className={`max-w-[75%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && <span className="text-[10px] text-white/40 mb-0.5 ml-1">Prowl</span>}
        <div
          className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? "bg-accent text-black rounded-br-sm"
              : "bg-white/10 text-white/90 rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-white/30 mt-0.5 mx-1">{time}</span>
      </div>
    </div>
  );
}

export default function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [placeholder, setPlaceholder] = useState(getRandomPlaceholder);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;

  // 글로벌 ESC 키로 채팅창 닫기
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        window.electronAPI.closeChatWindow();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(scrollToBottom, [messages, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    if (textareaRef.current) {
      // IME 조합 강제 종료: 포커스를 임시 요소로 옮겨 composition 중단
      const tmp = document.createElement("input");
      tmp.style.position = "fixed";
      tmp.style.opacity = "0";
      document.body.appendChild(tmp);
      tmp.focus();
      document.body.removeChild(tmp);
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }

    const result = await window.electronAPI.sendChatMessage(content, messagesRef.current);

    if (result.success && result.message) {
      const msg = result.message;
      setMessages((prev) => [...prev, msg]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: result.error || "오류가 발생했습니다.",
          timestamp: Date.now(),
        },
      ]);
    }
    setLoading(false);
  }, [input, loading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === "Escape") {
        window.electronAPI.closeChatWindow();
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
    <div className="chat-floating-root">
      {/* 대화 영역: 메시지가 있을 때만 표시 */}
      {hasMessages && (
        <div className="chat-messages-area">
          <div className="flex justify-end p-2">
            <button
              type="button"
              onClick={() => window.electronAPI.closeChatWindow()}
              className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-3">
            <div className="flex flex-col justify-end min-h-full">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {loading && (
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
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* 고양이 로고: 메시지가 없을 때 입력바 위에 누워있기 */}
      {!hasMessages && (
        <div className="relative flex justify-start pl-0 z-10">
          <img
            src={prowlLying}
            alt="Prowl"
            className="w-28 h-auto object-contain opacity-60 drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]"
            style={{ marginBottom: "-12px" }}
          />
        </div>
      )}

      {/* 하단 입력바 */}
      <div className="chat-input-bar">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          // biome-ignore lint/a11y/noAutofocus: 채팅창 열릴 때 즉시 입력 가능해야 함
          autoFocus
          className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30 resize-none outline-none leading-relaxed max-h-[120px]"
        />
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setPlaceholder(getRandomPlaceholder());
            }}
            title="새 대화"
            className="flex-shrink-0 p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="chat-send-btn"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
