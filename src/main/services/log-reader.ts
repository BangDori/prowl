import * as fs from "fs";
import type { LastRunInfo, LogContent } from "../../shared/types";
import { LOG_LINES_DEFAULT } from "../constants";
import { analyzeLogContent } from "./log-analyzer";

/**
 * 로그 파일에서 마지막 실행 정보 추출
 */
export function getLastRunInfo(logPath: string): LastRunInfo | null {
  try {
    if (!fs.existsSync(logPath)) {
      return null;
    }

    const stats = fs.statSync(logPath);
    const content = fs.readFileSync(logPath, "utf-8");
    const lines = content.trim().split("\n");

    const analysis = analyzeLogContent(lines);

    return {
      timestamp: stats.mtime,
      success: analysis.success,
      message: analysis.message,
    };
  } catch (error) {
    console.error(`Failed to read log: ${logPath}`, error);
    return null;
  }
}

/**
 * 로그 파일 내용 읽기 (최근 N줄)
 */
export function readLogContent(logPath: string, lines: number = LOG_LINES_DEFAULT): LogContent {
  try {
    if (!fs.existsSync(logPath)) {
      return {
        content: "로그 파일이 존재하지 않습니다.",
        lastModified: null,
      };
    }

    const stats = fs.statSync(logPath);
    const content = fs.readFileSync(logPath, "utf-8");
    const allLines = content.split("\n");
    const lastLines = allLines.slice(-lines).join("\n");

    return {
      content: lastLines || "(빈 로그)",
      lastModified: stats.mtime,
    };
  } catch (error) {
    return {
      content: `로그 읽기 실패: ${error}`,
      lastModified: null,
    };
  }
}
