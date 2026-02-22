/** Task 캘린더 타입 (파일 기반 태스크 관리) */

/** 알림 프리셋 */
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

/** 태스크 알림 */
export interface TaskReminder {
  minutes: number;
}

/** 기본 알림: 1일 전 */
export const DEFAULT_REMINDERS: TaskReminder[] = [{ minutes: 1440 }];

/** 태스크 데이터 모델 (JSON 파일에 저장) */
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueTime?: string; // "HH:MM" (없으면 종일)
  category?: string; // 사전 정의 카테고리 또는 커스텀 문자열
  completed: boolean;
  completedAt?: string; // ISO 8601
  createdAt: string; // ISO 8601
  reminders?: TaskReminder[];
  roomId?: string; // 연결된 채팅방 ID (알림 클릭 시 딥링크)
}

/** 날짜별 태스크 맵 (month 단위 조회 결과) */
export type TasksByDate = Record<string, Task[]>;

/** 다가오는 일정 범위 프리셋 */
export type UpcomingRange = "1w" | "2w" | "1m" | "1y";

/** 범위별 일수 매핑 */
export const UPCOMING_RANGE_DAYS: Record<UpcomingRange, number> = {
  "1w": 7,
  "2w": 14,
  "1m": 30,
  "1y": 365,
} as const;

/** 범위별 라벨 */
export const UPCOMING_RANGE_LABELS: Record<UpcomingRange, string> = {
  "1w": "1주",
  "2w": "2주",
  "1m": "1개월",
  "1y": "1년",
} as const;

/** 태스크 카테고리 항목 (파일 기반, 이름이 식별자) */
export interface TaskCategoryItem {
  name: string;
  color: string;
}

/** Prowl 데이터 루트 디렉터리 (~/.prowl) */
export const PROWL_DATA_DIR = ".prowl";

/** 태스크 서브폴더 (~/.prowl/task-calendar) */
export const TASK_SUBFOLDER = "task-calendar";

/** 채팅 룸 서브폴더 (~/.prowl/chat-rooms) */
export const CHAT_ROOMS_SUBFOLDER = "chat-rooms";

/** 채팅 읽음 상태 파일 (~/.prowl/chat-read-state.json) */
export const CHAT_READ_STATE_FILE = "chat-read-state.json";

/** @deprecated 마이그레이션용 — 기존 태스크 폴더명 */
export const LEGACY_TASK_FOLDER = "prowl-task-calendar";
