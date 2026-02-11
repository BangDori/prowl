/** TanStack Query 클라이언트 인스턴스 설정 */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false, // Electron: 수동 invalidate 사용
    },
  },
});
