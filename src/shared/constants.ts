// ============================================
// 시간 상수 (밀리초) - main과 renderer 모두 사용
// ============================================
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

export const JOB_POLLING_INTERVAL_MS = 30000;
