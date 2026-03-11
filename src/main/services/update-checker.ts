/** Homebrew Cask 기반 앱 업데이트 확인 */
import type { UpdateCheckResult } from "@shared/types";
import { app } from "electron";
import { getBrewInstallStatus, getLatestFormulaVersion } from "./brew-updater";

function parseVersion(version: string): number[] {
  return version
    .replace(/^v/, "")
    .split(".")
    .map((n) => Number.parseInt(n, 10) || 0);
}

function compareVersions(a: string, b: string): number {
  const partsA = parseVersion(a);
  const partsB = parseVersion(b);
  const maxLen = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLen; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

/**
 * 업데이트 확인
 *
 * brew update로 로컬 formula 캐시를 갱신한 뒤,
 * formula 버전과 현재 앱 버전을 비교하여 업데이트 가능 여부를 반환한다.
 * brew로 설치되지 않은 경우 업데이트 확인 불가.
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const currentVersion = app.getVersion();
  const brewStatus = getBrewInstallStatus();

  if (brewStatus !== "brew-ready") {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      brewStatus,
      canBrewUpgrade: false,
    };
  }

  try {
    const latestVersion = await getLatestFormulaVersion();

    if (!latestVersion) {
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        brewStatus,
        canBrewUpgrade: false,
        error: "Homebrew formula 버전을 확인할 수 없습니다.",
      };
    }

    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      brewStatus,
      canBrewUpgrade: hasUpdate,
    };
  } catch (error) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      brewStatus,
      canBrewUpgrade: false,
      error: error instanceof Error ? error.message : "업데이트 확인 중 오류가 발생했습니다.",
    };
  }
}
