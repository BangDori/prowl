import { execSync, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { LaunchdJob, JobActionResult } from '../../shared/types';
import {
  LAUNCH_AGENTS_DIR,
  PLIST_PREFIX,
  DEFAULT_ICON,
  DEFAULT_DESCRIPTION,
} from '../constants';
import {
  parsePlistFile,
  extractLabel,
  extractScriptPath,
  extractLogPath,
  extractSchedule,
  scheduleToText,
  getJobNameFromLabel,
} from './plist-parser';
import { getLastRunInfo } from './log-reader';
import { extractScriptMetadata } from './script-metadata';

/**
 * com.claude.* 패턴의 모든 plist 파일 찾기
 */
export function findClaudePlistFiles(): string[] {
  try {
    const files = fs.readdirSync(LAUNCH_AGENTS_DIR);
    return files
      .filter((f) => f.startsWith(PLIST_PREFIX) && f.endsWith('.plist'))
      .map((f) => path.join(LAUNCH_AGENTS_DIR, f));
  } catch (error) {
    console.error('Failed to read LaunchAgents directory:', error);
    return [];
  }
}

/**
 * launchctl list로 현재 로드된 작업 목록 가져오기
 */
export function getLoadedJobs(): Set<string> {
  try {
    const output = execSync('launchctl list', { encoding: 'utf-8' });
    const lines = output.split('\n');
    const loadedLabels = new Set<string>();

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 3) {
        const label = parts[2];
        if (label.startsWith(PLIST_PREFIX)) {
          loadedLabels.add(label);
        }
      }
    }

    return loadedLabels;
  } catch (error) {
    console.error('Failed to get loaded jobs:', error);
    return new Set();
  }
}

/**
 * 특정 작업이 로드되어 있는지 확인
 */
export function isJobLoaded(label: string): boolean {
  const loadedJobs = getLoadedJobs();
  return loadedJobs.has(label);
}

/**
 * 작업 로드 (활성화)
 */
export function loadJob(plistPath: string): JobActionResult {
  try {
    execSync(`launchctl load "${plistPath}"`, { encoding: 'utf-8' });
    return { success: true, message: '작업이 활성화되었습니다.' };
  } catch (error: any) {
    return {
      success: false,
      message: `활성화 실패: ${error.message || error}`,
    };
  }
}

/**
 * 작업 언로드 (비활성화)
 */
export function unloadJob(plistPath: string): JobActionResult {
  try {
    execSync(`launchctl unload "${plistPath}"`, { encoding: 'utf-8' });
    return { success: true, message: '작업이 비활성화되었습니다.' };
  } catch (error: any) {
    return {
      success: false,
      message: `비활성화 실패: ${error.message || error}`,
    };
  }
}

/**
 * 작업 수동 실행
 */
export function startJob(label: string): JobActionResult {
  try {
    execSync(`launchctl start "${label}"`, { encoding: 'utf-8' });
    return { success: true, message: '작업이 시작되었습니다.' };
  } catch (error: any) {
    return {
      success: false,
      message: `실행 실패: ${error.message || error}`,
    };
  }
}

/**
 * 작업 토글 (활성화 <-> 비활성화)
 */
export function toggleJob(plistPath: string, label: string): JobActionResult {
  const loaded = isJobLoaded(label);
  if (loaded) {
    return unloadJob(plistPath);
  } else {
    return loadJob(plistPath);
  }
}

/**
 * 모든 Claude 작업 목록 가져오기
 */
export function listAllJobs(): LaunchdJob[] {
  const plistFiles = findClaudePlistFiles();
  const loadedJobs = getLoadedJobs();
  const jobs: LaunchdJob[] = [];

  for (const plistPath of plistFiles) {
    const data = parsePlistFile(plistPath);
    if (!data) continue;

    const label = extractLabel(data);
    const jobName = getJobNameFromLabel(label);
    const schedule = extractSchedule(data);
    const logPath = extractLogPath(data);
    const scriptPath = extractScriptPath(data);

    // 스크립트에서 메타데이터 추출 (우선), 없으면 constants에서 가져옴
    const metadata = extractScriptMetadata(scriptPath);

    const job: LaunchdJob = {
      id: label,
      label,
      name: jobName,
      description: metadata.description || DEFAULT_DESCRIPTION,
      icon: metadata.icon || DEFAULT_ICON,
      plistPath,
      scriptPath,
      logPath,
      schedule,
      scheduleText: scheduleToText(schedule),
      isLoaded: loadedJobs.has(label),
      lastRun: logPath ? getLastRunInfo(logPath) : null,
    };

    jobs.push(job);
  }

  // 마지막 실행 시간 기준 정렬 (최근 실행이 위로, 실행 기록 없으면 맨 아래)
  return jobs.sort((a, b) => {
    const aTime = a.lastRun?.timestamp ? new Date(a.lastRun.timestamp).getTime() : 0;
    const bTime = b.lastRun?.timestamp ? new Date(b.lastRun.timestamp).getTime() : 0;
    return bTime - aTime;
  });
}

/**
 * ID로 작업 찾기
 */
export function findJobById(jobId: string): LaunchdJob | null {
  const jobs = listAllJobs();
  return jobs.find((j) => j.id === jobId) || null;
}
