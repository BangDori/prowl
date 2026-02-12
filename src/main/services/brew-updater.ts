/** Homebrew Cask 기반 앱 업데이트 실행 */
import { execFile, execFileSync } from "node:child_process";
import type { BrewInstallStatus, IpcResult } from "@shared/types";

const BREW_PATHS = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"];
const CASK_NAME = "prowl";

let resolvedBrewPath: string | null = null;

/**
 * brew 실행 파일 경로를 찾아 캐싱
 *
 * ARM Mac: /opt/homebrew/bin/brew
 * Intel Mac: /usr/local/bin/brew
 * Fallback: which brew
 */
function findBrewPath(): string | null {
  if (resolvedBrewPath) return resolvedBrewPath;

  for (const p of BREW_PATHS) {
    try {
      execFileSync(p, ["--version"], { encoding: "utf-8", timeout: 5000 });
      resolvedBrewPath = p;
      return p;
    } catch {
      /* not found at this path */
    }
  }

  try {
    const result = execFileSync("which", ["brew"], { encoding: "utf-8", timeout: 5000 });
    const path = result.trim();
    if (path) {
      resolvedBrewPath = path;
      return path;
    }
  } catch {
    /* brew not found */
  }

  return null;
}

/**
 * Homebrew 설치 상태 확인
 *
 * brew 존재 여부 + prowl이 brew cask로 설치되었는지 확인
 */
export function getBrewInstallStatus(): BrewInstallStatus {
  const brewPath = findBrewPath();
  if (!brewPath) return "brew-not-installed";

  try {
    execFileSync(brewPath, ["list", "--cask", CASK_NAME], {
      encoding: "utf-8",
      timeout: 10_000,
    });
    return "brew-ready";
  } catch {
    return "not-via-brew";
  }
}

/**
 * brew upgrade --cask prowl 실행
 *
 * 비동기로 실행하며 120초 타임아웃 적용
 */
export function runBrewUpgrade(): Promise<IpcResult> {
  const brewPath = findBrewPath();
  if (!brewPath) {
    return Promise.resolve({ success: false, error: "Homebrew가 설치되어 있지 않습니다." });
  }

  return new Promise((resolve) => {
    execFile(
      brewPath,
      ["upgrade", "--cask", CASK_NAME],
      { encoding: "utf-8", timeout: 120_000 },
      (error, _stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: stderr || error.message });
        } else {
          resolve({ success: true });
        }
      },
    );
  });
}
