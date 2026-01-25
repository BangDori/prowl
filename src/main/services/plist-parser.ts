import * as plist from 'plist';
import * as fs from 'fs';
import * as path from 'path';
import { JobSchedule } from '../../shared/types';
import { WEEKDAY_NAMES } from '../constants';

interface PlistData {
  Label?: string;
  ProgramArguments?: string[];
  StartCalendarInterval?: CalendarInterval | CalendarInterval[];
  StartInterval?: number;
  KeepAlive?: boolean;
  StandardOutPath?: string;
  StandardErrorPath?: string;
  WorkingDirectory?: string;
}

interface CalendarInterval {
  Weekday?: number;
  Hour?: number;
  Minute?: number;
  Day?: number;
  Month?: number;
}

export function parsePlistFile(plistPath: string): PlistData | null {
  try {
    const content = fs.readFileSync(plistPath, 'utf-8');
    return plist.parse(content) as PlistData;
  } catch (error) {
    console.error(`Failed to parse plist: ${plistPath}`, error);
    return null;
  }
}

export function extractLabel(data: PlistData): string {
  return data.Label || 'unknown';
}

export function extractScriptPath(data: PlistData): string {
  const args = data.ProgramArguments || [];
  // 보통 ["/bin/bash", "/path/to/script.sh"] 형태
  if (args.length >= 2 && args[0].includes('bash')) {
    return args[1];
  }
  return args[args.length - 1] || '';
}

export function extractLogPath(data: PlistData): string | null {
  return data.StandardOutPath || data.StandardErrorPath || null;
}

export function extractSchedule(data: PlistData): JobSchedule {
  // StartCalendarInterval 처리
  if (data.StartCalendarInterval) {
    const intervals = Array.isArray(data.StartCalendarInterval)
      ? data.StartCalendarInterval
      : [data.StartCalendarInterval];

    const weekdays = intervals
      .map((i) => i.Weekday)
      .filter((w): w is number => w !== undefined);

    const firstInterval = intervals[0];

    return {
      type: 'calendar',
      weekdays: weekdays.length > 0 ? weekdays : undefined,
      hour: firstInterval.Hour,
      minute: firstInterval.Minute,
    };
  }

  // StartInterval 처리
  if (data.StartInterval) {
    return {
      type: 'interval',
      intervalSeconds: data.StartInterval,
    };
  }

  // KeepAlive 처리
  if (data.KeepAlive) {
    return {
      type: 'keepAlive',
    };
  }

  return { type: 'unknown' };
}

export function scheduleToText(schedule: JobSchedule): string {
  switch (schedule.type) {
    case 'calendar': {
      const parts: string[] = [];

      // 요일
      if (schedule.weekdays && schedule.weekdays.length > 0) {
        if (schedule.weekdays.length === 7) {
          parts.push('매일');
        } else if (schedule.weekdays.length === 5 &&
                   schedule.weekdays.every(d => d >= 1 && d <= 5)) {
          parts.push('평일');
        } else {
          const dayNames = schedule.weekdays
            .sort((a, b) => a - b)
            .map((d) => WEEKDAY_NAMES[d])
            .join('/');
          parts.push(dayNames);
        }
      } else {
        parts.push('매일');
      }

      // 시간
      if (schedule.hour !== undefined) {
        const hour = schedule.hour.toString().padStart(2, '0');
        const minute = (schedule.minute ?? 0).toString().padStart(2, '0');
        parts.push(`${hour}:${minute}`);
      }

      return parts.join(' ');
    }

    case 'interval': {
      const seconds = schedule.intervalSeconds || 0;
      if (seconds >= 3600) {
        return `${Math.floor(seconds / 3600)}시간마다`;
      } else if (seconds >= 60) {
        return `${Math.floor(seconds / 60)}분마다`;
      }
      return `${seconds}초마다`;
    }

    case 'keepAlive':
      return '항상 실행';

    default:
      return '알 수 없음';
  }
}

export function getJobNameFromLabel(label: string): string {
  // com.claude.daily-retrospective -> daily-retrospective
  const parts = label.split('.');
  return parts[parts.length - 1];
}
