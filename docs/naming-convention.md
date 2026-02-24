# Naming Convention

프로젝트 전체에서 일관된 네이밍을 위한 규칙.

## 파일명

| 분류 | 규칙 | 예시 |
|------|------|------|
| 일반 TypeScript | kebab-case | `chat-tools.ts`, `task-reminder.ts` |
| React 컴포넌트 | PascalCase | `TaskItem.tsx`, `ChatRoomList.tsx` |
| 테스트 파일 | 원본명 + `.test` | `chat.test.ts`, `settings.test.ts` |
| 타입 정의 | kebab-case | `types.ts`, `assets.d.ts` |

```
// Good
src/main/services/chat-tools.ts
src/renderer/components/TaskItem.tsx

// Bad
src/main/services/ChatTools.ts       // Non-React는 kebab-case
src/renderer/components/task-item.tsx // React는 PascalCase
```

## 함수 / 변수

| 분류 | 규칙 | 예시 |
|------|------|------|
| 함수 | camelCase | `listTasks()`, `toggleComplete()` |
| 변수 | camelCase | `taskList`, `lastMessage` |
| 불리언 | is/has/can 접두사 | `isCompleted`, `hasReminders` |
| 핸들러 | handle 접두사 | `handleClick`, `handleSave` |
| 훅 | use 접두사 | `useTasks`, `useChatRooms` |

```typescript
// Good
const isCompleted = true;
function handleToggle() {}
function useChatRooms() {}

// Bad
const completed = true;      // 불리언은 is 접두사
function toggle() {}         // 핸들러는 handle 접두사
function chatRooms() {}      // 훅은 use 접두사
```

## 상수

**규칙**: 관련 상수는 객체로 그룹화하고 `as const` 사용.

| 분류 | 규칙 | 예시 |
|------|------|------|
| 단일 상수 | UPPER_SNAKE_CASE | `POLL_INTERVAL_MS` |
| 그룹 상수 | UPPER_CASE 객체 | `WINDOW`, `SPLASH`, `TIME` |

```typescript
// Good - 그룹화된 상수
export const WINDOW = {
  WIDTH: 400,
  HEIGHT: 500,
  MAX_HEIGHT: 600,
} as const;

export const POLL_INTERVAL_MS = 30000;

// Bad - 비그룹화
export const WINDOW_WIDTH = 400;
export const WINDOW_HEIGHT = 500;
export const windowMaxHeight = 600;  // camelCase 금지
```

## IPC 채널

**규칙**: `도메인:액션` 형식, 액션은 kebab-case 사용.

| 패턴 | 설명 | 예시 |
|------|------|------|
| `도메인:동사` | 단순 액션 | `tasks:list`, `memory:add` |
| `도메인:get-명사` | 조회 | `chat-rooms:get-unread-counts` |
| `도메인:toggle-명사` | 토글 | `chat-rooms:toggle-favorite` |

```typescript
// Good
"tasks:list"
"chat-rooms:get"
"memory:add"
"focus-mode:get"

// Bad
"tasks:listAll"             // camelCase 금지
"chatRooms"                 // 콜론 구분자 필수
"memory:add_item"           // snake_case 금지
```

### 현재 채널 마이그레이션 필요

다음 채널들은 kebab-case로 변경 필요:

| 현재 | 변경 후 |
|------|---------|
| `shell:showInFolder` | `shell:show-in-folder` |
| `shell:openExternal` | `shell:open-external` |
| `focusMode:get` | `focus-mode:get` |
| `focusMode:set` | `focus-mode:set` |

## 타입 / 인터페이스

**규칙**: PascalCase, 접미사로 용도 표현.

| 분류 | 접미사 | 예시 |
|------|--------|------|
| 데이터 모델 | 없음 | `Task`, `ChatMessage`, `Memory` |
| 요약 | Summary | `ChatRoomSummary` |
| 설정 | Settings/Config | `AppSettings`, `ChatConfig` |
| Props | Props | `TaskItemProps`, `ReminderPickerProps` |

```typescript
// Good
interface Task { ... }
interface ChatRoomSummary { ... }
type FocusMode = "normal" | "focus";

// Bad
interface task { ... }          // PascalCase 필수
interface ITask { ... }         // I 접두사 금지
interface TaskInterface { ... } // Interface 접미사 금지
```

## 요약

| 대상 | 규칙 |
|------|------|
| 파일 (Non-React) | `kebab-case.ts` |
| 파일 (React) | `PascalCase.tsx` |
| 함수/변수 | `camelCase` |
| 상수 | `UPPER_SNAKE_CASE` 또는 그룹 객체 |
| IPC 채널 | `domain:kebab-action` |
| 타입/인터페이스 | `PascalCase` |
