import { homedir } from "os";
import path from "path";

// ============================================
// 경로 상수
// ============================================
export const LAUNCH_AGENTS_DIR = path.join(homedir(), "Library", "LaunchAgents");

// ============================================
// 요일 이름
// ============================================
export const WEEKDAY_NAMES: Record<number, string> = {
  0: "일",
  1: "월",
  2: "화",
  3: "수",
  4: "목",
  5: "금",
  6: "토",
};

// ============================================
// 로그 관련 상수
// ============================================
export const LOG_LINES_DEFAULT = 50;
export const LOG_ANALYSIS_LINES = 20;
export const LOG_ERROR_SEARCH_LINES = 10;
export const LOG_MESSAGE_MAX_LENGTH = 100;

export const LOG_PATTERNS = {
  success: ["완료", "complete", "success", "finished", "리포트 완료", "slack 전송 완료"],
  failure: ["error", "failed", "exception", "실패", "unable to"],
} as const;

// ============================================
// 시간 상수 (shared에서 re-export)
// ============================================
export { JOB_POLLING_INTERVAL_MS, TIME } from "../shared/constants";

// ============================================
// 윈도우 설정
// ============================================
export const WINDOW = {
  WIDTH: 400,
  HEIGHT: 500,
  MAX_HEIGHT: 600,
} as const;

export const DEV_SERVER_PORT = 5173;
