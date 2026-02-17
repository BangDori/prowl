/** 날짜 범위 기반 다가오는 태스크 조회 훅 */
import type { TasksByDate, UpcomingRange } from "@shared/types";
import { UPCOMING_RANGE_DAYS } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queries/keys";
import { toDateStr } from "../utils/calendar";

export function useUpcomingTasks(range: UpcomingRange) {
  const queryClient = useQueryClient();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startDate = toDateStr(tomorrow);

  const endDateObj = new Date(today);
  endDateObj.setDate(endDateObj.getDate() + UPCOMING_RANGE_DAYS[range]);
  const endDate = toDateStr(endDateObj);

  const { data: tasksByDate = {} as TasksByDate, isFetching: refreshing } = useQuery({
    queryKey: queryKeys.tasks.dateRange(startDate, endDate),
    queryFn: () => window.electronAPI.listTasksByDateRange(startDate, endDate),
  });

  const invalidateAll = () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ date, taskId }: { date: string; taskId: string }) =>
      window.electronAPI.toggleTaskComplete(date, taskId),
    onSettled: invalidateAll,
  });

  return {
    tasksByDate,
    refreshing,
    toggleComplete: (date: string, taskId: string) =>
      toggleCompleteMutation.mutate({ date, taskId }),
  };
}
