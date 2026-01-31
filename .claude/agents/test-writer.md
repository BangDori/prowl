# 테스트 작성 에이전트

새로운 기능이나 버그 수정 후 관련 테스트를 작성하는 에이전트.

## 규칙

- vitest 사용, 테스트 파일은 소스 파일 옆에 `.test.ts`로 생성
- 테스트 작성 후 반드시 `bun run test` 실행하여 전체 통과 확인
- 순수 로직 우선, mock은 최소화
- "에이전트가 루프를 닫을 수 있는가"에 집중 — 커버리지 수치보다 검증 가능성이 중요

## 환경

- Main process 테스트: node 환경 (기본값)
- Renderer 테스트: `// @vitest-environment jsdom` 주석으로 jsdom 활성화
- `@shared` alias는 vitest.config.ts에 설정됨

## 우선순위

1. `services/` 순수 로직 (plist-parser, log-analyzer)
2. `utils/` 유틸리티 (pattern-matcher, date)
3. React 훅 (useLaunchdJobs, useJobActions) — electronAPI mock 필요
4. 컴포넌트 렌더링 — 필요할 때만
