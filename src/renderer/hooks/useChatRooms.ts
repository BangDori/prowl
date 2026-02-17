/** ChatRoom CRUD 훅 (TanStack Query) */
import type { ChatMessage } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queries/keys";

/** 채팅 룸 목록 조회 */
export function useChatRooms() {
  return useQuery({
    queryKey: queryKeys.chatRooms.list(),
    queryFn: () => window.electronAPI.listChatRooms(),
  });
}

/** 특정 채팅 룸 조회 (메시지 포함) */
export function useChatRoom(roomId: string | null) {
  return useQuery({
    queryKey: queryKeys.chatRooms.detail(roomId ?? ""),
    queryFn: () => window.electronAPI.getChatRoom(roomId as string),
    enabled: !!roomId,
  });
}

/** 채팅 룸 생성 */
export function useCreateChatRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => window.electronAPI.createChatRoom(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms.all });
    },
  });
}

/** 채팅 룸 이름 변경 */
export function useUpdateChatRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, title }: { roomId: string; title: string }) =>
      window.electronAPI.updateChatRoom(roomId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms.all });
    },
  });
}

/** 채팅 룸 삭제 */
export function useDeleteChatRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => window.electronAPI.deleteChatRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms.all });
    },
  });
}

/** 메시지 저장 */
export function useSaveChatMessages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, messages }: { roomId: string; messages: ChatMessage[] }) =>
      window.electronAPI.saveChatMessages(roomId, messages),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatRooms.detail(variables.roomId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms.list() });
    },
  });
}
