/** Main 프로세스 UI·윈도우 상수 정의 */

// ============================================
// 시간 상수 (shared에서 re-export)
// ============================================
export { TIME } from "@shared/constants";

// ============================================
// 윈도우 설정
// ============================================
export const WINDOW = {
  WIDTH: 400,
  HEIGHT: 500,
  MAX_HEIGHT: 600,
} as const;

export const DEV_SERVER_PORT = 5173;

// ============================================
// 채팅 윈도우 설정
// ============================================
export const CHAT_WINDOW = {
  WIDTH: 680,
  INPUT_HEIGHT: 72,
  EXPANDED_HEIGHT: 520,
  BOTTOM_MARGIN: 160,
} as const;

// ============================================
// 스플래시 윈도우 설정
// ============================================
export const SPLASH = {
  WIDTH: 700,
  HEIGHT: 550,
  DISPLAY_DURATION_MS: 4500,
  ABSORB_DURATION_MS: 600,
  DISSOLVE_DURATION_MS: 1200,
} as const;

// ============================================
// 대시보드 윈도우 설정
// ============================================
export const DASHBOARD = {
  WIDTH: 900,
  HEIGHT: 600,
  MIN_WIDTH: 700,
  MIN_HEIGHT: 400,
} as const;

// ============================================
// Task Manager 윈도우 설정
// ============================================
export const COMPACT = {
  WIDTH: 280,
  HEIGHT: 400,
  HEADER_HEIGHT: 28,
  MARGIN: 16,
} as const;
