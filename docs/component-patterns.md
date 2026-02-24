# React Component Patterns

React 컴포넌트 작성 규칙

## 파일 구조

```typescript
// 1. Import
import type { Task } from "@shared/types";
import { useState } from "react";

// 2. Props 인터페이스 (JSDoc 필수)
interface TaskItemProps {
  /** 태스크 데이터 */
  task: Task;
  /** 완료 토글 핸들러 */
  onToggleComplete: () => void;
  /** 수정 핸들러 */
  onUpdate: (task: Task) => void;
  /** 삭제 핸들러 */
  onDelete: () => void;
}

// 3. 서브 컴포넌트 (필요시)
function CategoryBadge({ name, color }: { name: string; color: string }) {
  return <span style={{ backgroundColor: color }}>{name}</span>;
}

// 4. JSDoc + 메인 컴포넌트 (default export)
/**
 * 단일 태스크 행 컴포넌트
 *
 * @example
 * <TaskItem task={task} onToggleComplete={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} />
 */
export default function TaskItem({ task, onToggleComplete, onUpdate, onDelete }: TaskItemProps) {
  // 구현
}
```

## Props 인터페이스 규칙

```typescript
// Good - 모든 prop에 JSDoc 주석
interface ReminderPickerProps {
  /** 현재 리마인더 목록 */
  reminders: TaskReminder[];
  /** 변경 핸들러 */
  onChange: (reminders: TaskReminder[]) => void;
}

// Bad - 주석 없음
interface ReminderPickerProps {
  reminders: TaskReminder[];
  onChange: (reminders: TaskReminder[]) => void;
}
```

## Export 스타일

```typescript
// Good - default export
export default function TaskItem() { ... }

// Bad - named export (컴포넌트)
export function TaskItem() { ... }

// 타입은 named export OK
export type { TaskItemProps };
```

## 커스텀 훅 패턴

### 파일 위치
`src/renderer/hooks/use{Name}.ts`

### 반환 타입 정의

```typescript
interface UseChatRoomsResult {
  rooms: ChatRoomSummary[];
  isLoading: boolean;
  error: Error | null;
}

export function useChatRooms(): UseChatRoomsResult {
  // 구현
}
```

### 콜백 Ref 패턴 (stale closure 방지)

```typescript
export function useTaskActions(onComplete?: () => void) {
  const onCompleteRef = useRef(onComplete);

  // ref를 최신 상태로 유지
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // interval 내부에서 ref 사용
  const poll = useCallback(() => {
    // onCompleteRef.current?.() - 항상 최신 콜백 참조
  }, []); // 의존성 배열에 onComplete 불필요
}
```

### 정리(cleanup) 패턴

```typescript
useEffect(() => {
  const interval = setInterval(poll, 1000);
  const unsubscribe = window.electronAPI.onTasksChanged(refresh);

  return () => {
    clearInterval(interval);
    unsubscribe();
  };
}, [poll, refresh]);
```

## 상태 관리

### 로컬 상태 그룹화

```typescript
// Good - 논리적 그룹으로 정리
const [editing, setEditing] = useState(false);
const [title, setTitle] = useState(task.title);
const [description, setDescription] = useState(task.description ?? "");

const [addingCategory, setAddingCategory] = useState(false);
const [newCategoryName, setNewCategoryName] = useState("");
```

### 상태 끌어올리기

```typescript
// Container (상태 관리)
function CalendarView() {
  const { tasks } = useTasks(selectedDate);
  const { updateTask, deleteTask } = useTaskMutations();

  return <TaskList tasks={tasks} onUpdate={updateTask} onDelete={deleteTask} />;
}

// Presentation (UI만)
function TaskList({ tasks, onUpdate, onDelete }: TaskListProps) {
  return tasks.map(task => <TaskItem key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />);
}
```

## 컴포넌트 계층

```
CalendarView (컨테이너)
└── TaskList (프레젠테이션)
    └── TaskItem (아이템)
        └── ReminderPicker (유틸리티)

ChatView (컨테이너)
├── ChatRoomList (사이드바)
│   └── ChatRoomItem (아이템)
└── ChatPanel (메인)
    └── MessageBubble (아이템)
```

| 유형 | 역할 | 예시 |
|------|------|------|
| Container | 상태/데이터 관리 | `CalendarView`, `ChatView` |
| Presentation | 순수 UI | `TaskList`, `ChatRoomList` |
| Item | 단일 행/카드 | `TaskItem`, `ChatRoomItem` |
| Utility | 재사용 UI | `ReminderPicker`, `CategoryBadge` |

## 조건부 렌더링

```typescript
// 모드 전환
{editing ? (
  <TaskEditForm onSave={handleSave} onCancel={handleCancel} />
) : (
  <TaskDisplayView onEdit={() => setEditing(true)} />
)}

// 로딩/에러/데이터
{isLoading ? (
  <Skeleton />
) : error ? (
  <ErrorMessage error={error} />
) : tasks.length === 0 ? (
  <EmptyState />
) : (
  <TaskList tasks={tasks} />
)}
```

## 타입 안전성

### Discriminated Union

```typescript
type FocusMode = "normal" | "focus" | "deep";

function getFocusModeLabel(mode: FocusMode): string {
  switch (mode) {
    case "normal": return "일반";
    case "focus": return "집중";
    case "deep": return "딥포커스";
  }
}
```

### Record 타입

```typescript
const CATEGORY_COLORS: Record<string, string> = {
  업무: "#4A90E2",
  개인: "#7ED321",
  기타: "#9B9B9B",
};
```
