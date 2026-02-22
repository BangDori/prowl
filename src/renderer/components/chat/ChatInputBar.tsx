/** 채팅 입력바 — input 상태를 격리하여 MessageBubble 재렌더 차단 */
import type { ChatConfig, ProviderStatus } from "@shared/types";
import { Plus, Send } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import ModelSelector from "../ModelSelector";
import type { PageContext } from "./PreviewPanel";

const PLACEHOLDERS = [
  "무엇이든 물어봐라냥~",
  "오늘은 뭘 도와줄까냥?",
  "궁금한 게 있으면 말해라냥~",
  "나한테 맡겨라냥! 🐾",
];

function getRandomPlaceholder(): string {
  return PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
}

interface ChatInputBarProps {
  loading: boolean;
  chatConfig: ChatConfig | null;
  providers: ProviderStatus[];
  pageContext: PageContext | null;
  onSend: (content: string) => void;
  onNewChat: () => void;
  onConfigChange: (config: ChatConfig) => void;
}

export default function ChatInputBar({
  loading,
  chatConfig,
  providers,
  pageContext,
  onSend,
  onNewChat,
  onConfigChange,
}: ChatInputBarProps) {
  const [input, setInput] = useState("");
  const [placeholder] = useState(getRandomPlaceholder);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSend(content);
  }, [input, loading, onSend]);

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

  return (
    <>
      {/* 페이지 컨텍스트 인디케이터 */}
      {pageContext && (
        <div className="flex items-center gap-1.5 px-4 py-1 text-[11px] text-white/40 bg-[rgba(13,13,13,0.9)] backdrop-blur-[20px]">
          <span>👁</span>
          <span className="text-amber-400/70">Prowl이 함께 보고 있어요</span>
          <span>·</span>
          <span className="truncate max-w-[140px]">
            {pageContext.url.startsWith("prowl-ui://")
              ? pageContext.title
              : (() => {
                  try {
                    return new URL(pageContext.url).hostname;
                  } catch {
                    return pageContext.url;
                  }
                })()}
          </span>
        </div>
      )}

      {/* 하단 입력바 */}
      <div className="chat-input-bar">
        {chatConfig && providers.length > 0 && (
          <ModelSelector config={chatConfig} providers={providers} onSelect={onConfigChange} />
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
