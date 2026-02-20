/** 채팅 룸 목록 컴포넌트 */
import type { ChatRoomSummary } from "@shared/types";
import { Lock, Trash2, Unlock } from "lucide-react";
import { useCallback } from "react";
import {
  useChatRooms,
  useChatUnreadCounts,
  useDeleteChatRoom,
  useToggleChatRoomLock,
} from "../../hooks/useChatRooms";

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
  const { data: unreadCounts = {} } = useChatUnreadCounts();
  const deleteRoom = useDeleteChatRoom();
  const toggleLock = useToggleChatRoomLock();

  const handleDeleteRoom = useCallback(
    (roomId: string) => {
      deleteRoom.mutate(roomId);
    },
    [deleteRoom],
  );

  const handleToggleLock = useCallback(
    (roomId: string) => {
      toggleLock.mutate(roomId);
    },
    [toggleLock],
  );

  if (isLoading || rooms.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      {rooms.map((room) => (
        <RoomItem
          key={room.id}
          room={room}
          unreadCount={unreadCounts[room.id] ?? 0}
          onSelect={() => onSelectRoom(room.id)}
          onDelete={() => handleDeleteRoom(room.id)}
          onToggleLock={() => handleToggleLock(room.id)}
        />
      ))}
    </div>
  );
}

/** 개별 룸 아이템 */
function RoomItem({
  room,
  unreadCount,
  onSelect,
  onDelete,
  onToggleLock,
}: {
  room: ChatRoomSummary;
  unreadCount: number;
  onSelect: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
}) {
  return (
    <div className="chat-room-item group">
      <button type="button" onClick={onSelect} className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            {room.locked && <Lock className="w-2.5 h-2.5 text-white/40 flex-shrink-0" />}
            <span className="text-[13px] text-white/90 truncate">{room.title}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-black text-[10px] font-semibold flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            <span className="text-[10px] text-white/30">{formatRelativeTime(room.updatedAt)}</span>
          </div>
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
            onToggleLock();
          }}
          className="p-1 rounded text-white/30 hover:text-white/70 transition-colors"
          title={room.locked ? "잠금 해제" : "삭제 잠금"}
        >
          {room.locked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={room.locked}
          className="p-1 rounded text-white/30 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-white/30"
          title={room.locked ? "잠금 해제 후 삭제 가능" : "삭제"}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
