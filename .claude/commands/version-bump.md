---
name: version-bump
description: feature PR에 changeset 파일 추가
---

# Changeset 추가

feature 작업 완료 후 PR 생성 전에 실행합니다.
`.changeset/` 파일을 생성하여 변경 내용과 버전 범프 레벨을 기록합니다.

> **버전 관리 방식 변경 안내**
> 이 프로젝트는 Changesets를 사용합니다.
> 버전 bump와 CHANGELOG는 changesets-bot이 자동으로 생성하는
> "Version Packages" PR을 통해 develop 브랜치에 반영됩니다.

---

## 브랜치 검증 (필수)

**가장 먼저** 현재 브랜치를 확인한다:

```bash
git branch --show-current
```

- feature 브랜치(`develop`이 아닌 브랜치)이면 계속 진행
- `develop` 또는 `main`이면 **즉시 중단**하고 아래 메시지를 출력:

```
❌ changeset은 feature 브랜치에서만 추가할 수 있습니다.
   feature 브랜치에서 작업 후 실행하세요.
```

---

## 수행 작업

1. **변경 내용 파악** — 이번 PR에서 어떤 기능/버그 수정이 있었는지 확인
2. **changeset 파일 생성**
3. **파일을 커밋에 포함**

---

## 1. changeset 파일 생성

```bash
bun changeset
```

인터랙티브 CLI가 실행되면:

1. 패키지 선택: `prowl` (스페이스로 선택 후 Enter)
2. 범프 레벨 선택:

| 변경 종류 | 범프 | 예시 |
|-----------|------|------|
| 하위 호환 불가 변경 | **major** | API 제거, 데이터 마이그레이션 필요 |
| 사용자에게 노출되는 새 기능 | **minor** | 새 UI 기능, 새 단축키 |
| 버그 수정, 내부 개선 | **patch** | 오류 수정, 성능 개선, 리팩토링 |

3. 설명 입력: **사용자 관점**에서 한국어로 간결하게 작성
   - 좋은 예: `Task Manager 드래그 앤 드롭 기능 추가`
   - 나쁜 예: `TaskDragHandler 컴포넌트 리팩토링`

실행 후 `.changeset/random-name.md` 파일이 생성된다.

## 2. 커밋에 포함

생성된 `.changeset/*.md` 파일을 PR 커밋에 포함시킨다:

```bash
git add .changeset/
git commit -m "chore: add changeset"
```

---

## 이후 자동화 흐름

```
feature PR → develop merge
    ↓
changesets-bot이 "Version Packages" PR 자동 생성/업데이트
    ↓
"Version Packages" PR merge → 버전 bump + CHANGELOG 자동 반영
    ↓
develop → main PR → release.yml → GitHub Release
```

## 주의사항

- changeset 파일 없이 PR을 올리면 changeset-bot이 경고 코멘트를 남김
- `chore`, `ci`, `docs`만 변경한 PR은 changeset 파일 불필요
