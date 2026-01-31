---
name: implement
description: 계획 → 구현 → 검증 자동 수행
---

# 기능 구현

기능 구현 요청 시 계획 → 구현 → 검증을 자동으로 수행한다.
각 Phase에서 `.claude/agents/`의 서브에이전트 지침을 따른다.

## 서브에이전트 역할 매핑

| Phase | 에이전트 | 파일 |
|-------|---------|------|
| 계획 | planner | `.claude/agents/planner.md` |
| 구현 | implementer | `.claude/agents/implementer.md` |
| 반복 검증 | loop-runner | `.claude/agents/loop-runner.md` |
| 테스트 작성 | test-writer | `.claude/agents/test-writer.md` |
| UI 검토 | ui-reviewer | `.claude/agents/ui-reviewer.md` |
| 구조 검토 | architect | `.claude/agents/architect.md` |

**각 Phase 시작 전 해당 에이전트 파일을 읽고 지침을 따른다.**

## 실행 흐름

### Phase 1: 정보 수집

AskUserQuestion으로 최소한의 필수 정보를 확인:
- 기능의 구체적인 동작 (모호할 경우만)
- UI 변경 여부
- 우선순위 (빠른 구현 vs 완성도)

이미 명확한 요청이면 질문 없이 Phase 2로 넘어간다.

### Phase 2: 계획 (`planner` 에이전트 지침 따름)

1. `.claude/agents/planner.md`를 읽는다
2. planner 지침에 따라 관련 코드를 탐색
3. `.context/plan.md`에 계획 작성:

```markdown
# 구현 계획: [기능명]

## 변경 대상
- `src/main/services/xxx.ts` — 이유
- `src/renderer/components/xxx.tsx` — 이유

## IPC 변경
- [ ] 신규 채널: `jobs:newChannel` (또는 "없음")
- [ ] main/ipc.ts
- [ ] preload/index.ts
- [ ] renderer/global.d.ts

## 성공 기준
- [ ] pnpm test 통과
- [ ] pnpm build:main 통과
- [ ] [기능별 구체적 기준]

## 테스트 계획
- `xxx.test.ts`에 [N]개 테스트 추가
```

4. 사용자에게 계획을 보여주고 AskUserQuestion으로 승인을 받는다

### Phase 3: 구현 + 검증 루프 (`implementer` + `loop-runner` + `test-writer` 지침 따름)

승인 후:
1. `.claude/agents/implementer.md`를 읽고 구현 규칙 확인
2. `.claude/agents/test-writer.md`를 읽고 테스트 작성 규칙 확인
3. `.claude/agents/loop-runner.md`의 **Ralph 패턴**으로 실행:

```
반복 (최대 5회):
  1. 코드 작성/수정 (implementer 지침)
  2. 관련 테스트 작성/수정 (test-writer 지침)
  3. pnpm test 실행
  4. pnpm build:main 실행
  5. 전부 통과 → Phase 4로
     하나라도 실패 → 에러 분석 후 1로
```

### Phase 3.5: 추가 검증 (해당 시에만)

- **UI 변경이 있으면**: `.claude/agents/ui-reviewer.md`를 읽고 디자인 시스템 준수 확인
- **구조적 변경이 있으면**: `.claude/agents/architect.md`를 읽고 아키텍처 영향 확인

### Phase 4: 완료 보고

- 변경된 파일 목록
- 테스트 결과 요약
- plan.md의 성공 기준 체크 상태

## 규칙

- 계획에 없는 파일은 건드리지 않는다
- 테스트를 삭제/skip하여 통과시키는 것은 금지
- 성공 기준 자체를 수정하는 것은 금지
- 5회 실패 시 중단하고 원인 보고
- UI 변경 시 `.claude/skills/design-system.md` 참조
- IPC 변경 시 반드시 세 곳 동시 수정
