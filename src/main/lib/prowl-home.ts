/** Prowl 데이터 홈 경로 해석 — E2E 격리 환경 지원 */

import { app } from "electron";

/**
 * Prowl 데이터가 저장될 홈 디렉터리 반환.
 * PROWL_DATA_HOME env가 설정되어 있으면 그 값을 사용한다.
 * macOS에서 app.getPath("home")은 NSHomeDirectory()를 사용하며 $HOME env를 무시하므로,
 * E2E 격리 환경에서는 이 env를 통해 별도 경로를 주입해야 한다.
 */
export function getDataHome(): string {
  return process.env.PROWL_DATA_HOME ?? app.getPath("home");
}
