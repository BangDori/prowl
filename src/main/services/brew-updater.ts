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
 * brew update로 로컬 formula 캐시 갱신
 */
function refreshBrewCache(brewPath: string): Promise<void> {
  return new Promise((resolve) => {
    execFile(brewPath, ["update"], { encoding: "utf-8", timeout: 60_000 }, () => resolve());
  });
}

/**
 * Homebrew cask에 업그레이드 가능한 버전이 있는지 확인
 */
function isCaskOutdated(brewPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile(
      brewPath,
      ["outdated", "--cask", CASK_NAME],
      { encoding: "utf-8", timeout: 30_000 },
      (error, stdout) => {
        if (error) {
          resolve(false);
          return;
        }
        resolve(stdout.includes(CASK_NAME));
      },
    );
  });
}

/**
 * brew upgrade --cask prowl 실행
 *
 * 업그레이드 전 cask가 실제로 outdated인지 확인하여
 * GitHub 릴리즈와 Homebrew formula 버전 불일치 시 빈 업그레이드를 방지한다.
 * 비동기로 실행하며 120초 타임아웃 적용.
 */
export function runBrewUpgrade(): Promise<IpcResult> {
  const brewPath = findBrewPath();
  if (!brewPath) {
    return Promise.resolve({ success: false, error: "Homebrew가 설치되어 있지 않습니다." });
  }

  return refreshBrewCache(brewPath)
    .then(() => isCaskOutdated(brewPath))
    .then((outdated) => {
      if (!outdated) {
        return {
          success: false,
          error:
            "Homebrew Cask가 아직 최신 버전을 반영하지 않았습니다. GitHub에서 직접 다운로드해주세요.",
        };
      }

      return new Promise<IpcResult>((resolve) => {
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
    });
}
