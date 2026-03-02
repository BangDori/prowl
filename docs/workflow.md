# 개발 워크플로우

이 프로젝트는 **에이전트(Claude)와 협업**하는 방식으로 개발한다.
개발자는 방향을 결정하고, 에이전트가 구현·커밋·PR을 처리한다.

## 브랜치 전략

```
main ← develop ← feature 브랜치
```

- `main`: 릴리즈 브랜치. GitHub Release가 여기서 생성됨
- `develop`: 통합 브랜치. 모든 feature는 여기로 merge
- `feature/*`: 기능 단위 작업 브랜치

---

## 기능 개발 흐름

### 개발자가 하는 것

1. feature 브랜치 생성 (Conductor worktree 또는 `git checkout -b feat/xxx develop`)
2. 에이전트에게 구현 요청
3. 에이전트가 올린 PR 리뷰 & merge

### 에이전트가 하는 것 (`/create-pr` 스킬)

1. 변경사항 파악
2. changeset 추가 (`bun changeset`) — 기능/버그 수정인 경우
3. 커밋 & push
4. develop 대상으로 PR 생성

### changeset 판단 기준

에이전트가 자동으로 판단한다. 개발자는 설명이 사용자 관점으로 작성됐는지만 확인한다.

| 변경 종류 | 범프 | 예시 |
|-----------|------|------|
| 하위 호환 불가 변경 | `major` | API 제거, 데이터 마이그레이션 필요 |
| 사용자에게 노출되는 새 기능 | `minor` | 새 UI 기능, 새 단축키 |
| 버그 수정, 내부 개선 | `patch` | 오류 수정, 성능 개선, 리팩토링 |
| `chore` / `ci` / `docs`만 변경 | 생략 | 워크플로우 수정, 문서 업데이트 |

---

## 버전 관리 자동화

feature PR이 develop에 merge되면 나머지는 **전부 자동**이다.

```
feature PR merge → develop
    ↓
changesets-bot이 "Version Packages" PR 자동 생성
(package.json 버전 bump + CHANGELOG.md 업데이트 포함)
    ↓
개발자가 "Version Packages" PR merge
    ↓
develop → main PR 생성 & merge
    ↓
release.yml 트리거 → GitHub Release + Homebrew Cask 업데이트
```

### Version Packages PR

changesets-bot이 자동으로 만드는 PR. 직접 편집하지 않는다.
여러 feature가 쌓일수록 하나의 PR에 합산되어 업데이트된다.

```diff
// package.json
- "version": "1.48.2"
+ "version": "1.49.0"

// CHANGELOG.md
+ ## 1.49.0
+ - Task Manager 드래그 앤 드롭 기능 추가 (#119)
+ - 날짜 미정 태스크 정렬 버그 수정 (#120)
```

---

## 릴리즈 흐름

`develop → main` PR merge 시 `release.yml`이 자동 실행:

1. `package.json` 버전이 최신 태그와 다른 경우에만 실행
2. `bun run package`로 `.dmg` / `.zip` 빌드
3. `CHANGELOG.md`에서 해당 버전 섹션 추출 → GitHub Release 노트
4. GitHub Release 생성 + 아티팩트 업로드
5. Homebrew Cask 자동 업데이트
