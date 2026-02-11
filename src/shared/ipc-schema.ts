import type {
  AppSettings,
  CalendarEvent,
  CalendarSettings,
  ChatMessage,
  ChatSendResult,
  ClaudeConfig,
  FocusMode,
  IpcResult,
  JobActionResult,
  JobCustomization,
  JobCustomizations,
  LaunchdJob,
  LocalEvent,
  LogContent,
  UpdateCheckResult,
} from "./types";

/**
 * IPC Invoke 채널 스키마
 *
 * 모든 IPC 채널의 파라미터와 반환 타입을 정의하는 단일 소스.
 * main(handleIpc), preload(invokeIpc), renderer(global.d.ts)에서 이 스키마를 참조한다.
 *
 * 새 채널 추가 시:
 * 1. 이 스키마에 채널 정의 추가
 * 2. src/main/ipc.ts에 handleIpc() 핸들러 추가
 * 3. src/preload/index.ts에 invokeIpc() 메서드 추가
 * → renderer 타입은 자동 반영됨
 */
export interface IpcInvokeSchema {
  // Jobs (8 channels)
  "jobs:list": { params: []; return: LaunchdJob[] };
  "jobs:refresh": { params: []; return: LaunchdJob[] };
  "jobs:toggle": { params: [jobId: string]; return: JobActionResult };
  "jobs:run": { params: [jobId: string]; return: JobActionResult };
  "jobs:running": { params: []; return: string[] };
  "jobs:logs": { params: [jobId: string, lines?: number]; return: LogContent };
  "jobs:getCustomizations": { params: []; return: JobCustomizations };
  "jobs:setCustomization": {
    params: [jobId: string, customization: JobCustomization];
    return: IpcResult;
  };

  // Settings (2 channels)
  "settings:get": { params: []; return: AppSettings };
  "settings:set": { params: [settings: AppSettings]; return: IpcResult };

  // Shell (2 channels)
  "shell:showInFolder": { params: [filePath: string]; return: void };
  "shell:openExternal": { params: [url: string]; return: void };

  // Focus Mode (2 channels)
  "focusMode:get": { params: []; return: FocusMode };
  "focusMode:set": { params: [focusMode: FocusMode]; return: IpcResult };

  // Window (1 channel)
  "window:resize": { params: [height: number]; return: void };

  // Navigation (1 channel)
  "nav:back": { params: []; return: void };

  // App (3 channels)
  "app:quit": { params: []; return: void };
  "app:version": { params: []; return: string };
  "app:check-update": { params: []; return: UpdateCheckResult };

  // Chat (3 channels)
  "chat:send": { params: [content: string, history: ChatMessage[]]; return: ChatSendResult };
  "chat:resize": { params: [height: number]; return: void };
  "chat:close": { params: []; return: void };

  // Calendar (7 channels)
  "calendar:list-events": { params: []; return: CalendarEvent[] };
  "calendar:get-settings": { params: []; return: CalendarSettings };
  "calendar:set-settings": { params: [settings: CalendarSettings]; return: IpcResult };
  "calendar:local-events": { params: []; return: LocalEvent[] };
  "calendar:add-local-event": { params: [event: LocalEvent]; return: IpcResult };
  "calendar:update-local-event": { params: [event: LocalEvent]; return: IpcResult };
  "calendar:delete-local-event": { params: [eventId: string]; return: IpcResult };

  // Claude Config (2 channels)
  "claude-config:list": { params: []; return: ClaudeConfig };
  "claude-config:read-file": { params: [filePath: string]; return: string };
}

/**
 * IPC Event 채널 스키마 (main → renderer 단방향)
 */
export interface IpcEventSchema {
  "window:show": { params: [] };
}

// 유틸리티 타입
export type IpcChannel = keyof IpcInvokeSchema;
export type IpcParams<C extends IpcChannel> = IpcInvokeSchema[C]["params"];
export type IpcReturn<C extends IpcChannel> = IpcInvokeSchema[C]["return"];
