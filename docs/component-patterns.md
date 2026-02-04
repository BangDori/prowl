# React Component Patterns

React 컴포넌트 작성 규칙

## 파일 구조

```typescript
// 1. Import
import type { LaunchdJob } from "@shared/types";
import { useState, useCallback } from "react";

// 2. Props 인터페이스 (JSDoc 필수)
interface JobCardProps {
  /** launchd 작업 정보 객체 */
  job: LaunchdJob;
  /** 사용자 정의 커스터마이징 */
  customization?: JobCustomization;
  /** 토글 진행 중 여부 */
  toggling?: boolean;
  /** 토글 버튼 클릭 핸들러 */
  onToggle: () => void;
}

// 3. 서브 컴포넌트 (필요시)
function StatusBadge({ status }: { status: string }) {
  return <span className="...">{status}</span>;
}

// 4. JSDoc + 메인 컴포넌트 (default export)
/**
 * 작업 카드 컴포넌트
 *
 * @example
 * <JobCard job={job} onToggle={handleToggle} />
 */
export default function JobCard({ job, customization, toggling, onToggle }: JobCardProps) {
  // 구현
}
```

## Props 인터페이스 규칙

```typescript
// Good - 모든 prop에 JSDoc 주석
interface ToggleSwitchProps {
  /** 현재 활성화 상태 */
  enabled: boolean;
  /** 상태 변경 핸들러 */
  onChange: () => void;
  /** 비활성화 여부 */
  disabled?: boolean;
}

// Bad - 주석 없음
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}
```

## Export 스타일

```typescript
// Good - default export
export default function JobCard() { ... }

// Bad - named export (컴포넌트)
export function JobCard() { ... }

// 타입은 named export OK
export type { JobCardProps };
```

## 커스텀 훅 패턴

### 파일 위치
`src/renderer/hooks/use{Name}.ts`

### 반환 타입 정의

```typescript
interface UseJobActionsResult {
  toggling: string | null;
  runningJobs: Set<string>;
  toggle: (jobId: string) => Promise<JobActionResult>;
  run: (jobId: string) => Promise<JobActionResult>;
}

export function useJobActions(onComplete?: () => void): UseJobActionsResult {
  // 구현
}
```

### 콜백 Ref 패턴 (stale closure 방지)

```typescript
export function useJobActions(onComplete?: () => void) {
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
  const unsubscribe = window.electronAPI.onWindowShow(refresh);

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
const [showLogs, setShowLogs] = useState(false);
const [logs, setLogs] = useState<LogContent | null>(null);
const [loadingLogs, setLoadingLogs] = useState(false);

const [isEditing, setIsEditing] = useState(false);
const [editForm, setEditForm] = useState({ displayName: "" });
```

### 상태 끌어올리기

```typescript
// Container (상태 관리)
function JobsSection() {
  const { jobs } = useLaunchdJobs();
  const actions = useJobActions(refresh);

  return <JobList jobs={jobs} actions={actions} />;
}

// Presentation (UI만)
function JobList({ jobs, actions }: JobListProps) {
  return jobs.map(job => <JobCard key={job.id} job={job} {...actions} />);
}
```

## 컴포넌트 계층

```
DashboardLayout (레이아웃)
├── SidebarItem (서브 컴포넌트)
└── JobsSection (컨테이너)
    └── JobList (프레젠테이션)
        └── JobCard (아이템)
            ├── LogViewer (조건부)
            └── ToggleSwitch (유틸리티)
```

| 유형 | 역할 | 예시 |
|------|------|------|
| Layout | 전체 구조 | `DashboardLayout` |
| Container | 상태/데이터 관리 | `JobsSection` |
| Presentation | 순수 UI | `JobList`, `JobCard` |
| Utility | 재사용 UI | `ToggleSwitch`, `StatusBadge` |

## 조건부 렌더링

```typescript
// 모드 전환
{isEditing ? (
  <EditForm onSave={handleSave} />
) : (
  <DisplayView onEdit={() => setIsEditing(true)} />
)}

// 로딩/에러/데이터
{loading ? (
  <Skeleton />
) : error ? (
  <ErrorMessage error={error} />
) : jobs.length === 0 ? (
  <EmptyState />
) : (
  <JobList jobs={jobs} />
)}
```

## 타입 안전성

### Discriminated Union

```typescript
type JobSchedule =
  | { type: "calendar"; hour: number; minute: number }
  | { type: "interval"; intervalSeconds: number }
  | { type: "keepAlive" };

// 타입 가드로 안전하게 처리
function formatSchedule(schedule: JobSchedule): string {
  switch (schedule.type) {
    case "calendar": return `${schedule.hour}:${schedule.minute}`;
    case "interval": return `Every ${schedule.intervalSeconds}s`;
    case "keepAlive": return "Always running";
  }
}
```

### Record 타입

```typescript
const NAV_LABELS: Record<NavItem, string> = {
  jobs: "Background Monitor",
  changelog: "Version History",
  settings: "Settings",
};
```
