/** 채팅 / Chat Rooms IPC 핸들러 */
import { handleIpc } from "./ipc-utils";
import { resolveApproval } from "./services/approval";
import { getProviderStatuses, setPageContext, streamChatMessage } from "./services/chat";
import {
  getAllUnreadCounts,
  markRoomAsRead,
  removeRoomReadState,
  updateTrayBadge,
} from "./services/chat-read-state";
import {
  createChatRoom,
  deleteChatRoom,
  getChatRoom,
  listChatRooms,
  saveChatMessages,
  toggleChatRoomLock,
} from "./services/chat-rooms";
import {
  getChatConfig,
  getFavoritedRoomIds,
  setChatConfig,
  toggleFavoritedRoom,
} from "./services/settings";
import { closeChatWindow, resizeChatWindow, toggleExpandChatWindow } from "./windows";

export function registerChatHandlers(): void {
  // 채팅 메시지 스트리밍 전송 (fire-and-forget, main에서 저장)
  handleIpc("chat:send", async (roomId, content, history) => {
    const config = getChatConfig();
    streamChatMessage(roomId, content, history, config).catch((err) =>
      console.error("[IPC] chat:send stream error:", err),
    );
    return { success: true };
  });

  // 채팅 설정 조회
  handleIpc("chat:get-config", async () => {
    return getChatConfig();
  });

  // 채팅 설정 저장
  handleIpc("chat:set-config", async (config) => {
    try {
      setChatConfig(config);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 사용 가능한 프로바이더 목록 조회
  handleIpc("chat:providers", async () => {
    return getProviderStatuses();
  });

  // 채팅 윈도우 리사이즈
  handleIpc("chat:resize", async (height) => {
    resizeChatWindow(height);
  });

  // 채팅 윈도우 닫기
  handleIpc("chat:close", async () => {
    closeChatWindow();
  });

  // 채팅 윈도우 전체화면 토글 (isExpanded 반환)
  handleIpc("chat:expand-toggle", async () => {
    return toggleExpandChatWindow();
  });

  // 도구 실행 승인/거부
  handleIpc("chat:approve-tool", async (approvalId) => {
    const ok = resolveApproval(approvalId, true);
    return { success: ok };
  });

  handleIpc("chat:reject-tool", async (approvalId) => {
    const ok = resolveApproval(approvalId, false);
    return { success: ok };
  });

  // 페이지 컨텍스트 설정 (PreviewPanel webview 로드/언마운트 시)
  handleIpc("chat:set-page-context", async (context) => {
    try {
      setPageContext(context);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ── Chat Rooms ──────────────────────────────────────

  handleIpc("chat-rooms:list", async () => listChatRooms(getFavoritedRoomIds()));

  handleIpc("chat-rooms:get", async (roomId) => getChatRoom(roomId));

  handleIpc("chat-rooms:create", async (title) => createChatRoom(title));

  handleIpc("chat-rooms:delete", async (roomId) => {
    try {
      deleteChatRoom(roomId);
      removeRoomReadState(roomId);
      updateTrayBadge();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("chat-rooms:save-messages", async (roomId, messages) => {
    try {
      saveChatMessages(roomId, messages);
      updateTrayBadge();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("chat-rooms:mark-read", async (roomId, lastMessageId) => {
    try {
      markRoomAsRead(roomId, lastMessageId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("chat-rooms:unread-counts", async () => {
    return getAllUnreadCounts();
  });

  handleIpc("chat-rooms:toggle-lock", async (roomId) => {
    try {
      toggleChatRoomLock(roomId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  handleIpc("chat-rooms:toggle-favorite", async (roomId) => {
    try {
      toggleFavoritedRoom(roomId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
