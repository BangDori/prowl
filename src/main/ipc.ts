import { ipcMain, shell } from 'electron';
import {
  listAllJobs,
  findJobById,
  toggleJob,
  startJob,
} from './services/launchd';
import { readLogContent } from './services/log-reader';
import { getSettings, setSettings } from './services/settings';
import { LaunchdJob, JobActionResult, LogContent, AppSettings } from '../shared/types';
import { LOG_LINES_DEFAULT } from './constants';

/**
 * IPC 핸들러 등록
 */
export function registerIpcHandlers(): void {
  // 작업 목록 조회
  ipcMain.handle('jobs:list', async (): Promise<LaunchdJob[]> => {
    return listAllJobs();
  });

  // 작업 목록 새로고침 (list와 동일하지만 명시적)
  ipcMain.handle('jobs:refresh', async (): Promise<LaunchdJob[]> => {
    return listAllJobs();
  });

  // 작업 토글 (활성화/비활성화)
  ipcMain.handle(
    'jobs:toggle',
    async (_event, jobId: string): Promise<JobActionResult> => {
      const job = findJobById(jobId);
      if (!job) {
        return { success: false, message: '작업을 찾을 수 없습니다.' };
      }
      return toggleJob(job.plistPath, job.label);
    }
  );

  // 작업 수동 실행
  ipcMain.handle(
    'jobs:run',
    async (_event, jobId: string): Promise<JobActionResult> => {
      const job = findJobById(jobId);
      if (!job) {
        return { success: false, message: '작업을 찾을 수 없습니다.' };
      }
      if (!job.isLoaded) {
        return {
          success: false,
          message: '작업이 비활성화 상태입니다. 먼저 활성화해주세요.',
        };
      }
      return startJob(job.label);
    }
  );

  // 로그 조회
  ipcMain.handle(
    'jobs:logs',
    async (
      _event,
      jobId: string,
      lines: number = LOG_LINES_DEFAULT
    ): Promise<LogContent> => {
      const job = findJobById(jobId);
      if (!job) {
        return {
          content: '작업을 찾을 수 없습니다.',
          lastModified: null,
        };
      }
      if (!job.logPath) {
        return {
          content: '이 작업은 로그 파일이 설정되지 않았습니다.',
          lastModified: null,
        };
      }
      return readLogContent(job.logPath, lines);
    }
  );

  // 설정 조회
  ipcMain.handle('settings:get', async (): Promise<AppSettings> => {
    return getSettings();
  });

  // 설정 저장
  ipcMain.handle(
    'settings:set',
    async (_event, settings: AppSettings): Promise<void> => {
      setSettings(settings);
    }
  );

  // Finder에서 파일 위치 보기
  ipcMain.handle(
    'shell:showInFolder',
    async (_event, filePath: string): Promise<void> => {
      shell.showItemInFolder(filePath);
    }
  );
}
