/** 채팅 룸 목록 컴포넌트 */
import type { ChatRoomSummary } from "@shared/types";
import { Trash2 } from "lucide-react";
import { useCallback } from "react";
import { useChatRooms, useDeleteChatRoom } from "../../hooks/useChatRooms";

interface ChatRoomListProps {
  onSelectRoom: (roomId: string) => void;
}

/** 상대 시간 표시 (방금 전, N분 전, N시간 전, N일 전) */
function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(isoDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function ChatRoomList({ onSelectRoom }: ChatRoomListProps) {
  const { data: rooms = [], isLoading } = useChatRooms();
  const deleteRoom = useDeleteChatRoom();

  const handleDeleteRoom = useCallback(
    (roomId: string) => {
      deleteRoom.mutate(roomId);
    },
    [deleteRoom],
  );

  if (isLoading || rooms.length === 0) return null;

  return (
    <div className="overflow-y-auto max-h-[50%] min-h-0">
      {rooms.map((room) => (
        <RoomItem
          key={room.id}
          room={room}
          onSelect={() => onSelectRoom(room.id)}
          onDelete={() => handleDeleteRoom(room.id)}
        />
      ))}
    </div>
  );
}

/** 개별 룸 아이템 */
function RoomItem({
  room,
  onSelect,
  onDelete,
}: {
  room: ChatRoomSummary;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="chat-room-item group">
      <button type="button" onClick={onSelect} className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] text-white/90 truncate">{room.title}</span>
          <span className="text-[10px] text-white/30 flex-shrink-0">
            {formatRelativeTime(room.updatedAt)}
          </span>
        </div>
        {room.lastMessage && (
          <p className="text-[11px] text-white/40 truncate mt-0.5">{room.lastMessage}</p>
        )}
      </button>

      <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded text-white/30 hover:text-red-400 transition-colors"
          title="삭제"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
