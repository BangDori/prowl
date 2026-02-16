/** Task 캘린더 타입 (파일 기반 태스크 관리) */

/** 태스크 우선순위 */
export type TaskPriority = "high" | "medium" | "low";

/** 우선순위별 색상 */
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#3b82f6",
} as const;

/** 우선순위별 라벨 */
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
} as const;

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

/** 태스크 데이터 모델 (JSON 파일에 저장) */
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueTime?: string; // "HH:MM" (없으면 종일)
  priority: TaskPriority;
  category?: string;
  completed: boolean;
  completedAt?: string; // ISO 8601
  createdAt: string; // ISO 8601
  reminders?: TaskReminder[];
}

/** 날짜별 태스크 맵 (month 단위 조회 결과) */
export type TasksByDate = Record<string, Task[]>;

/** 태스크 폴더 기본 경로 */
export const TASK_FOLDER_NAME = "prowl-task-calendar";
