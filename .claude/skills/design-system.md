# Prowl Design System

UI 작업 시 아래 디자인 시스템을 반드시 참조하여 일관된 스타일을 유지합니다.

## 1. Base Colors (다크 테마 기반)

| 용도 | Tailwind Token | 색상 코드 |
|------|---------------|-----------|
| Deep Background | `prowl-bg` | `#0d0d0d` |
| Surface | `prowl-surface` | `#161616` |
| Card | `prowl-card` | `#1e1e1e` |
| Border | `prowl-border` | `#2a2a2a` |
| Border Hover | `prowl-border-hover` | `#3a3a3a` |

## 2. Accent (골드 / 고양이 눈)

| 용도 | Tailwind Token | 색상 코드 |
|------|---------------|-----------|
| Primary Accent | `accent` | `#f59e0b` |
| Accent Hover | `accent-hover` | `#fbbf24` |
| Accent Muted | `accent-muted` | `#b45309` |

## 3. 라이트 테마 (폴백)

| 용도 | Tailwind Token | 색상 코드 |
|------|---------------|-----------|
| Surface Light | `surface-light` | `#fafafa` |
| Card Light | `card-light` | `#ffffff` |

## 4. 효과

| 용도 | Tailwind Token | 값 |
|------|---------------|----|
| Glow Accent | `shadow-glow-accent` | `0 0 20px rgba(245, 158, 11, 0.15)` |
| Glow Success | `shadow-glow-success` | `0 0 10px rgba(34, 197, 94, 0.2)` |
| Glow Error | `shadow-glow-error` | `0 0 10px rgba(239, 68, 68, 0.2)` |

## 5. 컴포넌트 클래스 (globals.css)

| 클래스 | 용도 |
|--------|------|
| `.job-card` | 작업 카드 (hover 시 border-hover + shadow-lg) |
| `.btn-icon` | 아이콘 버튼 (hover 시 `text-gray-200`) |
| `.btn-primary` | 프라이머리 버튼 (`bg-blue-500 text-white`) |
| `.btn-ghost` | 고스트 버튼 (`text-gray-400` → hover `text-gray-200`) |
| `.input-field` | 인풋/셀렉트 (focus: `ring-blue-500/50`) |
| `.log-viewer` | 터미널 스타일 로그 뷰어 (`bg-black/90 text-green-400`) |
| `.toggle-switch` | 토글 스위치 (on: `bg-green-500`) |
| `.app-header` | 헤더 (`backdrop-blur-xl`) |
| `.skeleton` | 로딩 스켈레톤 |
| `.section-title` | 섹션 제목 (`tracking-wider text-gray-500`) |
| `.empty-state` | 빈 상태 안내 |

## 6. 적용 규칙

1. **다크 모드 우선**: `dark:` 접두사로 다크 모드 스타일 적용, 라이트는 폴백
2. **커스텀 토큰 사용**: prowl 계열 토큰으로 다크 테마 색상 통일
3. **하드코딩 금지**: 색상 값을 직접 입력하지 않고 반드시 Tailwind 토큰 사용
4. **일관된 호버**: 보더 `prowl-border` → `prowl-border-hover`, 텍스트 `gray-400` → `gray-200`
5. **accent 활용**: Moon 아이콘 활성 상태 등 강조 요소에 `accent` 계열 사용
