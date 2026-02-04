---
name: version-bump
description: package.json 버전 범프 및 changelog 업데이트
---

# Version Bump

package.json 버전을 범프하고 CHANGELOG.md에 변경 내역을 추가합니다.

## 수행 작업

1. **버전 범프 필요 여부 확인**
2. **범프 레벨 결정** (major/minor/patch)
3. **package.json 버전 업데이트**
4. **CHANGELOG.md에 새 버전 항목 추가**
5. **버전 범프 커밋 생성**

## 버전 범프 조건

다음 조건을 **모두** 만족해야 버전 범프를 수행한다:

1. 현재 package.json 버전이 이미 릴리스됨 (태그 존재):
   ```bash
   git tag -l "v$(node -p "require('./package.json').version")"
   ```
2. main 브랜치 대비 커밋이 존재
3. 앱 코드(`src/`)나 빌드 설정(`package.json`, `tsconfig`, `vite.config` 등)에 변경이 있음
   - `.claude/`, `.github/`, `docs/`, `.gitignore` 등만 변경된 경우 건너뜀

## 범프 레벨 결정

`git log main..HEAD --format='%s%n%b'`로 커밋 메시지를 분석:

| 조건 | 범프 | 예시 |
|------|------|------|
| 커밋 본문에 `BREAKING CHANGE` 포함 | **major** | 1.3.0 → 2.0.0 |
| `feat` 타입이고 **사용자에게 노출되는 새 기능** 추가 | **minor** | 1.3.0 → 1.4.0 |
| 그 외 (`fix`, `enhance`, `refactor`, `chore`, `test`, 또는 내부 개선성 `feat`) | **patch** | 1.3.0 → 1.3.1 |

- 가장 높은 범프 레벨 선택 (major > minor > patch)
- `feat`라도 스플래시, 내부 UI 개선 등은 patch

## CHANGELOG.md 업데이트

루트의 `CHANGELOG.md` 파일에 새 버전 섹션을 **맨 위에** 추가한다:

```markdown
## [1.9.0] - 2025-02-04
- 변경사항 1
- 변경사항 2

## [1.8.0] - 2025-02-03
...
```

### changes 작성 규칙

- 커밋 메시지를 기반으로 **사용자 관점**에서 요약
- 기술적 세부사항보다 **기능/개선 내용** 위주로
- 한국어로 간결하게 작성
- 불필요한 커밋 (lint fix, typo 등)은 제외

## 커밋 생성

```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump version to {new_version}"
```

## 주의사항

- 버전 범프 커밋은 PR의 **마지막 커밋**이어야 한다
- `/create-pr` 실행 전에 이 커맨드를 먼저 실행
- 이미 미릴리스 버전이면 (태그 없으면) 건너뛴다
