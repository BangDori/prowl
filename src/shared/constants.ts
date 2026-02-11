/** Main/Renderer 공용 시간·폴링·UI 상수 */
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

// Job 완료 감지 폴링 설정
export const JOB_COMPLETION = {
  POLL_INTERVAL_MS: 1000, // 1초마다 확인
  TIMEOUT_MS: 60000, // 60초 타임아웃
} as const;
