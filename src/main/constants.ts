import { homedir } from 'os';
import path from 'path';

export const LAUNCH_AGENTS_DIR = path.join(homedir(), 'Library', 'LaunchAgents');

export const WEEKDAY_NAMES: Record<number, string> = {
  0: '일',
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
};

export const DEFAULT_ICON = '⚙️';
export const DEFAULT_DESCRIPTION = '설명 없음';

export const REFRESH_INTERVAL_MS = 10000; // 10초마다 갱신
export const LOG_LINES_DEFAULT = 50;
