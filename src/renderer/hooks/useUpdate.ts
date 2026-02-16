/** 업데이트 체크 및 설치 관련 훅 */
import type { IpcResult } from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queries/keys";

/** 업데이트 확인 (5분 캐시) */
export function useUpdateCheck() {
  return useQuery({
    queryKey: queryKeys.app.update(),
    queryFn: () => window.electronAPI.checkForUpdates(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/** brew upgrade 실행 */
export function useInstallUpdate() {
  return useMutation({
    mutationFn: (): Promise<IpcResult> => window.electronAPI.installUpdate(),
  });
}

/** 앱 재시작 */
export function useRelaunchApp() {
  return {
    relaunch: () => window.electronAPI.relaunchApp(),
  };
}
