import { contextBridge, ipcRenderer } from 'electron';
import { LaunchdJob, JobActionResult, LogContent } from '../shared/types';

/**
 * 렌더러 프로세스에 노출할 API
 */
const electronAPI = {
  // 작업 목록 조회
  listJobs: (): Promise<LaunchdJob[]> => ipcRenderer.invoke('jobs:list'),

  // 작업 목록 새로고침
  refreshJobs: (): Promise<LaunchdJob[]> => ipcRenderer.invoke('jobs:refresh'),

  // 작업 토글 (활성화/비활성화)
  toggleJob: (jobId: string): Promise<JobActionResult> =>
    ipcRenderer.invoke('jobs:toggle', jobId),

  // 작업 수동 실행
  runJob: (jobId: string): Promise<JobActionResult> =>
    ipcRenderer.invoke('jobs:run', jobId),

  // 로그 조회
  getJobLogs: (jobId: string, lines?: number): Promise<LogContent> =>
    ipcRenderer.invoke('jobs:logs', jobId, lines),

  // 창 표시 이벤트 리스너
  onWindowShow: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('window:show', handler);
    return () => ipcRenderer.removeListener('window:show', handler);
  },
};

// contextBridge로 API 노출
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript 타입 정의 export
export type ElectronAPI = typeof electronAPI;
