---
name: create-pr
description: PR 템플릿에 맞춰 Pull Request 생성
---

# Create PR

`.github/PULL_REQUEST_TEMPLATE.md` 템플릿을 따라 PR을 생성한다.

## 단계

1. `git status`와 `git log main..HEAD`로 변경사항 파악
2. 브랜치명이 컨벤션에 맞는지 확인 (맞지 않으면 `git branch -m`으로 변경)
3. **버전 범프 필요 시 `/version-bump` 실행** (PR 생성 전 마지막 커밋)
4. 리모트에 push (`git push -u origin HEAD`)
5. 템플릿에 맞춰 PR 본문 작성
6. `GITHUB_TOKEN= gh pr create`로 PR 생성 (workflow scope 오류 방지)

## 브랜치 컨벤션

| 타입 | 형식 | 예시 |
|------|------|------|
| feat | `feat/설명` | `feat/job-last-run-time` |
| fix | `fix/설명` | `fix/schedule-parse-error` |
| enhance | `enhance/설명` | `enhance/log-viewer-perf` |
| refactor | `refactor/설명` | `refactor/ipc-handlers` |
| test | `test/설명` | `test/vitest-setup` |
| chore | `chore/설명` | `chore/deps-update` |

브랜치명에 슬래시(`/`)가 반드시 포함되어야 한다.

## PR 제목 규칙

`[타입] 설명` 형식. 커밋 메시지 타입과 동일.

예시:
- `[Feat] 작업 카드에 마지막 실행 시간 표시`
- `[Fix] plist 파싱 시 빈 배열 처리`
- `[Test] vitest 테스트 환경 구축`

## 템플릿

```markdown
## Summary

- 변경사항 불렛 포인트

## 주요 작업

- **planner**: 구현 계획 수립
- **implementer**: 코드 작성
- **test-writer**: 유닛 테스트 N개 추가

## 검증

- [x] `bun run test` 통과 (N개 테스트)
- [x] `bun run build` 성공

```

## 필수 작성 항목

| 섹션 | 필수 | 가이드 |
|------|------|--------|
| Summary | O | WHAT을 불렛 포인트로 |
| 주요 작업 | O | 참여 서브에이전트 + 각각의 작업 내용 |
| 검증 | O | bun run test/build 결과 포함 |

## 규칙

- target branch: `main`
- base 브랜치를 checkout/merge 하지 않는다
- `bun run test`와 `bun run build`를 실행하여 결과를 검증 섹션에 기록한다
- **반드시 `GITHUB_TOKEN= gh pr create ...` 형식으로 실행** (다른 계정으로 PR 올라가는 것 방지)

---

## 실행

위 규칙에 따라 PR을 생성한다.
