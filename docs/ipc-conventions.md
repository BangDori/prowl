# IPC Conventions

Electron IPC 통신 규칙

## 채널 네이밍

### 형식: `{domain}:{action}`

```typescript
// 도메인별 채널
"jobs:list"      // 작업 목록 조회
"jobs:toggle"    // 작업 활성화/비활성화
"settings:get"   // 설정 조회
"window:resize"  // 윈도우 크기 변경
```

### 도메인 목록

| 도메인 | 설명 | 예시 |
|--------|------|------|
| `jobs` | launchd 작업 관리 | `jobs:list`, `jobs:toggle`, `jobs:run` |
| `settings` | 앱 설정 | `settings:get`, `settings:set` |
| `focusMode` | 집중 모드 | `focusMode:get`, `focusMode:set` |
| `shell` | OS 연동 | `shell:openExternal`, `shell:showInFolder` |
| `window` | 윈도우 제어 | `window:resize`, `window:show` |
| `chat` | 채팅 기능 | `chat:send`, `chat:close` |
| `app` | 앱 제어 | `app:quit`, `app:version` |

### 액션 네이밍

| 유형 | 동사 | 예시 |
|------|------|------|
| 조회 | `list`, `get` | `jobs:list`, `settings:get` |
| 수정 | `set`, `toggle` | `settings:set`, `jobs:toggle` |
| 실행 | `run`, `send` | `jobs:run`, `chat:send` |
| UI | `resize`, `close`, `show` | `window:resize` |

## 핸들러 등록 (Main Process)

### 파일: `src/main/ipc.ts`

```typescript
import { ipcMain } from "electron";
import type { JobActionResult, LaunchdJob } from "@shared/types";

export function registerIpcHandlers(): void {
  // 조회
  ipcMain.handle("jobs:list", async (): Promise<LaunchdJob[]> => {
    return listJobs();
  });

  // 액션 (파라미터 타입 명시)
  ipcMain.handle("jobs:toggle", async (_event, jobId: string): Promise<JobActionResult> => {
    return toggleJob(jobId);
  });

  // 복합 연산
  ipcMain.handle("focusMode:set", async (_event, focusMode: FocusMode): Promise<void> => {
    setFocusMode(focusMode);         // 저장
    updateFocusModeMonitor(focusMode); // 모니터링 시작
  });
}
```

### 규칙

1. **단일 파일에서 등록**: 모든 핸들러는 `registerIpcHandlers()`에서 등록
2. **반환 타입 명시**: `Promise<ReturnType>` 형태로 명확하게
3. **파라미터 타입**: `_event` 다음에 타입 명시 (`jobId: string`)
4. **에러 처리**: `JobActionResult` 형태로 통일

## 결과 타입

### 표준 응답 형식

```typescript
// shared/types.ts
interface JobActionResult {
  success: boolean;
  message: string;
}

// 사용
ipcMain.handle("jobs:toggle", async (_event, jobId: string): Promise<JobActionResult> => {
  try {
    await toggleJob(jobId);
    return { success: true, message: "작업이 전환되었습니다." };
  } catch (error) {
    return { success: false, message: error.message };
  }
});
```

## Preload 노출 (contextBridge)

### 파일: `src/preload/index.ts`

```typescript
import { contextBridge, ipcRenderer } from "electron";

const electronAPI = {
  // 채널: jobs:list → 메서드: listJobs
  listJobs: (): Promise<LaunchdJob[]> =>
    ipcRenderer.invoke("jobs:list"),

  // 채널: jobs:toggle → 메서드: toggleJob
  toggleJob: (jobId: string): Promise<JobActionResult> =>
    ipcRenderer.invoke("jobs:toggle", jobId),

  // 이벤트 구독 (cleanup 함수 반환)
  onWindowShow: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on("window:show", handler);
    return () => ipcRenderer.removeListener("window:show", handler);
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
export type ElectronAPI = typeof electronAPI;
```

### 네이밍 변환

| 채널 (kebab) | 메서드 (camelCase) |
|-------------|-------------------|
| `jobs:list` | `listJobs()` |
| `jobs:toggle` | `toggleJob(id)` |
| `focusMode:get` | `getFocusMode()` |
| `settings:set` | `setSettings(data)` |

## Renderer 사용

```typescript
// 직접 호출
const jobs = await window.electronAPI.listJobs();
const result = await window.electronAPI.toggleJob(jobId);

// 이벤트 구독
useEffect(() => {
  const unsubscribe = window.electronAPI.onWindowShow(() => {
    refresh();
  });
  return () => unsubscribe();
}, [refresh]);
```

## 타입 정의

### shared/types.ts

```typescript
// Discriminated Union (판별 유니온)
export type JobSchedule =
  | { type: "calendar"; weekdays?: number[]; hour?: number; minute?: number }
  | { type: "interval"; intervalSeconds: number }
  | { type: "keepAlive" }
  | { type: "unknown" };

// 표준 결과 타입
export interface JobActionResult {
  success: boolean;
  message: string;
}

// 데이터 타입
export interface LaunchdJob {
  id: string;
  label: string;
  name: string;
  schedule: JobSchedule;
  isLoaded: boolean;
  // ...
}
```

## 테스트 패턴

```typescript
// ipc.test.ts
import { ipcMain } from "electron";

vi.mock("electron", () => ({
  ipcMain: { handle: vi.fn() },
}));

const mockIpcHandle = ipcMain.handle as Mock;

function getHandler(channel: string) {
  const call = mockIpcHandle.mock.calls.find(c => c[0] === channel);
  return call?.[1];
}

test("jobs:list 핸들러", async () => {
  registerIpcHandlers();
  const handler = getHandler("jobs:list");
  const result = await handler({});
  expect(result).toEqual([...]);
});
```

## 주의사항

1. **윈도우 null 체크**: 핸들러 내에서 윈도우 참조 시 `isDestroyed()` 확인
2. **단방향 이벤트**: `ipcRenderer.on`은 cleanup 함수 필수 반환
3. **타입 일관성**: Main ↔ Preload ↔ Renderer 타입 동기화
4. **민감 정보**: Preload에서 노출하는 API 최소화
