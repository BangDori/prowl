---
name: commit-pr
description: 커밋 생성 후 PR까지 한번에 처리
---

# Commit & Create PR

> **⚠️ 필수: PR 생성 시 반드시 `GITHUB_TOKEN= gh pr create ...` 형식으로 실행할 것.**
> GITHUB_TOKEN을 빈 값으로 설정하지 않으면 workflow scope 오류 또는 다른 계정으로 PR이 올라가는 문제가 발생한다.

변경사항을 논리적 단위로 나누어 커밋하고 PR을 생성합니다.

## 실행

1. 변경사항을 분석하여 **논리적 작업 단위로 분리**한다.
   - 커밋 히스토리만 보고도 작업 내용을 유추할 수 있어야 한다.
   - 예: 기능 추가, 버그 수정, 설정 변경 등 성격이 다른 변경은 별도 커밋
2. 각 단위별로 `/commit` 커맨드를 실행한다. $ARGUMENTS
3. 모든 변경사항이 커밋되면 `/version-bump` 커맨드를 실행한다. (버전 범프 필요 시)
4. `/create-pr` 커맨드를 실행한다.
