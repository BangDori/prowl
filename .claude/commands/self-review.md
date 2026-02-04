---
name: self-review
description: 모든 에이전트를 호출해 변경사항 리뷰
---

# Self Review

현재 작업 브랜치의 변경사항을 `.claude/agents/` 폴더의 모든 에이전트 관점에서 리뷰한다.

## 실행 흐름

### Step 1: 변경사항 수집

```bash
git diff main...HEAD --name-only  # 변경된 파일 목록
git diff main...HEAD              # 실제 변경 내용
```

변경된 파일이 없으면 종료.

### Step 2: 에이전트별 병렬 리뷰

Task 도구로 다음 에이전트들을 **병렬로** 호출한다:

| 에이전트 | subagent_type | 검토 관점 |
|---------|---------------|----------|
| CTO | cto | 아키텍처 일관성, IPC 변경 정합성, 타입 안전성 |
| FE Lead | fe-lead | React 컴포넌트 패턴, 디자인 시스템 준수 |
| Electron Lead | electron-lead | Main process 구조, IPC 핸들러 |
| Platform Lead | platform-lead | macOS/launchd 연동 |
| UX Lead | ux-lead | UI/UX 일관성 |
| DevOps Lead | devops-lead | 빌드/테스트 영향 |
| Test Lead | test-lead | 테스트 커버리지, 테스트 품질 |
| Tech Writer | tech-writer | 문서 업데이트 필요 여부 |

**각 에이전트 호출 시 프롬프트:**

```
다음 변경사항을 [{에이전트명}] 관점에서 리뷰해주세요.

## 변경된 파일
{파일 목록}

## 변경 내용
{git diff 결과}

## 리뷰 요청
1. 담당 영역에서 문제가 있는지 확인
2. 수정이 필요하면 구체적인 위치와 이유 명시
3. 문제 없으면 "LGTM" 응답

응답 형식:
### [{에이전트명}] 리뷰 결과
- 상태: [LGTM / 수정 필요]
- 이슈: (있으면 목록)
- 권고: (있으면 목록)
```

### Step 3: 결과 종합

모든 에이전트 응답을 수집하여 다음 형식으로 출력:

```markdown
# Self Review 결과

## 요약
- 리뷰 대상 파일: N개
- LGTM: N명
- 수정 필요: N명

## 에이전트별 결과

### CTO
[결과]

### FE Lead
[결과]

...

## 수정 필요 사항 (있는 경우)

| 에이전트 | 파일 | 이슈 | 권고 |
|---------|------|------|------|
| ... | ... | ... | ... |

## 결론
[전원 LGTM이면 "커밋 진행 가능", 아니면 "수정 후 재리뷰 권장"]
```

## 규칙

- 변경된 파일이 없으면 "리뷰할 변경사항이 없습니다" 출력 후 종료
- 모든 에이전트를 **병렬로** 호출하여 속도 최적화
- 에이전트가 자신의 담당 영역과 무관한 변경이면 "LGTM (담당 영역 외)" 응답 가능
- planning-advisor는 리뷰 대상에서 제외 (계획 검토 전용)
