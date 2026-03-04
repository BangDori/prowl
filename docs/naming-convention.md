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

## 디렉토리 구조

**원칙: 도메인 기반 응집 (Feature Co-location)**

에이전트가 폴더 이름만 보고 작업 범위를 파악할 수 있어야 한다. 관련 파일은 같은 폴더에 배치하고, 훅은 해당 기능의 컴포넌트 폴더 안에 위치시킨다.

### Main 프로세스 (`src/main/`)

`services/`는 현재 flat 구조를 유지하되, **파일명 prefix로 도메인을 명시**한다.

```
src/main/
  services/
    chat.ts             # chat 도메인 진입점
    chat-rooms.ts       # chat 도메인 — 룸 관리
    chat-tools.ts       # chat 도메인 — AI 도구
    chat-tools-tasks.ts # chat 도메인 — AI 도구 > 태스크
    tasks.ts            # tasks 도메인 진입점
    task-reminder.ts    # tasks 도메인 — 알림
    memory.ts           # memory 도메인 진입점
    settings.ts         # settings 도메인 진입점
    oauth.ts            # auth 도메인 진입점
    ...
  windows/              # Electron 윈도우 관리 (도메인 아님)
  ipc.ts                # IPC 핸들러 등록
  index.ts              # 앱 진입점
```

파일명 prefix 규칙: `{도메인}.ts` (진입점) → `{도메인}-{역할}.ts` (세부)

```
# Good — prefix로 도메인 그룹 명확
chat.ts / chat-rooms.ts / chat-tools.ts / chat-tools-tasks.ts

# Bad — 도메인 불명확
rooms.ts / tools.ts / tasksTool.ts
```

### Renderer (`src/renderer/`)

컴포넌트와 해당 훅은 **같은 feature 폴더**에 위치시킨다. `hooks/` 폴더에 분리하지 않는다.

```
src/renderer/
  components/
    chat/
      ChatInputBar.tsx
      ChatRoomList.tsx
      MessageBubble.tsx
      useChatRooms.ts     # ✅ 훅은 feature 폴더 안에
      useChatMessages.ts  # ✅
    calendar/
      CalendarGrid.tsx
      TaskItem.tsx
      useTaskData.ts      # ✅
      useAgendaTasks.ts   # ✅
    files/
      useProwlFiles.ts    # ✅
    sections/
      MemorySection.tsx
      SettingsSection.tsx
      useMemory.ts        # ✅
      useSettings.ts      # ✅
  App.tsx
```

```
# Good — 훅이 feature 폴더 안에
src/renderer/components/chat/useChatRooms.ts

# Bad — 훅이 분리된 폴더에
src/renderer/hooks/useChatRooms.ts
```

> **현재 상태**: `src/renderer/hooks/`의 일부 훅이 아직 feature 폴더로 이전되지 않았다.
> 새로 작성하는 훅은 반드시 feature 폴더 안에 위치시키고, 기존 훅은 관련 작업 시 이전한다.

---

## 요약

| 대상 | 규칙 |
|------|------|
| 파일 (Non-React) | `kebab-case.ts` |
| 파일 (React) | `PascalCase.tsx` |
| 함수/변수 | `camelCase` |
| 상수 | `UPPER_SNAKE_CASE` 또는 그룹 객체 |
| IPC 채널 | `domain:kebab-action` |
| 타입/인터페이스 | `PascalCase` |
| Main 서비스 파일 | `{도메인}-{역할}.ts` (prefix로 도메인 그룹화) |
| Renderer 훅 | feature 폴더 안에 co-location (`hooks/` 분리 금지) |
