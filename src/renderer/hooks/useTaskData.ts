/** 파일 기반 태스크 조회 및 mutation 훅 */
import type { Task, TasksByDate } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryKeys } from "../queries/keys";

export function useTaskData(year: number, month: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    return window.electronAPI.onTasksChanged(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    });
  }, [queryClient]);

  const {
    data: tasksByDate = {} as TasksByDate,
    isLoading,
    error,
    isFetching: refreshing,
  } = useQuery({
    queryKey: queryKeys.tasks.month(year, month),
    queryFn: () => window.electronAPI.listTasksByMonth(year, month),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.month(year, month) });

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ date, taskId }: { date: string; taskId: string }) =>
      window.electronAPI.toggleTaskComplete(date, taskId),
    onMutate: async ({ date, taskId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.month(year, month) });
      const prev = queryClient.getQueryData<TasksByDate>(queryKeys.tasks.month(year, month));
      queryClient.setQueryData<TasksByDate>(queryKeys.tasks.month(year, month), (old = {}) => {
        const tasks = old[date] ?? [];
        return {
          ...old,
          [date]: tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: t.completed ? undefined : new Date().toISOString(),
                }
              : t,
          ),
        };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.tasks.month(year, month), ctx.prev);
    },
    onSettled: invalidate,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ date, task }: { date: string; task: Task }) =>
      window.electronAPI.updateTask(date, task),
    onSettled: invalidate,
  });

  const deleteTaskMutation = useMutation({
    mutationFn: ({ date, taskId }: { date: string; taskId: string }) =>
      window.electronAPI.deleteTask(date, taskId),
    onMutate: async ({ date, taskId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.month(year, month) });
      const prev = queryClient.getQueryData<TasksByDate>(queryKeys.tasks.month(year, month));
      queryClient.setQueryData<TasksByDate>(queryKeys.tasks.month(year, month), (old = {}) => {
        const tasks = (old[date] ?? []).filter((t) => t.id !== taskId);
        const next = { ...old };
        if (tasks.length > 0) next[date] = tasks;
        else delete next[date];
        return next;
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.tasks.month(year, month), ctx.prev);
    },
    onSettled: invalidate,
  });

  return {
    tasksByDate,
    isLoading,
    error: error ? "태스크를 불러올 수 없습니다." : null,
    refreshing,
    toggleComplete: (date: string, taskId: string) =>
      toggleCompleteMutation.mutate({ date, taskId }),
    updateTask: (date: string, task: Task) => updateTaskMutation.mutate({ date, task }),
    deleteTask: (date: string, taskId: string) => deleteTaskMutation.mutate({ date, taskId }),
    refetch: invalidate,
  };
}
