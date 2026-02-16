/** 백로그 태스크 조회 및 mutation 훅 */
import type { Task } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queries/keys";

export function useBacklogData() {
  const queryClient = useQueryClient();

  const {
    data: backlogTasks = [] as Task[],
    isLoading,
    error,
    isFetching: refreshing,
  } = useQuery({
    queryKey: queryKeys.tasks.backlog(),
    queryFn: () => window.electronAPI.listBacklogTasks(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.backlog() });

  const toggleCompleteMutation = useMutation({
    mutationFn: (taskId: string) => window.electronAPI.toggleBacklogComplete(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.backlog() });
      const prev = queryClient.getQueryData<Task[]>(queryKeys.tasks.backlog());
      queryClient.setQueryData<Task[]>(queryKeys.tasks.backlog(), (old = []) =>
        old.map((t) =>
          t.id === taskId
            ? {
                ...t,
                completed: !t.completed,
                completedAt: t.completed ? undefined : new Date().toISOString(),
              }
            : t,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.tasks.backlog(), ctx.prev);
    },
    onSettled: invalidate,
  });

  return {
    backlogTasks,
    isLoading,
    error: error ? "백로그 태스크를 불러올 수 없습니다." : null,
    refreshing,
    toggleComplete: (taskId: string) => toggleCompleteMutation.mutate(taskId),
    refetch: invalidate,
  };
}
