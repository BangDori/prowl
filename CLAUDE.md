# Prowl - Project Guide

macOS 메뉴바에서 launchd 백그라운드 작업을 관리하는 Electron 앱

## Quick Commands

```bash
bun run dev        # 개발 모드 (main + renderer 동시)
bun run build      # 프로덕션 빌드
bun run start      # 빌드된 앱 실행
bun run package    # DMG 패키징
```

## Architecture

```
Main Process (Electron)          Renderer Process (React)
┌────────────────────────┐       ┌─────────────────────┐
│  src/main/             │       │  src/renderer/      │
│  ├── index.ts          │       │  ├── App.tsx        │
│  ├── tray.ts           │  IPC  │  ├── components/    │
│  ├── splash.ts         │◄─────►│  ├── hooks/         │
│  ├── ipc.ts            │       │  └── utils/         │
│  ├── constants.ts      │       │
│  ├── utils/            │       │      └── date.ts    │
│  │   ├── command.ts    │       └─────────────────────┘
│  │   └── pattern-matcher.ts           ▲
│  └── services/         │       ┌──────┴──────┐
│      ├── launchd.ts    │       │  preload/   │
│      ├── plist-parser.ts       │  index.ts   │
│      ├── log-reader.ts │       └─────────────┘
│      ├── log-analyzer.ts
│      └── settings.ts   │
└────────────────────────┘
         ▲
         │              ┌─────────────────────┐
         ▼              │  src/shared/        │
┌─────────────────────────┐  │  ├── types.ts       │
│  ~/Library/LaunchAgents │  │  └── constants.ts   │
│  *.plist                │  └─────────────────────┘
└─────────────────────────┘
```

## Key Files

| 파일                                | 역할                                      |
| ----------------------------------- | ----------------------------------------- |
| `splash.html`                       | 스플래시 화면 UI (SVG 고양이 눈 + 타이포그래피) |
| `src/main/splash.ts`                | 스플래시 윈도우 생성/디졸브/닫기          |
| `src/main/constants.ts`             | 상수 정의 (매직 넘버, 로그 패턴 등)       |
| `src/main/utils/command.ts`         | launchctl 명령어 실행 유틸리티            |
| `src/main/utils/pattern-matcher.ts` | 패턴 매칭 유틸리티                        |
| `src/main/services/launchd.ts`      | launchctl 명령어 래핑 (load/unload/start) |
| `src/main/services/plist-parser.ts` | plist 파일에서 스케줄/경로 추출           |
| `src/main/services/log-reader.ts`   | 로그 파일 읽기                            |
| `src/main/services/log-analyzer.ts` | 로그 분석 (성공/실패 판단)                |
| `src/main/services/settings.ts`     | 앱 설정 및 작업 커스터마이징 저장         |
| `src/main/ipc.ts`                   | IPC 핸들러 등록                           |
| `src/main/tray.ts`                  | menubar 패키지로 트레이 아이콘 생성       |
| `src/preload/index.ts`              | contextBridge로 electronAPI 노출          |
| `src/shared/types.ts`               | 공유 타입 정의                            |
| `src/shared/constants.ts`           | 공유 상수 (main/renderer 공통)            |
| `src/renderer/utils/date.ts`        | 날짜/시간 포맷 유틸리티                   |

## IPC Channels

| 채널                     | 설명                        | 반환 타입           |
| ------------------------ | --------------------------- | ------------------- |
| `jobs:list`              | 모든 작업 목록              | `LaunchdJob[]`      |
| `jobs:refresh`           | 작업 목록 새로고침          | `LaunchdJob[]`      |
| `jobs:toggle`            | 활성화/비활성화 토글        | `JobActionResult`   |
| `jobs:run`               | 수동 실행                   | `JobActionResult`   |
| `jobs:logs`              | 로그 내용 조회              | `LogContent`        |
| `jobs:getCustomizations` | 모든 작업 커스터마이징 조회 | `JobCustomizations` |
| `jobs:setCustomization`  | 작업 커스터마이징 저장      | `void`              |

## Job Customization

사용자가 UI에서 직접 작업의 아이콘, 이름, 설명을 편집할 수 있습니다.
커스터마이징 데이터는 `electron-store`에 저장되며, plist 파일에는 영향을 주지 않습니다.

```typescript
interface JobCustomization {
  displayName?: string; // 사용자 지정 이름
  icon?: string; // 사용자 지정 아이콘 (이모지)
  description?: string; // 사용자 지정 설명
}

type JobCustomizations = Record<string, JobCustomization>;
```

## launchd plist 경로

- 디렉토리: `~/Library/LaunchAgents/`
- 패턴: 설정에서 지정 (기본값: 모든 plist)

## Build Configuration

- **Main**: TypeScript → `dist/main/` (tsconfig.main.json)
- **Renderer**: Vite + React → `dist/renderer/` (vite.config.ts)
- **Preload**: TypeScript → `dist/preload/`

## 개발 시 주의사항

1. **isDev 판단**: `process.argv.includes('--dev')` 또는 `ELECTRON_DEV=true`
2. **menubar 패키지**: 트레이 아이콘 클릭 시 팝업 창 자동 표시
3. **Dock 숨김**: `app.dock?.hide()` (macOS에서 Dock 아이콘 없음)
4. **단일 인스턴스**: `app.requestSingleInstanceLock()` 사용
5. **스플래시 화면**: 앱 실행 → 스플래시(4.5초) → 파티클 디졸브 → 트레이 아이콘 표시

## Types

```typescript
interface LaunchdJob {
  id: string; // label과 동일
  label: string; // com.claude.daily-retrospective
  name: string; // daily-retrospective
  description: string; // 기본값: "설명 없음" (커스터마이징 가능)
  icon: string; // 기본값: ⚙️ (커스터마이징 가능)
  plistPath: string; // plist 파일 경로
  scriptPath: string; // 실행 스크립트 경로
  logPath: string | null;
  schedule: JobSchedule;
  scheduleText: string; // "매주 금 11:00"
  isLoaded: boolean; // launchctl list에 있는지
  lastRun: LastRunInfo | null;
}

// 판별 유니온 타입
type JobSchedule =
  | { type: "calendar"; weekdays?: number[]; hour?: number; minute?: number }
  | { type: "interval"; intervalSeconds: number }
  | { type: "keepAlive" }
  | { type: "unknown" };
```

## Design System

UI 작업 시 `.claude/skills/design-system.md`를 참조하여 일관된 디자인 시스템을 유지합니다.
- **테마**: 다크 기반 + 골드 액센트 (고양이 눈 컨셉)
- **핵심 토큰**: `prowl-bg`, `prowl-surface`, `prowl-card`, `accent`
- **규칙**: 다크 모드 우선, 커스텀 토큰 사용, 하드코딩 금지

## Code Organization Principles

- **상수**: 매직 넘버는 `constants.ts`에 정의
- **유틸리티**: 재사용 가능한 함수는 `utils/` 폴더에 분리
- **타입 안전성**: `Promise<any>` 대신 구체적인 타입 사용
- **SRP (단일 책임 원칙)**: 각 함수/모듈은 하나의 책임만 담당
