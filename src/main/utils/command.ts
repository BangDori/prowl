import { execSync } from "child_process";
import type { JobActionResult } from "../../shared/types";

interface CommandOptions {
  successMessage: string;
  errorPrefix: string;
}

/**
 * 쉘 명령어를 실행하고 결과를 JobActionResult로 반환
 */
export function executeCommand(command: string, options: CommandOptions): JobActionResult {
  try {
    execSync(command, { encoding: "utf-8" });
    return { success: true, message: options.successMessage };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `${options.errorPrefix}: ${message}`,
    };
  }
}
