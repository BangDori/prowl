# Naming Convention

프로젝트 전체에서 일관된 네이밍을 위한 규칙.

## 파일명

| 분류 | 규칙 | 예시 |
|------|------|------|
| 일반 TypeScript | kebab-case | `log-reader.ts`, `pattern-matcher.ts` |
| React 컴포넌트 | PascalCase | `JobCard.tsx`, `LogViewer.tsx` |
| 테스트 파일 | 원본명 + `.test` | `launchd.test.ts`, `date.test.ts` |
| 타입 정의 | kebab-case | `types.ts`, `assets.d.ts` |

```
// Good
src/main/services/log-reader.ts
src/renderer/components/JobCard.tsx

// Bad
src/main/services/LogReader.ts      // Non-React는 kebab-case
src/renderer/components/job-card.tsx // React는 PascalCase
```

## 함수 / 변수

| 분류 | 규칙 | 예시 |
|------|------|------|
| 함수 | camelCase | `readLogContent()`, `toggleJob()` |
| 변수 | camelCase | `jobList`, `lastRun` |
| 불리언 | is/has/can 접두사 | `isLoaded`, `hasError` |
| 핸들러 | handle 접두사 | `handleClick`, `handleSubmit` |
| 훅 | use 접두사 | `useLaunchdJobs`, `useAutoResize` |

```typescript
// Good
const isRunning = true;
function handleToggle() {}
function useJobActions() {}

// Bad
const running = true;        // 불리언은 is 접두사
function toggle() {}         // 핸들러는 handle 접두사
function jobActions() {}     // 훅은 use 접두사
```

## 상수

**규칙**: 관련 상수는 객체로 그룹화하고 `as const` 사용.

| 분류 | 규칙 | 예시 |
|------|------|------|
| 단일 상수 | UPPER_SNAKE_CASE | `LOG_LINES_DEFAULT` |
| 그룹 상수 | UPPER_CASE 객체 | `WINDOW`, `SPLASH`, `TIME` |

```typescript
// Good - 그룹화된 상수
export const WINDOW = {
  WIDTH: 400,
  HEIGHT: 500,
  MAX_HEIGHT: 600,
} as const;

export const LOG_LINES_DEFAULT = 50;

// Bad - 비그룹화
export const WINDOW_WIDTH = 400;
export const WINDOW_HEIGHT = 500;
export const windowMaxHeight = 600;  // camelCase 금지
```

## IPC 채널

**규칙**: `도메인:액션` 형식, 액션은 kebab-case 사용.

| 패턴 | 설명 | 예시 |
|------|------|------|
| `도메인:동사` | 단순 액션 | `jobs:list`, `jobs:run` |
| `도메인:get-명사` | 조회 | `jobs:get-customizations` |
| `도메인:set-명사` | 저장 | `jobs:set-customization` |

```typescript
// Good
"jobs:list"
"jobs:get-customizations"
"settings:get"
"shell:show-in-folder"

// Bad
"jobs:getCustomizations"    // camelCase 금지
"jobsList"                  // 콜론 구분자 필수
"jobs:get_customizations"   // snake_case 금지
```

### 현재 채널 마이그레이션 필요

다음 채널들은 kebab-case로 변경 필요:

| 현재 | 변경 후 |
|------|---------|
| `jobs:getCustomizations` | `jobs:get-customizations` |
| `jobs:setCustomization` | `jobs:set-customization` |
| `shell:showInFolder` | `shell:show-in-folder` |
| `shell:openExternal` | `shell:open-external` |
| `focusMode:get` | `focus-mode:get` |
| `focusMode:set` | `focus-mode:set` |

## 타입 / 인터페이스

**규칙**: PascalCase, 접미사로 용도 표현.

| 분류 | 접미사 | 예시 |
|------|--------|------|
| 데이터 모델 | 없음 | `LaunchdJob`, `ChatMessage` |
| 액션 결과 | Result | `JobActionResult`, `ChatSendResult` |
| 설정 | Settings/Config | `AppSettings`, `FocusMode` |
| Props | Props | `JobCardProps`, `LogViewerProps` |

```typescript
// Good
interface LaunchdJob { ... }
interface JobActionResult { ... }
type JobSchedule = CalendarSchedule | IntervalSchedule;

// Bad
interface launchdJob { ... }     // PascalCase 필수
interface ILaunchdJob { ... }    // I 접두사 금지
interface LaunchdJobInterface { ... }  // Interface 접미사 금지
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
