# IPC Conventions

Electron IPC 통신 규칙

## Single Source of Truth

IPC 채널 스키마는 `src/shared/ipc-schema.ts`에서 중앙 관리한다.

```
IpcInvokeSchema → main(handleIpc) + preload(invokeIpc) + renderer(global.d.ts)
IpcEventSchema  → main(sendIpc) + preload(onIpc) + renderer(global.d.ts)
```

새 채널 추가 시:
1. `src/shared/ipc-schema.ts`에 타입 정의 추가
2. `src/main/ipc.ts`에 `handleIpc()` 핸들러 추가
3. `src/preload/index.ts`에 `invokeIpc()` 메서드 추가
→ renderer 타입은 자동 반영됨

## 채널 네이밍

### 형식: `{domain}:{action}`

```typescript
"tasks:add-task"          // 태스크 추가
"chat-rooms:toggle-lock"  // 채팅방 잠금 토글
"settings:get"            // 설정 조회
"oauth:start-server"      // OAuth 서버 시작
```

### 도메인 목록

| 도메인 | 설명 |
|--------|------|
| `settings` | 앱 설정 |
| `shell` | OS 연동 (파일, 외부 URL) |
| `window` | 윈도우 제어 |
| `nav` | 네비게이션 |
| `app` | 앱 제어 (quit, version, update) |
| `chat` | 채팅 전송 · 설정 |
| `chat-rooms` | 채팅방 관리 |
| `compact` | 컴팩트 윈도우 |
| `tasks` | 태스크 관리 |
| `categories` | 태스크 카테고리 |
| `memory` | AI 메모리 |
| `oauth` | OpenAI OAuth 인증 |
| `personalize` | AI 퍼스널라이제이션 |
| `prowl-fs` | 파일 브라우저 |

### 액션 네이밍

| 유형 | 동사 | 예시 |
|------|------|------|
| 조회 | `list`, `get`, `scan` | `tasks:list-month`, `settings:get` |
| 추가 | `add`, `create` | `tasks:add-task`, `chat-rooms:create` |
| 수정 | `set`, `update`, `toggle` | `settings:set`, `tasks:toggle-complete` |
| 삭제 | `delete` | `tasks:delete-task` |
| 실행 | `send`, `run`, `check` | `chat:send`, `app:check-update` |
| UI | `resize`, `close`, `expand-toggle` | `chat:resize` |

## 결과 타입

### Mutation 채널은 반드시 IpcResult 반환

```typescript
// shared/types/common.ts
interface IpcResult {
  success: boolean;
  error?: string;
}
```

- **Mutation** (`add`, `set`, `update`, `delete`, `toggle`): `IpcResult` 반환
- **조회** (`get`, `list`): 데이터 타입 직접 반환
- **Fire-and-forget** (`quit`, `resize`, `close`, `nav:back`): `void` 반환

```typescript
// Good
"tasks:add-task": { params: [date: string, task: Task]; return: IpcResult }
"tasks:list-month": { params: [year: number, month: number]; return: TasksByDate }
"app:quit": { params: []; return: void }

// Bad — mutation인데 void 반환
"tasks:delete-task": { params: [date: string, taskId: string]; return: void }
```

## 핸들러 등록 (Main Process)

### 파일: `src/main/ipc.ts`

`handleIpc` 헬퍼를 사용해 등록한다. 타입은 `IpcInvokeSchema`에서 자동 추론됨.

```typescript
import { handleIpc } from "@main/utils/ipc-handler";

// 조회
handleIpc("settings:get", async () => {
  return getSettings();
});

// Mutation
handleIpc("tasks:add-task", async (_event, date, task) => {
  try {
    await addTask(date, task);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});
```

## Preload 노출 (contextBridge)

### 파일: `src/preload/index.ts`

`invokeIpc` 헬퍼로 채널을 wrapping. 채널명 → camelCase 메서드명으로 변환.

```typescript
import { invokeIpc } from "./ipc-helper";

const electronAPI = {
  getSettings: () => invokeIpc("settings:get"),
  setSettings: (s: AppSettings) => invokeIpc("settings:set", s),
  addTask: (date: string, task: Task) => invokeIpc("tasks:add-task", date, task),
  // ...
};
```

### 채널 → 메서드 네이밍 변환

| 채널 (kebab) | 메서드 (camelCase) |
|-------------|-------------------|
| `settings:get` | `getSettings()` |
| `tasks:add-task` | `addTask(date, task)` |
| `chat-rooms:toggle-lock` | `toggleLock(roomId)` |
| `oauth:start-server` | `startOAuthServer()` |

## Renderer 사용

**컴포넌트에서 `window.electronAPI` 직접 호출 금지** — hooks를 통해 접근한다.

```typescript
// Bad — 컴포넌트 내 직접 호출
const settings = await window.electronAPI.getSettings();

// Good — hook 사용
const { data: settings } = useQuery({
  queryKey: queryKeys.settings,
  queryFn: () => window.electronAPI.getSettings(),
});
```

## IPC 이벤트 (Main → Renderer)

단방향 push 이벤트. `IpcEventSchema`에 정의하고, cleanup 함수를 반드시 반환한다.

```typescript
// preload
onChatStreamMessage: (cb: (roomId: string, msg: ChatMessage) => void) => {
  const handler = (_: IpcRendererEvent, roomId: string, msg: ChatMessage) => cb(roomId, msg);
  ipcRenderer.on("chat:stream-message", handler);
  return () => ipcRenderer.removeListener("chat:stream-message", handler);
},

// renderer (hook 내)
useEffect(() => {
  const unsubscribe = window.electronAPI.onChatStreamMessage((roomId, msg) => {
    setMessages(curr => [...curr, msg]);
  });
  return () => unsubscribe();
}, []);
```

## Date 전달 규칙

**Date 객체는 IPC 통과 불가** — 반드시 ISO 8601 문자열로 전달한다.

```typescript
// Bad
params: [date: Date]

// Good
params: [date: string]  // "2024-01-15", "2024-01-15T09:00:00.000Z"
```
