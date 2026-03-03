/** Playwright로 Prowl Electron 앱을 격리 환경에서 실행하는 헬퍼 */

import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { _electron as electron } from "playwright";
import type { ElectronApplication, Page } from "playwright";

const projectRoot = join(__dirname, "..");
const distMain = join(projectRoot, "dist", "main", "index.js");

export interface TestEnv {
  app: ElectronApplication;
  page: Page;
  cleanup: () => Promise<void>;
}

/** 격리된 임시 디렉터리에서 앱 실행 후 TestEnv 반환 */
export async function launchApp(): Promise<TestEnv> {
  // /tmp/prowl-test-XXXX/ 임시 디렉터리 생성
  const tmpBase = mkdtempSync(join(tmpdir(), "prowl-test-"));
  const userDataDir = join(tmpBase, "userData");
  const homeDir = join(tmpBase, "home");
  mkdirSync(userDataDir, { recursive: true });
  mkdirSync(homeDir, { recursive: true });

  const app = await electron.launch({
    args: [distMain],
    cwd: projectRoot,
    env: {
      ...process.env,
      E2E_TEST: "true",
      PROWL_DATA_HOME: homeDir,
      ELECTRON_ENABLE_LOGGING: "1",
    },
    // Electron user data (SQLite, SingleInstanceLock) 격리
    executablePath: undefined,
  });

  // userData 경로 주입: --user-data-dir 대신 launch 후 실제 경로를 넘긴다
  // Playwright ElectronApplication은 args를 통해 --user-data-dir 전달 가능
  // → 재시작 없이 격리하려면 launchOptions.args에 포함해야 함
  // 이 버전에서는 userData dir을 별도로 전달하지 않고 E2E_TEST + PROWL_DATA_HOME만으로 격리한다.

  const page = await app.firstWindow();
  await page.waitForLoadState("domcontentloaded");

  const cleanup = async () => {
    await app.close().catch(() => {});
    rmSync(tmpBase, { recursive: true, force: true });
  };

  return { app, page, cleanup };
}
