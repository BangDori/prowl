import {
  LOG_PATTERNS,
  LOG_ANALYSIS_LINES,
  LOG_ERROR_SEARCH_LINES,
  LOG_MESSAGE_MAX_LENGTH,
} from '../constants';

export interface LogAnalysisResult {
  success: boolean;
  message?: string;
}

/**
 * 로그 내용을 분석하여 성공/실패 여부를 판단
 * 패턴 기반으로 마지막 실행 결과를 추론
 */
export function analyzeLogContent(lines: string[]): LogAnalysisResult {
  const lastLines = lines.slice(-LOG_ANALYSIS_LINES).join('\n').toLowerCase();

  let success = true;
  let message: string | undefined;

  // 실패 패턴 검사
  for (const pattern of LOG_PATTERNS.failure) {
    if (lastLines.includes(pattern)) {
      success = false;
      // 에러 메시지 추출
      const errorLine = lines
        .slice(-LOG_ERROR_SEARCH_LINES)
        .find((l) => l.toLowerCase().includes(pattern));
      if (errorLine) {
        message = errorLine.substring(0, LOG_MESSAGE_MAX_LENGTH);
      }
      break;
    }
  }

  // 성공 패턴이 있으면 실패를 덮어씀
  if (!success) {
    for (const pattern of LOG_PATTERNS.success) {
      if (lastLines.includes(pattern)) {
        success = true;
        break;
      }
    }
  }

  return { success, message };
}
