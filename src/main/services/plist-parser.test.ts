import { describe, it, expect } from 'vitest';
import {
  extractLabel,
  extractScriptPath,
  extractLogPath,
  extractSchedule,
  scheduleToText,
  getJobNameFromLabel,
} from './plist-parser';

describe('extractLabel', () => {
  it('Label 반환', () => {
    expect(extractLabel({ Label: 'com.claude.daily' })).toBe('com.claude.daily');
  });

  it('Label 없으면 unknown', () => {
    expect(extractLabel({})).toBe('unknown');
  });
});

describe('extractScriptPath', () => {
  it('bash + script 경로 추출', () => {
    expect(
      extractScriptPath({ ProgramArguments: ['/bin/bash', '/usr/local/bin/run.sh'] })
    ).toBe('/usr/local/bin/run.sh');
  });

  it('단일 인자면 마지막 반환', () => {
    expect(extractScriptPath({ ProgramArguments: ['/usr/bin/python3'] })).toBe('/usr/bin/python3');
  });

  it('ProgramArguments 없으면 빈 문자열', () => {
    expect(extractScriptPath({})).toBe('');
  });
});

describe('extractLogPath', () => {
  it('StandardOutPath 우선', () => {
    expect(
      extractLogPath({ StandardOutPath: '/tmp/out.log', StandardErrorPath: '/tmp/err.log' })
    ).toBe('/tmp/out.log');
  });

  it('둘 다 없으면 null', () => {
    expect(extractLogPath({})).toBeNull();
  });
});

describe('extractSchedule', () => {
  it('StartCalendarInterval → calendar', () => {
    const result = extractSchedule({
      StartCalendarInterval: { Weekday: 5, Hour: 11, Minute: 0 },
    });
    expect(result).toEqual({
      type: 'calendar',
      weekdays: [5],
      hour: 11,
      minute: 0,
    });
  });

  it('배열 형태의 CalendarInterval', () => {
    const result = extractSchedule({
      StartCalendarInterval: [
        { Weekday: 1, Hour: 9, Minute: 0 },
        { Weekday: 3, Hour: 9, Minute: 0 },
      ],
    });
    expect(result.type).toBe('calendar');
    if (result.type === 'calendar') {
      expect(result.weekdays).toEqual([1, 3]);
    }
  });

  it('StartInterval → interval', () => {
    expect(extractSchedule({ StartInterval: 3600 })).toEqual({
      type: 'interval',
      intervalSeconds: 3600,
    });
  });

  it('KeepAlive → keepAlive', () => {
    expect(extractSchedule({ KeepAlive: true })).toEqual({ type: 'keepAlive' });
  });

  it('아무것도 없으면 unknown', () => {
    expect(extractSchedule({})).toEqual({ type: 'unknown' });
  });
});

describe('scheduleToText', () => {
  it('매일 11:00', () => {
    expect(scheduleToText({ type: 'calendar', hour: 11, minute: 0 })).toBe('매일 11:00');
  });

  it('특정 요일', () => {
    expect(scheduleToText({ type: 'calendar', weekdays: [5], hour: 11, minute: 0 })).toBe(
      '금 11:00'
    );
  });

  it('평일', () => {
    expect(
      scheduleToText({ type: 'calendar', weekdays: [1, 2, 3, 4, 5], hour: 9, minute: 0 })
    ).toBe('평일 09:00');
  });

  it('시간마다', () => {
    expect(scheduleToText({ type: 'interval', intervalSeconds: 3600 })).toBe('1시간마다');
  });

  it('분마다', () => {
    expect(scheduleToText({ type: 'interval', intervalSeconds: 300 })).toBe('5분마다');
  });

  it('항상 실행', () => {
    expect(scheduleToText({ type: 'keepAlive' })).toBe('항상 실행');
  });

  it('알 수 없음', () => {
    expect(scheduleToText({ type: 'unknown' })).toBe('알 수 없음');
  });
});

describe('getJobNameFromLabel', () => {
  it('마지막 세그먼트 반환', () => {
    expect(getJobNameFromLabel('com.claude.daily-retrospective')).toBe('daily-retrospective');
  });
});
