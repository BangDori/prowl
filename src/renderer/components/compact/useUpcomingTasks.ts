/** 날짜 범위 기반 다가오는 태스크 조회 훅 */

import { queryKeys } from "@renderer/queries/keys";
import { toDateStr } from "@renderer/utils/calendar";
import type { Task, TasksByDate, UpcomingRange } from "@shared/types";
import { UPCOMING_RANGE_DAYS } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

  const deleteTaskMutation = useMutation({
    mutationFn: ({ date, taskId }: { date: string; taskId: string }) =>
      window.electronAPI.deleteTask(date, taskId),
    onSettled: invalidateAll,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ date, task }: { date: string; task: Task }) =>
      window.electronAPI.updateTask(date, task),
    onSettled: invalidateAll,
  });

  return {
    tasksByDate,
    refreshing,
    toggleComplete: (date: string, taskId: string) =>
      toggleCompleteMutation.mutate({ date, taskId }),
    deleteTask: (date: string, taskId: string) => deleteTaskMutation.mutate({ date, taskId }),
    updateTask: (date: string, task: Task) => updateTaskMutation.mutate({ date, task }),
  };
}
