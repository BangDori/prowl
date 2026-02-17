/** AI 채팅 인터페이스 뷰 (로비/대화 내비게이션) */
import { useCallback, useState } from "react";
import { useCreateChatRoom } from "../hooks/useChatRooms";
import ChatConversation from "./chat/ChatConversation";
import ChatLobby from "./chat/ChatLobby";

export default function ChatView() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const createRoom = useCreateChatRoom();

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
    <div className="chat-floating-root">
      {selectedRoomId ? (
        <ChatConversation
          roomId={selectedRoomId}
          initialMessage={pendingMessage}
          onBack={handleBack}
          onNewChat={handleNewChat}
        />
      ) : (
        <ChatLobby onSelectRoom={setSelectedRoomId} onSendMessage={handleSendFromLobby} />
      )}
    </div>
  );
}
