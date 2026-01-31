---
name: create-pr
description: PR 템플릿에 맞춰 Pull Request 생성
---

# Create PR

`.github/PULL_REQUEST_TEMPLATE.md` 템플릿을 따라 PR을 생성한다.

## 단계

1. `git status`와 `git log main..HEAD`로 변경사항 파악
2. 브랜치명이 컨벤션에 맞는지 확인 (맞지 않으면 `git branch -m`으로 변경)
3. **시멘틱 버저닝 (아래 섹션 참조)**
4. 리모트에 push (`git push -u origin HEAD`)
5. 템플릿에 맞춰 PR 본문 작성
6. `GITHUB_TOKEN= gh pr create`로 PR 생성 (workflow scope 오류 방지)

## 시멘틱 버저닝

PR 생성 전에 변경사항을 분석하여 package.json 버전을 자동 업데이트한다.

### 절차

1. 현재 package.json 버전이 이미 릴리스되었는지 확인:
   - `git tag -l "v$(node -p "require('./package.json').version")"` 로 태그 존재 여부 확인
   - **태그가 없으면 현재 버전이 아직 미릴리스 상태이므로 버저닝을 건너뛴다**
2. `git log main..HEAD --oneline`로 커밋 메시지 수집
3. 커밋 타입 기반으로 범프 레벨 결정:

| 조건 | 범프 | 예시 |
|------|------|------|
| 커밋 본문에 `BREAKING CHANGE` 포함 | **major** | 1.3.0 → 2.0.0 |
| `feat` 타입이고 **사용자에게 노출되는 새 기능** 추가 | **minor** | 1.3.0 → 1.4.0 |
| 그 외 (`fix`, `enhance`, `refactor`, `docs`, `chore`, `test`, 또는 UI/내부 개선성 `feat`) | **patch** | 1.3.0 → 1.3.1 |

4. 가장 높은 범프 레벨을 선택 (major > minor > patch)
5. package.json의 `version` 필드를 업데이트
6. 별도 커밋 생성:
   ```
   chore: bump version to {new_version}
   ```

### 규칙

- main 브랜치 대비 커밋이 없으면 버저닝을 건너뛴다
- 버전 범프 커밋은 PR의 마지막 커밋이어야 한다
- `git log main..HEAD --format='%s%n%b'`로 제목과 본문 모두 확인하여 BREAKING CHANGE를 탐지한다
- `feat` 타입이라도 스플래시 화면, 내부 UI 개선, 리팩토링성 변경 등 **사용자에게 새로운 기능으로 노출되지 않는 경우** patch로 처리한다. minor는 새 IPC 채널, 새 화면/페이지, 새 사용자 인터랙션이 추가될 때만 적용한다.

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
