/** 카테고리 관리 유틸 — IPC 기반 (인메모리 캐시 + 변경 이벤트) */

import type { TaskCategoryItem } from "@shared/types";

export type { TaskCategoryItem };

/** 카테고리 변경을 모든 useCategories 인스턴스에 알리는 이벤트 */
export const CATEGORIES_CHANGED_EVENT = "prowl:categories-changed";

/** 신규 카테고리 색상 팔레트 */
const COLOR_PALETTE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];

const DEFAULT_CATEGORIES: TaskCategoryItem[] = [{ name: "기타", color: "#6b7280" }];

/** 인메모리 캐시 (IPC로 초기화, 변경 이벤트로 갱신) */
let _cache: TaskCategoryItem[] = DEFAULT_CATEGORIES;

/** 캐시 직접 설정 (useCategories에서 쿼리 결과 수신 시 사용) */
export function setCategoryCache(cats: TaskCategoryItem[]): void {
  _cache = cats.length > 0 ? cats : DEFAULT_CATEGORIES;
}

/** 카테고리 이름으로 색상 조회 (없으면 기본 회색) */
export function getCategoryColor(name: string): string {
  return _cache.find((c) => c.name === name)?.color ?? "#6b7280";
}

/** 카테고리 이름 목록 반환 (정렬 순서 유지) */
export function getCategoryNames(): string[] {
  return _cache.map((c) => c.name);
}

/** 신규 카테고리에 배정할 다음 색상 */
export function getNextCategoryColor(currentCount: number): string {
  return COLOR_PALETTE[(currentCount - 1) % COLOR_PALETTE.length];
}
