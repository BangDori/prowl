/** Homebrew Cask 기반 앱 업데이트 실행 */
import { execFile, execFileSync } from "node:child_process";
import type { BrewInstallStatus, IpcResult } from "@shared/types";

const BREW_PATHS = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"];
const CASK_NAME = "BangDori/prowl/prowl";

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
 *
 * 실패 시 reject — 호출부에서 catch 후 계속 진행 여부 결정
 */
function refreshBrewCache(brewPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(brewPath, ["update"], { encoding: "utf-8", timeout: 60_000 }, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

/**
 * Cask formula 버전 조회 (brew info 텍스트 파싱)
 */
function getCaskFormulaVersion(brewPath: string): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(
      brewPath,
      ["info", "--cask", CASK_NAME],
      { encoding: "utf-8", timeout: 15_000 },
      (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }
        const match = stdout.match(/(\d+\.\d+\.\d+)/);
        resolve(match?.[1] ?? null);
      },
    );
  });
}

/**
 * brew update로 캐시 갱신 후 Homebrew formula 최신 버전 반환
 *
 * checkForUpdates에서 업데이트 가능 여부 판단에 사용한다.
 */
export async function getLatestFormulaVersion(): Promise<string | null> {
  const brewPath = findBrewPath();
  if (!brewPath) return null;
  await refreshBrewCache(brewPath).catch(() => {
    /* brew update 실패해도 로컬 캐시로 계속 시도 */
  });
  return getCaskFormulaVersion(brewPath);
}

/**
 * brew upgrade --cask prowl 실행
 *
 * checkForUpdates에서 canBrewUpgrade가 확인된 후 호출된다.
 * brew update로 로컬 캐시를 갱신한 뒤 brew upgrade를 실행한다.
 */
export function runBrewUpgrade(): Promise<IpcResult> {
  const brewPath = findBrewPath();
  if (!brewPath) {
    return Promise.resolve({ success: false, error: "Homebrew가 설치되어 있지 않습니다." });
  }

  return refreshBrewCache(brewPath)
    .catch(() => {
      /* brew update 실패해도 로컬 캐시로 계속 시도 */
    })
    .then(
      () =>
        new Promise<IpcResult>((resolve) => {
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
        }),
    );
}
