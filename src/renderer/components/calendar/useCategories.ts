/** 동적 카테고리 관리 훅 — IPC + TanStack Query 기반 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryKeys } from "../queries/keys";
import {
  CATEGORIES_CHANGED_EVENT,
  setCategoryCache,
  type TaskCategoryItem,
} from "../utils/category-utils";

export type { TaskCategoryItem };

export function useCategories() {
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => window.electronAPI.listCategories(),
    staleTime: Number.POSITIVE_INFINITY,
  });

  // 쿼리 결과로 인메모리 캐시 동기화 (compact view 등 동기 접근용)
  useEffect(() => {
    if (categories.length > 0) setCategoryCache(categories);
  }, [categories]);

  // main 프로세스에서 categories:changed 이벤트 수신 시 캐시 무효화
  useEffect(() => {
    const unsubscribe = window.electronAPI.onCategoriesChanged(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list() });
    });
    return unsubscribe;
  }, [queryClient]);

  // 로컬 커스텀 이벤트도 처리 (같은 창에서 발생한 변경)
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list() });
    };
    window.addEventListener(CATEGORIES_CHANGED_EVENT, handler);
    return () => window.removeEventListener(CATEGORIES_CHANGED_EVENT, handler);
  }, [queryClient]);

  const addMutation = useMutation({
    mutationFn: (name: string) => window.electronAPI.addCategory(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.list() }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ oldName, newName }: { oldName: string; newName: string }) =>
      window.electronAPI.renameCategory(oldName, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => window.electronAPI.deleteCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });

  return {
    categories,
    addCategory: (name: string) => addMutation.mutate(name),
    renameCategory: (oldName: string, newName: string) =>
      renameMutation.mutate({ oldName, newName }),
    deleteCategory: (name: string) => deleteMutation.mutate(name),
    isAdding: addMutation.isPending,
    isRenaming: renameMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
