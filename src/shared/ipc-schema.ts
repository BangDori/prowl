/** IPC 채널별 파라미터·반환 타입 스키마 */
import type {
  AppSettings,
  ChatConfig,
  ChatMessage,
  ChatRoom,
  ChatRoomSummary,
  ClaudeConfig,
  FocusMode,
  IpcResult,
  JobActionResult,
  JobCustomization,
  JobCustomizations,
  LaunchdJob,
  LogContent,
  Memory,
  ProviderStatus,
  ProwlScript,
  ScriptRunInfo,
  Task,
  TasksByDate,
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

  // App (5 channels)
  "app:quit": { params: []; return: void };
  "app:version": { params: []; return: string };
  "app:check-update": { params: []; return: UpdateCheckResult };
  "app:install-update": { params: []; return: IpcResult };
  "app:relaunch": { params: []; return: void };

  // Chat (6 channels)
  "chat:send": {
    params: [roomId: string, content: string, history: ChatMessage[]];
    return: IpcResult;
  };
  "chat:get-config": { params: []; return: ChatConfig };
  "chat:set-config": { params: [config: ChatConfig]; return: IpcResult };
  "chat:providers": { params: []; return: ProviderStatus[] };
  "chat:resize": { params: [height: number]; return: void };
  "chat:close": { params: []; return: void };

  // Chat Rooms (6 channels)
  "chat-rooms:list": { params: []; return: ChatRoomSummary[] };
  "chat-rooms:get": { params: [roomId: string]; return: ChatRoom };
  "chat-rooms:create": { params: [title?: string]; return: ChatRoom };
  "chat-rooms:delete": { params: [roomId: string]; return: IpcResult };
  "chat-rooms:toggle-lock": { params: [roomId: string]; return: IpcResult };
  "chat-rooms:save-messages": {
    params: [roomId: string, messages: ChatMessage[]];
    return: IpcResult;
  };
  "chat-rooms:mark-read": {
    params: [roomId: string, lastMessageId: string];
    return: IpcResult;
  };
  "chat-rooms:unread-counts": {
    params: [];
    return: Record<string, number>;
  };

  // Compact (2 channels)
  "compact:toggle": { params: []; return: IpcResult };
  "compact:resize": { params: [height: number]; return: void };

  // Tasks (11 channels)
  "tasks:list-month": {
    params: [year: number, month: number];
    return: TasksByDate;
  };
  "tasks:list-date-range": {
    params: [startDate: string, endDate: string];
    return: TasksByDate;
  };
  "tasks:update-task": {
    params: [date: string, task: Task];
    return: IpcResult;
  };
  "tasks:toggle-complete": {
    params: [date: string, taskId: string];
    return: IpcResult;
  };
  "tasks:delete-task": {
    params: [date: string, taskId: string];
    return: IpcResult;
  };
  "tasks:add-task": { params: [date: string, task: Task]; return: IpcResult };
  "tasks:scan-dates": { params: []; return: string[] };

  // Tasks – Backlog
  "tasks:list-backlog": { params: []; return: Task[] };
  "tasks:add-backlog": { params: [task: Task]; return: IpcResult };
  "tasks:update-backlog": { params: [task: Task]; return: IpcResult };
  "tasks:toggle-backlog-complete": {
    params: [taskId: string];
    return: IpcResult;
  };
  "tasks:delete-backlog": { params: [taskId: string]; return: IpcResult };

  // Scripts (8 channels)
  "scripts:storage-path": { params: []; return: string };
  "scripts:list": { params: []; return: ProwlScript[] };
  "scripts:create": { params: [prompt: string]; return: IpcResult & { script?: ProwlScript } };
  "scripts:update": {
    params: [
      id: string,
      updates: Partial<
        Pick<ProwlScript, "name" | "script" | "schedule" | "scheduleText" | "isEnabled">
      >,
    ];
    return: IpcResult;
  };
  "scripts:delete": { params: [id: string]; return: IpcResult };
  "scripts:toggle": { params: [id: string]; return: IpcResult };
  "scripts:run": { params: [id: string]; return: IpcResult };
  "scripts:logs": { params: [id: string]; return: ScriptRunInfo[] };

  // Claude Config (2 channels)
  "claude-config:list": { params: []; return: ClaudeConfig };
  "claude-config:read-file": { params: [filePath: string]; return: string };

  // Memory (4 channels)
  "memory:list": { params: []; return: Memory[] };
  "memory:add": { params: [content: string]; return: IpcResult };
  "memory:update": { params: [id: string, content: string]; return: IpcResult };
  "memory:delete": { params: [id: string]; return: IpcResult };
}

/**
 * IPC Event 채널 스키마 (main → renderer 단방향)
 */
export interface IpcEventSchema {
  "window:show": { params: [] };
  "tasks:changed": { params: [] };
  "chat:stream-message": { params: [message: ChatMessage] };
  "chat:stream-done": { params: [] };
  "chat:stream-error": { params: [error: string] };
  "chat-rooms:unread-changed": { params: [totalUnread: number] };
}

// 유틸리티 타입
export type IpcChannel = keyof IpcInvokeSchema;
export type IpcParams<C extends IpcChannel> = IpcInvokeSchema[C]["params"];
export type IpcReturn<C extends IpcChannel> = IpcInvokeSchema[C]["return"];
