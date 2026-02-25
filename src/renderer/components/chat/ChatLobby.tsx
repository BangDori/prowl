/** 채팅 로비 (대화방 목록 + 즉시 입력 가능한 인터페이스) */
import prowlLying from "@assets/prowl-lying.png";
import type { ChatConfig, ProviderStatus } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import Send from "lucide-react/dist/esm/icons/send";
import X from "lucide-react/dist/esm/icons/x";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatRooms } from "../../hooks/useChatRooms";
import { queryKeys } from "../../queries/keys";
import ModelSelector from "../ModelSelector";
import ChatRoomList from "./ChatRoomList";

const PLACEHOLDERS = [
  "무엇이든 물어봐라냥~",
  "오늘은 뭘 도와줄까냥?",
  "궁금한 게 있으면 말해라냥~",
  "나한테 맡겨라냥! 🐾",
];

function getRandomPlaceholder(): string {
  return PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
}

interface ChatLobbyProps {
  onSelectRoom: (roomId: string) => void;
  onSendMessage: (content: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function ChatLobby({
  onSelectRoom,
  onSendMessage,
  isExpanded,
  onToggleExpand,
}: ChatLobbyProps) {
  const queryClient = useQueryClient();
  const { data: rooms = [] } = useChatRooms();
  const [input, setInput] = useState("");
  const [placeholder] = useState(getRandomPlaceholder);
  const [chatConfig, setChatConfig] = useState<ChatConfig | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.electronAPI.closeChatWindow();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 채팅 창이 다시 열릴 때 룸 목록 새로고침
  useEffect(() => {
    return window.electronAPI.onChatShown(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms.all });
    });
  }, [queryClient]);

  // 미열람 변경 이벤트 수신 → 룸 목록 + unread 쿼리 갱신
  useEffect(() => {
    return window.electronAPI.onChatUnreadChanged(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms.all });
    });
  }, [queryClient]);

  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSendMessage(content);
  }, [input, sending, onSendMessage]);

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

  const hasRooms = rooms.length > 0;

  return (
    <>
      <div className="chat-lobby">
        {/* 헤더 */}
        <div className="chat-room-header">
          <span className="text-[13px] font-medium text-white/90">Prowl Chat</span>
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

        {/* 대화방 목록 */}
        {hasRooms && <ChatRoomList onSelectRoom={onSelectRoom} />}

        {/* 고양이 이미지 (레이아웃 흐름 밖, 우하단 오버레이) */}
        {hasRooms ? (
          <div className="absolute bottom-0 right-0 z-10 pointer-events-none">
            <img
              src={prowlLying}
              alt="Prowl"
              className="w-28 h-auto object-contain opacity-60 drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]"
              style={{ marginBottom: "-12px" }}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 pb-4">
            <img src={prowlLying} alt="Prowl" className="w-24 h-auto object-contain opacity-50" />
            <p className="text-[12px] text-white/30">대화를 시작해보세요</p>
          </div>
        )}
      </div>

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
          // biome-ignore lint/a11y/noAutofocus: 채팅 진입 시 즉시 입력 가능해야 함
          autoFocus
          className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30 resize-none outline-none leading-relaxed max-h-[120px]"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="chat-send-btn"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
}
