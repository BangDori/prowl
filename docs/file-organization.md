# File Organization Rules

파일 및 폴더 구조 원칙

## 디렉토리 구조

```
src/
├── main/      # Electron Main Process — OS 연동, 파일 I/O, 윈도우 관리
├── renderer/  # React UI — 렌더링, 사용자 입력
├── preload/   # contextBridge — IPC 브릿지만 담당
└── shared/    # Main/Renderer 공유 — 타입, IPC 스키마, 상수
```

## Utils vs Services

| 구분 | Utils | Services |
|------|-------|----------|
| 특징 | 순수 함수, 상태 없음 | 상태 관리, 사이드 이펙트 |
| 역할 | 단일 연산 | 비즈니스 로직 캡슐화 |
| 예시 | `date.ts`, `ipc-handler.ts` | `tasks.ts`, `settings.ts`, `chat.ts` |

```typescript
// utils/date.ts — 단순 헬퍼
export function toDateString(date: Date): string { ... }

// services/tasks.ts — 복합 로직
export async function toggleTaskComplete(date: string, taskId: string): Promise<IpcResult> {
  const tasks = await readTasks(date);
  const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
  await writeTasks(date, updated);
  return { success: true };
}
```

## 폴더 네이밍

- **복수형 사용**: `services/`, `utils/`, `components/`, `hooks/`, `windows/`
- **케밥 케이스**: 폴더명은 소문자 + 하이픈

## Index 파일 (Barrel Export)

**사용하는 경우:**
- `windows/index.ts` — 아키텍처 경계에서 re-export
- `shared/types/index.ts` — 타입 모듈 통합 export

**사용하지 않는 경우:**
- `services/`, `utils/`, `components/`, `hooks/` — 직접 경로로 import

```typescript
// Good
import { tasksService } from "@main/services/tasks";
import { useTaskActions } from "@renderer/hooks/useTaskActions";

// Bad — 불필요한 barrel export
import { tasksService } from "@main/services";
```

## 테스트 파일 위치

소스 파일과 같은 디렉토리에 `.test.ts` 접미사로 배치:

```
services/
├── tasks.ts
├── tasks.test.ts
├── settings.ts
└── settings.test.ts
```

## Shared 폴더 원칙

Main과 Renderer 모두 사용하는 코드만 배치:

```typescript
// shared/types/common.ts — IPC 계약, 공통 인터페이스
export interface Task { ... }
export interface IpcResult { success: boolean; error?: string }

// shared/ipc-schema.ts — 채널 파라미터/반환 타입 (Single Source of Truth)
export interface IpcInvokeSchema {
  "tasks:add-task": { params: [date: string, task: Task]; return: IpcResult };
  // ...
}

// shared/constants.ts — 양쪽에서 쓰는 상수
export const POLL_INTERVAL_MS = 30000;
```

## 프로세스별 책임

| 프로세스 | 책임 | 금지 |
|----------|------|------|
| Main | OS 연동, 파일 I/O, 윈도우 관리 | React, DOM 조작 |
| Renderer | UI 렌더링, 사용자 입력 | 직접 OS 접근 |
| Preload | IPC 브릿지 | 비즈니스 로직 |
