/** 어젠다 뷰용: 오늘부터 1년치 태스크 날짜 범위 조회 */
import type { TasksByDate } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queries/keys";
import { toDateStr } from "../utils/calendar";

export function useAgendaTasks(): TasksByDate {
  const today = new Date();
  const farFuture = new Date(today);
  farFuture.setFullYear(farFuture.getFullYear() + 1);

  const startDate = toDateStr(today);
  const endDate = toDateStr(farFuture);

  const { data = {} as TasksByDate } = useQuery({
    queryKey: queryKeys.tasks.dateRange(startDate, endDate),
    queryFn: () => window.electronAPI.listTasksByDateRange(startDate, endDate),
  });

  return data;
}
