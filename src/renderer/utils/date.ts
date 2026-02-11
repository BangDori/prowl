/** 상대 시간 및 날짜/시간 포맷 유틸 */
import { TIME } from "@shared/constants";

/**
 * 상대적 시간 포맷 (예: "5분 전", "3시간 전")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / TIME.MINUTE);
  const diffHours = Math.floor(diffMs / TIME.HOUR);
  const diffDays = Math.floor(diffMs / TIME.DAY);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return d.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

/**
 * 날짜/시간 포맷 (예: "1월 15일 14:30")
 */
export function formatDateTime(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
