---
name: version-bump
description: package.json 버전 범프 및 changelog 업데이트
---

# Version Bump

develop → main 릴리즈 PR 생성 전에 실행합니다.
`origin/main` 대비 develop에 쌓인 PR 목록을 GitHub API로 조회하여
CHANGELOG.md를 작성하고 package.json 버전을 범프합니다.

## 실행 조건

- **develop 브랜치에서 실행**
- develop → main PR을 만들기 직전에 수행

## 수행 작업

1. **범프 레벨 결정** (major/minor/patch)
2. **package.json 버전 업데이트**
3. **CHANGELOG.md에 새 버전 항목 추가**
4. **버전 범프 커밋 생성**

---

## 1. PR 목록 수집

`git log origin/main..HEAD --oneline`으로 커밋 목록을 추출하고,
커밋 메시지에서 `(#숫자)` 패턴으로 PR 번호를 수집한다.

각 PR 번호로 GitHub API를 호출하여 제목과 작성자를 가져온다:

```bash
gh pr view {PR번호} --json title,author --jq '{title: .title, author: .author.login}'
```

## 2. 범프 레벨 결정

수집한 PR 제목들을 분석:

| 조건 | 범프 | 예시 |
|------|------|------|
| PR 제목에 `BREAKING CHANGE` 포함 | **major** | 1.3.0 → 2.0.0 |
| `[Feat]` 타입이고 사용자에게 노출되는 새 기능 | **minor** | 1.3.0 → 1.4.0 |
| 그 외 (`[Fix]`, `[Refactor]`, `[Chore]` 등) | **patch** | 1.3.0 → 1.3.1 |

- 가장 높은 범프 레벨 선택 (major > minor > patch)

## 3. CHANGELOG.md 업데이트

루트의 `CHANGELOG.md` 파일에 새 버전 섹션을 **맨 위에** 추가한다:

```markdown
## [1.49.0] - 2026-03-02

- PR 제목 (by @username, #120)
- PR 제목 (by @username, #119)
- PR 제목 (by @username, #118)
```

### 작성 규칙

- PR 제목을 **그대로** 사용 (커밋 메시지 아님)
- `(by @작성자아이디, #PR번호)` 형식을 각 항목 끝에 추가
- 한국어로 된 PR 제목은 그대로 유지
- `chore`, `ci`, `docs` 성격의 PR은 제외

## 4. 커밋 생성

```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump version to {new_version}"
```

## 주의사항

- 버전 범프 커밋은 develop → main PR의 **마지막 커밋**이어야 한다
- `gh` CLI가 설치되어 있어야 한다 (`gh auth status`로 인증 확인)
- PR이 없는 커밋(직접 커밋)은 CHANGELOG에서 제외한다
