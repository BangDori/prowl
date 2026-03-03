/** Playwright E2E 설정 — Electron 앱 격리 환경 테스트 */
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/specs",
  // 각 테스트는 독립적으로 앱을 실행·종료 — 병렬 실행 불가
  workers: 1,
  // 재시도 없음 (앱 상태 격리가 어렵기 때문)
  retries: 0,
  timeout: 30_000,
  use: {
    // 스크린샷: 실패 시만 저장
    screenshot: "only-on-failure",
    // 타임스텝 3s (Electron 렌더 대기)
    actionTimeout: 8_000,
  },
  reporter: [["list"], ["html", { outputFolder: "e2e/report", open: "never" }]],
});
