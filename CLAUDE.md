# Prowl

macOS 메뉴바에서 launchd 작업을 관리하는 Electron 앱 (Main/Renderer IPC 구조)

## Commands

```bash
bun run dev        # 개발 모드
bun run build      # 프로덕션 빌드
bun run test       # 테스트
bun run lint       # biome 린트
```

## Path Aliases

| Alias | 경로 |
|-------|------|
| `@main/*` | `src/main/*` |
| `@renderer/*` | `src/renderer/*` |
| `@shared/*` | `src/shared/*` |

## Build

- Main: TypeScript → `dist/main/`
- Renderer: Vite + React → `dist/renderer/`
- Preload: TypeScript → `dist/preload/`

## 주의사항

- `isDev`: `process.argv.includes('--dev')` 또는 `ELECTRON_DEV=true`
- menubar 패키지로 트레이 팝업 (Dock 숨김, 단일 인스턴스)
- 스플래시: 앱 실행 → 4.5초 애니메이션 → 트레이 표시

## IPC Safety

- IPC 스키마 Single Source of Truth: `src/shared/ipc-schema.ts`
- Mutation 채널은 `IpcResult { success, error? }` 반환 필수
- Fire-and-forget(quit, resize, navigate)만 void 허용
- **Date 객체는 IPC 통과 불가** — ISO 8601 문자열 사용
- plist 파싱은 Zod `safeParse` 사용 (`as` 캐스팅 금지)

## Data Fetching

- TanStack Query 사용. 쿼리 키: `src/renderer/queries/keys.ts`
- 읽기: `useQuery`, 쓰기: `useMutation`
- mutation 성공 → `invalidateQueries`
- **컴포넌트에서 `window.electronAPI` 직접 호출 금지** — hooks 사용

## File Size

- 파일당 최대 300줄
- 200줄 초과 컴포넌트 → 서브컴포넌트 추출
- 100줄 초과 훅 → utils로 순수 로직 분리

## Error Handling

- 대시보드 각 섹션은 `ErrorBoundary`로 래핑 (크래시 격리)

## File Header

- 모든 `.ts`/`.tsx` 파일 첫 줄에 한 줄 JSDoc 설명 필수: `/** 파일 목적 설명 */`
- 새 파일 생성 시 반드시 포함, PR 리뷰 시 누락 체크

## Conventions

- 커밋: commit 스킬 사용
- UI: design-system 스킬 참고
- IPC 추가/수정: ipc-development 스킬 참고
- 데이터 페칭 패턴: data-fetching 스킬 참고
- 도메인 모델: `docs/domain-model.md`
- 네이밍: `docs/naming-convention.md`
- 컴포넌트 패턴: `docs/component-patterns.md`
