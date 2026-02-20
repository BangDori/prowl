/** Prowl 내부 스크립트 라이브러리 타입 */

/** 스크립트 실행 스케줄 */
export type ProwlSchedule =
  | { type: "daily"; hour: number; minute: number }
  | { type: "weekly"; weekday: number; hour: number; minute: number }
  | { type: "interval"; seconds: number }
  | { type: "manual" };

/** 스크립트 단일 실행 기록 */
export interface ScriptRunInfo {
  runAt: string; // ISO 8601
  success: boolean;
  output: string;
  exitCode: number;
}

/** Prowl 내부 스크립트 */
export interface ProwlScript {
  id: string;
  name: string;
  description: string; // 유저가 입력한 자연어 원문
  script: string; // shell script 내용
  schedule: ProwlSchedule;
  scheduleText: string; // 사람이 읽을 수 있는 스케줄 설명
  isEnabled: boolean;
  createdAt: string; // ISO 8601
  lastRun: ScriptRunInfo | null;
}

/** AI가 자연어에서 생성하는 스크립트 초안 */
export interface ScriptDraft {
  name: string;
  description: string;
  script: string;
  schedule: ProwlSchedule;
  scheduleText: string;
}
