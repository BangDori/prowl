/** 업데이트 체크 및 설치 관련 훅 */
import type { IpcResult } from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queries/keys";

const BREW_SYNC_DELAY_MS = 60 * 60 * 1000; // 1시간

/**
 * 릴리즈 후 Homebrew formula 동기화 완료까지 1시간 대기
 *
 * GitHub Release 직후 Homebrew tap formula가 아직 구 버전일 수 있으므로
 * published_at 기준 1시간이 지난 경우에만 brew upgrade를 허용한다.
 */
export function isBrewSyncReady(publishedAt: string | undefined): boolean {
  if (!publishedAt) return false;
  return Date.now() - new Date(publishedAt).getTime() >= BREW_SYNC_DELAY_MS;
}

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
