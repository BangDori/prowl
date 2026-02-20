/** 스크립트 라이브러리 TanStack Query 훅 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryKeys } from "../queries/keys";

export function useScripts() {
  const qc = useQueryClient();

  // 채팅 AI가 변경 시 즉시 동기화 (sub-window가 열려있는 경우)
  useEffect(() => {
    return window.electronAPI.onScriptsChanged(() => {
      qc.invalidateQueries({ queryKey: queryKeys.scripts.all });
    });
  }, [qc]);

  // sub-window가 숨겨진 상태에서 변경된 경우 → 다시 열릴 때 동기화
  useEffect(() => {
    return window.electronAPI.onWindowShow(() => {
      qc.invalidateQueries({ queryKey: queryKeys.scripts.all });
    });
  }, [qc]);

  return useQuery({
    queryKey: queryKeys.scripts.list(),
    queryFn: () => window.electronAPI.listScripts(),
  });
}

export function useCreateScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prompt: string) => window.electronAPI.createScript(prompt),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.scripts.all }),
  });
}

export function useToggleScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => window.electronAPI.toggleScript(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.scripts.all }),
  });
}

export function useDeleteScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => window.electronAPI.deleteScript(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.scripts.all }),
  });
}

export function useRunScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => window.electronAPI.runScript(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.scripts.all }),
  });
}
