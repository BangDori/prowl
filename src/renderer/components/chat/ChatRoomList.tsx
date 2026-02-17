/** 채팅 룸 목록 컴포넌트 */
import type { ChatRoomSummary } from "@shared/types";
import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useChatRooms, useDeleteChatRoom, useUpdateChatRoom } from "../../hooks/useChatRooms";

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
  const updateRoom = useUpdateChatRoom();
  const deleteRoom = useDeleteChatRoom();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = useCallback((room: ChatRoomSummary) => {
    setEditingId(room.id);
    setEditTitle(room.title);
    setTimeout(() => editInputRef.current?.focus(), 0);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingId && editTitle.trim()) {
      updateRoom.mutate({ roomId: editingId, title: editTitle.trim() });
    }
    setEditingId(null);
  }, [editingId, editTitle, updateRoom]);

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
          isEditing={editingId === room.id}
          editTitle={editTitle}
          editInputRef={editingId === room.id ? editInputRef : undefined}
          onSelect={() => onSelectRoom(room.id)}
          onStartEdit={() => handleStartEdit(room)}
          onEditChange={setEditTitle}
          onSaveEdit={handleSaveEdit}
          onDelete={() => handleDeleteRoom(room.id)}
        />
      ))}
    </div>
  );
}

/** 개별 룸 아이템 */
function RoomItem({
  room,
  isEditing,
  editTitle,
  editInputRef,
  onSelect,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onDelete,
}: {
  room: ChatRoomSummary;
  isEditing: boolean;
  editTitle: string;
  editInputRef?: React.RefObject<HTMLInputElement | null>;
  onSelect: () => void;
  onStartEdit: () => void;
  onEditChange: (value: string) => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="chat-room-item group">
      <button type="button" onClick={onSelect} className="flex-1 min-w-0 text-left">
        {isEditing ? (
          <input
            ref={editInputRef}
            value={editTitle}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onSaveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onSaveEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-white/10 text-[13px] text-white/90 px-2 py-0.5 rounded outline-none focus:ring-1 focus:ring-accent/50"
          />
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] text-white/90 truncate">{room.title}</span>
              <span className="text-[10px] text-white/30 flex-shrink-0">
                {formatRelativeTime(room.updatedAt)}
              </span>
            </div>
            {room.lastMessage && (
              <p className="text-[11px] text-white/40 truncate mt-0.5">{room.lastMessage}</p>
            )}
          </>
        )}
      </button>

      {!isEditing && (
        <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartEdit();
            }}
            className="p-1 rounded text-white/30 hover:text-white/60 transition-colors"
            title="이름 변경"
          >
            <Pencil className="w-3 h-3" />
          </button>
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
      )}
    </div>
  );
}
