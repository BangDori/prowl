/** 집중 모드 조회 및 업데이트 훅 */
import type { FocusMode } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queries/keys";

export function useFocusMode() {
  return useQuery({
    queryKey: queryKeys.focusMode.get(),
    queryFn: () => window.electronAPI.getFocusMode(),
  });
}

export function useUpdateFocusMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (focusMode: FocusMode) => window.electronAPI.setFocusMode(focusMode),
    onMutate: async (newFocusMode) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.focusMode.get() });
      const previous = queryClient.getQueryData<FocusMode>(queryKeys.focusMode.get());
      queryClient.setQueryData(queryKeys.focusMode.get(), newFocusMode);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.focusMode.get(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.focusMode.all });
    },
  });
}
