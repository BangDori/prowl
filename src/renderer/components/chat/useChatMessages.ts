/** 채팅 메시지 상태 관리 훅 — 스트림 이벤트, 메시지 전송, 설정 로드 */
import type { ChatConfig, ChatMessage, ProviderStatus } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useChatRoom,
  useChatUnreadCounts,
  useMarkChatRoomRead,
  useSaveChatMessages,
} from "../../hooks/useChatRooms";
import { queryKeys } from "../../queries/keys";

export function useChatMessages(roomId: string, initialMessage?: string | null) {
  const queryClient = useQueryClient();
  const { data: roomData } = useChatRoom(roomId);
  const { data: unreadCounts } = useChatUnreadCounts();
  const saveMessages = useSaveChatMessages();
  const markRead = useMarkChatRoomRead();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatConfig, setChatConfig] = useState<ChatConfig | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [initialized, setInitialized] = useState(false);

  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;
  const initialMessageProcessed = useRef(false);
  const unreadDividerMsgId = useRef<string | null>(null);
  const hasMarkedRead = useRef(false);
  const hasInitialScrolled = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  const loadChatMeta = useCallback(() => {
    Promise.all([window.electronAPI.getChatConfig(), window.electronAPI.getChatProviders()]).then(
      ([config, providerList]) => {
        setChatConfig(config);
        setProviders(providerList);
      },
    );
  }, []);

  useEffect(() => {
    loadChatMeta();
  }, [loadChatMeta]);

  // settings 변경 시 (API 키 저장 등) providers 즉시 갱신
  useEffect(() => {
    return window.electronAPI.onSettingsChanged(loadChatMeta);
  }, [loadChatMeta]);

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
    const behavior = hasInitialScrolled.current ? "smooth" : "instant";
    hasInitialScrolled.current = true;
    scrollToBottom(behavior);
  }, [messages, scrollToBottom]);

  // 스트림 이벤트 리스너
  useEffect(() => {
    const offMessage = window.electronAPI.onChatStreamMessage((streamRoomId, msg) => {
      if (streamRoomId !== roomId) return;
      setMessages((prev) => [...prev, msg]);
    });
    const offDone = window.electronAPI.onChatStreamDone((streamRoomId) => {
      if (streamRoomId !== roomId) return;
      setLoading(false);
      const lastMsg = messagesRef.current.at(-1);
      if (lastMsg) markRead.mutate({ roomId, lastMessageId: lastMsg.id });
      queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms.all });
    });
    const offError = window.electronAPI.onChatStreamError((streamRoomId, error) => {
      if (streamRoomId !== roomId) return;
      setLoading(false);
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: error || "오류가 발생했습니다.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
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

  /** 메시지 전송 핵심 로직 */
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

      saveMessages.mutate({ roomId, messages: updated });
      markRead.mutate({ roomId, lastMessageId: userMsg.id });

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
    },
    [roomId, saveMessages, markRead],
  );

  // 초기 메시지 자동 전송
  useEffect(() => {
    if (initialMessage && initialized && !initialMessageProcessed.current) {
      initialMessageProcessed.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage, initialized, sendMessage]);

  return {
    messages,
    loading,
    sendMessage,
    messagesEndRef,
    unreadDividerMsgId,
    chatConfig,
    providers,
    handleConfigChange,
    roomTitle: roomData?.title,
    initialized,
  };
}
