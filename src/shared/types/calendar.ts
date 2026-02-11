import type { EventReminder } from "./common";

// 캘린더 이벤트
export interface CalendarEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart: string; // ISO 8601
  dtend: string; // ISO 8601
  allDay: boolean;
  feedId: string; // 어떤 피드에서 온 이벤트인지
}

// ICS 피드
export interface IcsFeed {
  id: string; // 고유 ID
  label: string; // "회사", "개인" 등
  url: string; // ICS URL
  color: string; // 피드 색상 (hex)
  filterKeyword?: string; // 포함 키워드 필터 (설정 시 키워드가 포함된 이벤트만 표시)
}

// 피드 색상 프리셋
export const FEED_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#ef4444", // red
  "#a855f7", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
] as const;

// 알림 프리셋 옵션
export const REMINDER_PRESETS: { label: string; minutes: number }[] = [
  { label: "정각", minutes: 0 },
  { label: "5분 전", minutes: 5 },
  { label: "10분 전", minutes: 10 },
  { label: "30분 전", minutes: 30 },
  { label: "1시간 전", minutes: 60 },
  { label: "2시간 전", minutes: 120 },
  { label: "1일 전", minutes: 1440 },
  { label: "2일 전", minutes: 2880 },
  { label: "3일 전", minutes: 4320 },
  { label: "1주 전", minutes: 10080 },
];

// 로컬 이벤트 (사용자가 직접 추가)
export interface LocalEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart: string; // ISO 문자열 (저장용)
  dtend: string;
  allDay: boolean;
  reminders?: EventReminder[]; // 알림 목록
}

// 로컬 이벤트 전용 feedId 및 색상
export const LOCAL_FEED_ID = "__local__";
export const LOCAL_EVENT_COLOR = "#f59e0b"; // accent gold

// 캘린더 설정
export interface CalendarSettings {
  feeds: IcsFeed[];
}

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  feeds: [],
};
