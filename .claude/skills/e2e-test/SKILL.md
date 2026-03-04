---
name: e2e-test
description: Prowl 앱을 격리 환경에서 실행하고 UI 동작을 E2E 검증. 작업 완료 후 회귀 확인용.
argument-hint: "[검증할 시나리오 설명 (선택)]"
---

# E2E 테스트 실행

현재 변경 사항을 기반으로 Playwright E2E 테스트를 실행하고 결과를 분석합니다.

**사용법:**
- `/e2e-test` — git diff만으로 시나리오 자동 추론 후 기존 스펙 실행
- `/e2e-test 태스크 생성 후 목록에 표시되어야 함` — 명시적 요구사항으로 신규 스펙 작성

---

## 실행 절차

### 1단계: 테스트 목표 수립

아래 두 가지를 조합해 검증할 시나리오 목록을 작성하세요.

**A. 명시적 요구사항 (인자가 있는 경우 우선 사용):**
```
$ARGUMENTS
```

**B. git diff 분석 (항상 실행):**

```bash
git diff main...HEAD --stat
git diff main...HEAD
```

변경된 파일과 코드를 보고:
- 어떤 기능이 추가/수정됐는지 파악
- 해당 기능에서 검증해야 할 사용자 플로우 도출
- 기존 스펙(`e2e/specs/`)으로 커버되는지 확인

---

### 2단계: 빌드 확인

```bash
ls dist/main/index.js 2>/dev/null || echo "빌드 필요"
```

없으면 먼저 빌드:
```bash
bun run build
```

---

### 3단계: 테스트 실행

```bash
# 전체 스펙 실행
bun run e2e:test

# 특정 스펙만 실행
bun run e2e:test --grep "시나리오 설명"

# Journey 3 (AI 채팅) — API 키 필요
E2E_OPENAI_KEY=sk-... bun run e2e:test e2e/specs/chat.spec.ts
```

---

### 4단계: 결과 분석

각 시나리오마다 결과를 명확히 기록하세요:

- ✅ **통과**: 예상대로 동작함
- ❌ **실패**: 문제 발견 (무엇이 잘못됐는지 설명)
- ❓ **불확실**: 추가 확인 필요

실패 시 `e2e/report/index.html`에서 상세 리포트 확인:
```bash
open e2e/report/index.html
```

---

### 5단계: 신규 스펙 작성 (필요 시)

기존 스펙으로 커버되지 않는 시나리오는 `e2e/specs/`에 추가하세요:

```typescript
// e2e/specs/{기능명}.spec.ts
/** Journey N E2E — {기능 설명} */
import { expect, test } from "@playwright/test";
import { DashboardPage } from "../pages/DashboardPage";
import { launchApp } from "../runner";

test("{시나리오 설명}", async () => {
  const { app, page, cleanup } = await launchApp();
  const dashboard = new DashboardPage(page, app);
  try {
    // 검증 로직
    await expect(page.locator("SELECTOR")).toBeVisible();
  } finally {
    await cleanup();
  }
});
```

---

## 주의사항

- `PROWL_DATA_HOME`이 자동 설정되므로 실제 `~/.prowl` 데이터는 변경되지 않습니다
- 테스트 데이터는 종료 시 `/tmp/prowl-test-XXXX/`와 함께 자동 삭제됩니다
- `workers: 1` — 앱 인스턴스 격리를 위해 직렬 실행
- Journey 3 (AI 채팅) 스펙은 `E2E_OPENAI_KEY` 미설정 시 자동 skip
