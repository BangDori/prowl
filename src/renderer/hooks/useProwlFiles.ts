/** ~/.prowl/ 파일 탐색 및 편집 TanStack Query 훅 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queries/keys";

/** 디렉터리 목록 조회 */
export function useProwlDir(relPath?: string) {
  return useQuery({
    queryKey: queryKeys.prowlFiles.list(relPath),
    queryFn: () => window.electronAPI.listProwlFiles(relPath),
  });
}

/** 파일 내용 읽기 */
export function useProwlFile(relPath: string | null) {
  return useQuery({
    queryKey: queryKeys.prowlFiles.read(relPath ?? ""),
    // biome-ignore lint/style/noNonNullAssertion: enabled: relPath !== null 으로 보장됨
    queryFn: () => window.electronAPI.readProwlFile(relPath!),
    enabled: relPath !== null,
  });
}

/** 파일 내용 쓰기 */
export function useWriteProwlFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ relPath, content }: { relPath: string; content: string }) =>
      window.electronAPI.writeProwlFile(relPath, content),
    onSuccess: (_result, { relPath }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prowlFiles.read(relPath) });
      // 부모 디렉터리 목록도 갱신
      const parentPath = relPath.includes("/") ? relPath.split("/").slice(0, -1).join("/") : "";
      queryClient.invalidateQueries({ queryKey: queryKeys.prowlFiles.list(parentPath) });
    },
  });
}
