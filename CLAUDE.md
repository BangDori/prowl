# Prowl - Project Guide

macOS 메뉴바에서 launchd 백그라운드 작업을 관리하는 Electron 앱

## Quick Commands

```bash
pnpm dev        # 개발 모드 (main + renderer 동시)
pnpm build      # 프로덕션 빌드
pnpm start      # 빌드된 앱 실행
pnpm package    # DMG 패키징
```

## Architecture

```
Main Process (Electron)     Renderer Process (React)
┌─────────────────────┐     ┌─────────────────────┐
│  src/main/          │     │  src/renderer/      │
│  ├── index.ts       │     │  ├── App.tsx        │
│  ├── tray.ts        │ IPC │  ├── components/    │
│  ├── ipc.ts         │◄───►│  └── hooks/         │
│  └── services/      │     │                     │
│      ├── launchd.ts │     └─────────────────────┘
│      ├── plist-parser.ts        ▲
│      ├── log-reader.ts          │
│      └── settings.ts            │
└─────────────────────┘     ┌─────┴─────┐
         ▲                  │ preload/  │
         │                  │ index.ts  │
         ▼                  └───────────┘
┌─────────────────────┐
│  ~/Library/         │
│  LaunchAgents/      │
│  com.claude.*.plist │
└─────────────────────┘
```

## Key Files

| 파일 | 역할 |
|------|------|
| `src/main/services/launchd.ts` | launchctl 명령어 래핑 (load/unload/start) |
| `src/main/services/plist-parser.ts` | plist 파일에서 스케줄/경로 추출 |
| `src/main/services/settings.ts` | 앱 설정 및 작업 커스터마이징 저장 |
| `src/main/services/log-reader.ts` | 로그 파일 읽기, 마지막 실행 정보 추출 |
| `src/main/ipc.ts` | IPC 핸들러 등록 (jobs:list, jobs:toggle, etc.) |
| `src/main/tray.ts` | menubar 패키지로 트레이 아이콘 생성 |
| `src/preload/index.ts` | contextBridge로 electronAPI 노출 |
| `src/shared/types.ts` | LaunchdJob, JobSchedule, JobCustomization 등 공유 타입 |

## IPC Channels

| 채널 | 설명 | 반환 타입 |
|------|------|----------|
| `jobs:list` | 모든 작업 목록 | `LaunchdJob[]` |
| `jobs:refresh` | 작업 목록 새로고침 | `LaunchdJob[]` |
| `jobs:toggle` | 활성화/비활성화 토글 | `JobActionResult` |
| `jobs:run` | 수동 실행 | `JobActionResult` |
| `jobs:logs` | 로그 내용 조회 | `LogContent` |
| `jobs:getCustomizations` | 모든 작업 커스터마이징 조회 | `JobCustomizations` |
| `jobs:setCustomization` | 작업 커스터마이징 저장 | `void` |

## Job Customization

사용자가 UI에서 직접 작업의 아이콘, 이름, 설명을 편집할 수 있습니다.
커스터마이징 데이터는 `electron-store`에 저장되며, plist 파일에는 영향을 주지 않습니다.

```typescript
interface JobCustomization {
  displayName?: string;  // 사용자 지정 이름
  icon?: string;         // 사용자 지정 아이콘 (이모지)
  description?: string;  // 사용자 지정 설명
}

type JobCustomizations = Record<string, JobCustomization>;
```

## launchd plist 경로

- 디렉토리: `~/Library/LaunchAgents/`
- 패턴: `com.claude.*.plist`

## Build Configuration

- **Main**: TypeScript → `dist/main/` (tsconfig.main.json)
- **Renderer**: Vite + React → `dist/renderer/` (vite.config.ts)
- **Preload**: TypeScript → `dist/preload/`

## 개발 시 주의사항

1. **isDev 판단**: `process.argv.includes('--dev')` 또는 `ELECTRON_DEV=true`
2. **menubar 패키지**: 트레이 아이콘 클릭 시 팝업 창 자동 표시
3. **Dock 숨김**: `app.dock?.hide()` (macOS에서 Dock 아이콘 없음)
4. **단일 인스턴스**: `app.requestSingleInstanceLock()` 사용

## Types

```typescript
interface LaunchdJob {
  id: string;           // label과 동일
  label: string;        // com.claude.daily-retrospective
  name: string;         // daily-retrospective
  description: string;  // 스크립트 @description 또는 기본값
  icon: string;         // 스크립트 @icon 또는 ⚙️
  plistPath: string;    // plist 파일 경로
  scriptPath: string;   // 실행 스크립트 경로
  logPath: string | null;
  schedule: JobSchedule;
  scheduleText: string; // "매주 금 11:00"
  isLoaded: boolean;    // launchctl list에 있는지
  lastRun: LastRunInfo | null;
}

interface JobSchedule {
  type: 'calendar' | 'interval' | 'keepAlive' | 'unknown';
  weekdays?: number[];  // 0=일, 1=월, ...
  hour?: number;
  minute?: number;
  intervalSeconds?: number;
}
```
