/** GitHub Releases API 기반 앱 업데이트 확인 */
import type { UpdateCheckResult } from "@shared/types";
import { app, net } from "electron";

const GITHUB_RELEASES_API = "https://api.github.com/repos/BangDori/prowl/releases/latest";

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  body?: string;
}

/**
 * 버전 문자열에서 숫자 배열 추출 (v1.2.3 -> [1, 2, 3])
 */
function parseVersion(version: string): number[] {
  const cleaned = version.replace(/^v/, "");
  return cleaned.split(".").map((n) => Number.parseInt(n, 10) || 0);
}

/**
 * 버전 비교 (a > b: 1, a < b: -1, a === b: 0)
 */
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
 * GitHub API를 통해 최신 릴리즈 정보 조회
 */
async function fetchLatestRelease(): Promise<GitHubRelease> {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method: "GET",
      url: GITHUB_RELEASES_API,
    });

    request.setHeader("Accept", "application/vnd.github.v3+json");
    request.setHeader("User-Agent", "Prowl-App");

    let data = "";

    request.on("response", (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`GitHub API responded with status ${response.statusCode}`));
        return;
      }

      response.on("data", (chunk) => {
        data += chunk.toString();
      });

      response.on("end", () => {
        try {
          const release = JSON.parse(data) as GitHubRelease;
          resolve(release);
        } catch {
          reject(new Error("Failed to parse GitHub API response"));
        }
      });
    });

    request.on("error", (error) => {
      reject(error);
    });

    request.end();
  });
}

/**
 * 업데이트 확인
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const currentVersion = app.getVersion();

  try {
    const release = await fetchLatestRelease();
    const latestVersion = release.tag_name.replace(/^v/, "");
    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      releaseUrl: release.html_url,
      releaseNotes: release.body,
    };
  } catch (error) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      releaseUrl: "https://github.com/BangDori/prowl/releases",
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}
