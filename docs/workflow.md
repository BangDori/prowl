# 개발 워크플로우

## 브랜치 전략

```
main ← develop ← feature 브랜치
```

- `main`: 릴리즈 브랜치. GitHub Release가 여기서 생성됨
- `develop`: 통합 브랜치. 모든 feature는 여기로 merge
- `feature/*`: 기능 단위 작업 브랜치

## 기능 개발 흐름

### 1단계: 작업

```bash
git checkout -b feat/my-feature develop
# 기능 구현 + 커밋
```

### 2단계: changeset 추가

기능 추가, 버그 수정이 포함된 경우 반드시 실행한다.
`chore`, `ci`, `docs`만 변경한 경우 생략.

```bash
bun changeset
```

인터랙티브 CLI에서:
1. 패키지 선택: `prowl`
2. 범프 레벨 선택:

| 변경 종류 | 범프 |
|-----------|------|
| 하위 호환 불가 변경 | `major` |
| 사용자에게 노출되는 새 기능 | `minor` |
| 버그 수정, 내부 개선 | `patch` |

3. 설명 입력: **사용자 관점**에서 한국어로 간결하게
   - ✅ `Task Manager 드래그 앤 드롭 기능 추가`
   - ❌ `TaskDragHandler 컴포넌트 리팩토링`

```bash
git add .changeset/
git commit -m "chore: add changeset"
```

### 3단계: PR 생성

```bash
# target: develop
gh pr create --base develop
```

---

## 버전 관리 자동화

feature PR이 develop에 merge되면 나머지는 자동으로 처리된다.

```
feature PR merge → develop
    ↓
changesets-bot이 "Version Packages" PR 자동 생성
(package.json 버전 bump + CHANGELOG.md 업데이트 포함)
    ↓
"Version Packages" PR merge
    ↓
develop → main PR 생성 & merge
    ↓
release.yml 트리거 → GitHub Release + Homebrew Cask 업데이트
```

### Version Packages PR

changesets-bot이 자동으로 만드는 PR. 직접 수정하지 않는다.
여러 feature가 쌓이면 하나의 PR에 합산된다.

예시:
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
