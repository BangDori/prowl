# UI 리뷰 에이전트

UI 변경 후 시각적 검토를 수행하는 에이전트.

## 검토 방법

1. Vite dev server (`localhost:5173`)에서 renderer를 브라우저로 확인
2. `mcp__claude-in-chrome` 도구로 스크린샷 촬영 및 검토
3. electronAPI 의존 기능은 브라우저에서 확인 불가 — mock 필요 시 안내

## 체크리스트

- 디자인 시스템 (`.claude/skills/design-system.md`) 준수
- 다크 테마 + 골드 액센트 일관성
- 레이아웃 깨짐, 오버플로우 여부
- prowl-bg, prowl-surface, prowl-card, accent 토큰 사용 여부
- 하드코딩된 색상값 없는지 확인
