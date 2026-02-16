/** 캘린더 날짜 계산 유틸 */

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export const CALENDAR_GRID_SIZE = 42; // 6주 × 7일

/** 날짜를 "YYYY-MM-DD" 형식으로 포맷 */
export function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** 시간을 "14:30" 형식으로 포맷 */
export function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** 날짜를 "2월 24일 (화)" 형식으로 포맷 */
export function formatDateKr(date: Date | string): string {
  const d = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

/** 두 날짜가 같은 날인지 확인 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 오늘인지 확인 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** 해당 월의 캘린더 그리드 날짜 생성 (일요일 시작) */
export function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const days: Date[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  const remaining = CALENDAR_GRID_SIZE - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push(new Date(year, month + 1, d));
  }

  return days;
}

/**
 * 시간 문자열 자동 파싱: "1900" → "19:00", "930" → "09:30", "9" → "09:00"
 * 유효하지 않으면 null 반환
 */
export function parseTimeInput(raw: string): string | null {
  const trimmed = raw.trim().replace(/[：;]/g, ":");

  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    const h = Number(colonMatch[1]);
    const m = Number(colonMatch[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    return null;
  }

  const digitMatch = trimmed.match(/^(\d{1,4})$/);
  if (digitMatch) {
    const num = digitMatch[1];
    let h: number;
    let m: number;

    if (num.length <= 2) {
      h = Number(num);
      m = 0;
    } else if (num.length === 3) {
      h = Number(num[0]);
      m = Number(num.substring(1));
    } else {
      h = Number(num.substring(0, 2));
      m = Number(num.substring(2));
    }

    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    return null;
  }

  return null;
}

/** 고유 ID 생성 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}
