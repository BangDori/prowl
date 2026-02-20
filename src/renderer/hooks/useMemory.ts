/** Memory CRUD 훅 (TanStack Query) */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryKeys } from "../queries/keys";

/** 전체 메모리 조회 */
export function useMemories() {
  const qc = useQueryClient();

  useEffect(() => {
    return window.electronAPI.onMemoryChanged(() => {
      qc.invalidateQueries({ queryKey: queryKeys.memory.all });
    });
  }, [qc]);

  useEffect(() => {
    return window.electronAPI.onWindowShow(() => {
      qc.invalidateQueries({ queryKey: queryKeys.memory.all });
    });
  }, [qc]);

  return useQuery({
    queryKey: queryKeys.memory.list(),
    queryFn: () => window.electronAPI.listMemories(),
  });
}

/** 메모리 추가 */
export function useAddMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => window.electronAPI.addMemory(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memory.all });
    },
  });
}

/** 메모리 수정 */
export function useUpdateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      window.electronAPI.updateMemory(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memory.all });
    },
  });
}

/** 메모리 삭제 */
export function useDeleteMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => window.electronAPI.deleteMemory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memory.all });
    },
  });
}
