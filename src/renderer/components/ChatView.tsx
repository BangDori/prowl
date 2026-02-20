/** AI 채팅 인터페이스 뷰 (로비/대화 내비게이션) */
import { useCallback, useEffect, useState } from "react";
import { useCreateChatRoom } from "../hooks/useChatRooms";
import ChatConversation from "./chat/ChatConversation";
import ChatLobby from "./chat/ChatLobby";

export default function ChatView() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const createRoom = useCreateChatRoom();

  const handleToggleExpand = useCallback(async () => {
    const expanded = await window.electronAPI.toggleChatExpand();
    setIsExpanded(expanded);
  }, []);

  // Cmd+Enter: 전체화면 토글
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleToggleExpand();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleExpand]);

  // 알림 클릭 딥링크: 특정 채팅방으로 이동
  useEffect(() => {
    return window.electronAPI.onChatNavigateToRoom((roomId) => {
      setPendingMessage(null);
      setSelectedRoomId(roomId);
    });
  }, []);

  // 창을 닫고 다시 열 때 main이 expand를 리셋하면 renderer state도 동기화
  useEffect(() => {
    return window.electronAPI.onChatExpandReset(() => {
      setIsExpanded(false);
    });
  }, []);

  /** 로비에서 메시지 전송 시: 룸 생성 → 대화 진입 (초기 메시지 전달) */
  const handleSendFromLobby = useCallback(
    async (content: string) => {
      const room = await createRoom.mutateAsync();
      setPendingMessage(content);
      setSelectedRoomId(room.id);
    },
    [createRoom],
  );

  /** 새 대화 생성 (대화 중 + 버튼) */
  const handleNewChat = useCallback(async () => {
    const room = await createRoom.mutateAsync();
    setPendingMessage(null);
    setSelectedRoomId(room.id);
  }, [createRoom]);

  /** 대화에서 목록으로 돌아가기 */
  const handleBack = useCallback(() => {
    setSelectedRoomId(null);
    setPendingMessage(null);
  }, []);

  return (
    <div className={`chat-floating-root${isExpanded ? " expanded" : ""}`}>
      {selectedRoomId ? (
        <ChatConversation
          roomId={selectedRoomId}
          initialMessage={pendingMessage}
          onBack={handleBack}
          onNewChat={handleNewChat}
          isExpanded={isExpanded}
          onToggleExpand={handleToggleExpand}
        />
      ) : (
        <ChatLobby
          onSelectRoom={setSelectedRoomId}
          onSendMessage={handleSendFromLobby}
          isExpanded={isExpanded}
          onToggleExpand={handleToggleExpand}
        />
      )}
    </div>
  );
}
