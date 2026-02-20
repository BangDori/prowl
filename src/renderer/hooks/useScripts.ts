/** 스크립트 라이브러리 TanStack Query 훅 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queries/keys";

export function useScripts() {
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
