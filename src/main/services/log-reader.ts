import * as fs from 'fs';
import { LastRunInfo, LogContent } from '../../shared/types';
import { LOG_LINES_DEFAULT } from '../constants';

/**
 * 로그 파일에서 마지막 실행 정보 추출
 */
export function getLastRunInfo(logPath: string): LastRunInfo | null {
  try {
    if (!fs.existsSync(logPath)) {
      return null;
    }

    const stats = fs.statSync(logPath);
    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.trim().split('\n');

    // 마지막 몇 줄에서 성공/실패 패턴 찾기
    const lastLines = lines.slice(-20).join('\n').toLowerCase();

    // 성공 패턴
    const successPatterns = [
      '완료',
      'complete',
      'success',
      'finished',
      '리포트 완료',
      'slack 전송 완료',
    ];

    // 실패 패턴
    const failurePatterns = [
      'error',
      'failed',
      'exception',
      '실패',
      'unable to',
    ];

    let success = true;
    let message: string | undefined;

    for (const pattern of failurePatterns) {
      if (lastLines.includes(pattern)) {
        success = false;
        // 에러 메시지 추출 시도
        const errorLine = lines
          .slice(-10)
          .find((l) => l.toLowerCase().includes(pattern));
        if (errorLine) {
          message = errorLine.substring(0, 100);
        }
        break;
      }
    }

    // 명시적 성공 메시지가 있으면 확실히 성공
    if (!success) {
      for (const pattern of successPatterns) {
        if (lastLines.includes(pattern)) {
          success = true;
          break;
        }
      }
    }

    return {
      timestamp: stats.mtime,
      success,
      message,
    };
  } catch (error) {
    console.error(`Failed to read log: ${logPath}`, error);
    return null;
  }
}

/**
 * 로그 파일 내용 읽기 (최근 N줄)
 */
export function readLogContent(
  logPath: string,
  lines: number = LOG_LINES_DEFAULT
): LogContent {
  try {
    if (!fs.existsSync(logPath)) {
      return {
        content: '로그 파일이 존재하지 않습니다.',
        lastModified: null,
      };
    }

    const stats = fs.statSync(logPath);
    const content = fs.readFileSync(logPath, 'utf-8');
    const allLines = content.split('\n');

    // 마지막 N줄만 반환
    const lastLines = allLines.slice(-lines).join('\n');

    return {
      content: lastLines || '(빈 로그)',
      lastModified: stats.mtime,
    };
  } catch (error) {
    return {
      content: `로그 읽기 실패: ${error}`,
      lastModified: null,
    };
  }
}

/**
 * 마지막 실행 시간을 사람이 읽기 쉬운 형태로 변환
 */
export function formatLastRun(lastRun: LastRunInfo | null): string {
  if (!lastRun) {
    return '-';
  }

  const now = new Date();
  const runTime = new Date(lastRun.timestamp);
  const diffMs = now.getTime() - runTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let timeText: string;

  if (diffMins < 1) {
    timeText = '방금 전';
  } else if (diffMins < 60) {
    timeText = `${diffMins}분 전`;
  } else if (diffHours < 24) {
    timeText = `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    timeText = `${diffDays}일 전`;
  } else {
    timeText = runTime.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return timeText;
}
