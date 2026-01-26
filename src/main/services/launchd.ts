import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { LaunchdJob, JobActionResult } from '../../shared/types';
import {
  PROWL_DIR,
  DEFAULT_ICON,
  DEFAULT_DESCRIPTION,
} from '../constants';
import { getPatterns } from './settings';
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
import { executeCommand } from '../utils/command';
import { matchesAnyPattern } from '../utils/pattern-matcher';

/**
 * 설정된 패턴에 맞는 모든 plist 파일 찾기
 * 패턴이 없으면 모든 plist 파일 반환
 */
export function findPlistFiles(): string[] {
  try {
    const patterns = getPatterns();

    // 디렉토리가 없으면 생성
    if (!fs.existsSync(PROWL_DIR)) {
      fs.mkdirSync(PROWL_DIR, { recursive: true });
    }

    const files = fs.readdirSync(PROWL_DIR);

    return files
      .filter((f) => f.endsWith('.plist') && matchesAnyPattern(f, patterns))
      .map((f) => path.join(PROWL_DIR, f));
  } catch (error) {
    console.error('Failed to read prowl directory:', error);
    return [];
  }
}

/**
 * launchctl list로 현재 로드된 작업 목록 가져오기
 * 패턴이 없으면 모든 로드된 작업 반환
 */
export function getLoadedJobs(): Set<string> {
  try {
    const patterns = getPatterns();
    const output = execSync('launchctl list', { encoding: 'utf-8' });
    const lines = output.split('\n');
    const loadedLabels = new Set<string>();

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 3) {
        const label = parts[2];
        if (matchesAnyPattern(label, patterns)) {
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
  return executeCommand(`launchctl load "${plistPath}"`, {
    successMessage: '작업이 활성화되었습니다.',
    errorPrefix: '활성화 실패',
  });
}

/**
 * 작업 언로드 (비활성화)
 */
export function unloadJob(plistPath: string): JobActionResult {
  return executeCommand(`launchctl unload "${plistPath}"`, {
    successMessage: '작업이 비활성화되었습니다.',
    errorPrefix: '비활성화 실패',
  });
}

/**
 * 작업 수동 실행
 */
export function startJob(label: string): JobActionResult {
  return executeCommand(`launchctl start "${label}"`, {
    successMessage: '작업이 시작되었습니다.',
    errorPrefix: '실행 실패',
  });
}

/**
 * 작업 토글 (활성화 <-> 비활성화)
 */
export function toggleJob(plistPath: string, label: string): JobActionResult {
  const loaded = isJobLoaded(label);
  return loaded ? unloadJob(plistPath) : loadJob(plistPath);
}

/**
 * 설정된 패턴에 맞는 모든 작업 목록 가져오기
 */
export function listAllJobs(): LaunchdJob[] {
  const plistFiles = findPlistFiles();
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

    const job: LaunchdJob = {
      id: label,
      label,
      name: jobName,
      description: DEFAULT_DESCRIPTION,
      icon: DEFAULT_ICON,
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

  return sortJobsByLastRun(jobs);
}

/**
 * 마지막 실행 시간 기준 정렬 (최근 실행이 위로)
 */
function sortJobsByLastRun(jobs: LaunchdJob[]): LaunchdJob[] {
  return jobs.sort((a, b) => {
    const aTime = a.lastRun?.timestamp
      ? new Date(a.lastRun.timestamp).getTime()
      : 0;
    const bTime = b.lastRun?.timestamp
      ? new Date(b.lastRun.timestamp).getTime()
      : 0;
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
