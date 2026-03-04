---
name: e2e-test
description: Prowl 앱을 격리 환경에서 실행하고 UI 동작을 E2E 검증. 작업 완료 후 회귀 확인용.
argument-hint: "[검증할 시나리오 설명 (선택)]"
---

# E2E 테스트 실행

현재 변경 사항을 기반으로 Playwright E2E 테스트를 실행하고 결과를 분석합니다.

**사용법:**
- `/e2e-test` — git diff로 시나리오 자동 추론 후 기존 스펙 실행
- `/e2e-test 태스크 생성 후 목록에 표시되어야 함` — 명시적 요구사항으로 신규 스펙 작성

---

## 실행 절차

### 1단계: 테스트 목표 수립

**A. 명시적 요구사항 (인자가 있는 경우 우선 사용):**
```
$ARGUMENTS
```

**B. git diff 분석 (항상 실행):**
```bash
git diff main...HEAD --stat
git diff main...HEAD
```

변경된 파일을 보고 어떤 사용자 플로우를 검증할지 결정. 기존 스펙(`e2e/specs/`)으로 커버되는지 먼저 확인.

---

### 2단계: 빌드 확인

```bash
ls dist/main/index.js 2>/dev/null || bun run build
```

---

### 3단계: 테스트 실행

```bash
# 전체 스펙
bun run e2e:test

# 특정 스펙만
bun run e2e:test --grep "시나리오 설명"

# UI 모드 (디버깅용)
bun run e2e:test:ui
```

실패 시 리포트 확인:
```bash
open e2e/report/index.html
```

---

### 4단계: 신규 스펙 작성 (필요 시)

기존 스펙으로 커버되지 않으면 `e2e/specs/{기능명}.spec.ts`를 추가.

#### 기본 패턴 — 단일 창

```typescript
/** E2E — {기능 설명} */
import { expect, test } from "@playwright/test";
import { getTodayDateString } from "../helpers";
import { DashboardPage } from "../pages/DashboardPage";
import { launchApp } from "../runner";

test("{시나리오 설명}", async () => {
  const { page, cleanup } = await launchApp();
  const dashboard = new DashboardPage(page);
  try {
    // 데이터 준비: IPC로 직접 주입 (UI보다 빠르고 안정적)
    await dashboard.createTask(getTodayDateString(), {
      id: `e2e-${Date.now()}`,
      title: `테스트 태스크 ${Date.now()}`,  // Date.now()로 충돌 방지
      completed: false,
      createdAt: new Date().toISOString(),
    });

    // 검증: POM 메서드만 사용, 스펙 파일에서 셀렉터 직접 사용 금지
    await dashboard.clickTodayCell();
    await expect(dashboard.taskLocator("테스트 태스크")).toBeVisible({ timeout: 5000 });
  } finally {
    await cleanup();  // 임시 디렉터리 자동 삭제, 실패해도 반드시 실행
  }
});
```

#### 다중 창 패턴 — Compact 등 두 번째 창 열기

`app` 레퍼런스가 있어야 두 번째 창을 열 수 있다.

```typescript
test("{시나리오 설명}", async () => {
  const { app, page: rawPage, cleanup } = await launchApp();
  const dashboard = new DashboardPage(rawPage, app);  // app 전달
  try {
    await dashboard.createTask(/* ... */);

    const compactRawPage = await dashboard.openCompactView();  // 두 번째 창
    const compact = new CompactPage(compactRawPage);
    await compact.waitForLoad();

    await compact.toggleTask("태스크 제목");
    // rawPage(Dashboard)로 돌아와 검증
    await dashboard.clickTodayCell();
    await expect(dashboard.completedTaskLocator("태스크 제목")).toBeVisible();
  } finally {
    await cleanup();
  }
});
```

---

## POM 현황

| 파일 | 담당 |
|------|------|
| `e2e/pages/DashboardPage.ts` | 대시보드 — 태스크 생성/편집/삭제/완료, 캘린더, 네비게이션, Compact 창 열기 |
| `e2e/pages/CompactPage.ts` | Compact 창 — 태스크 완료, 완료 목록 펼치기 |
| `e2e/pages/PersonalizePage.ts` | Personalize 탭 — Memory CRUD, System Prompt 저장/초기화, Tone 저장 |

새 POM이 필요하면 `e2e/pages/`에 추가. 스펙에서 셀렉터를 직접 쓰면 안 된다.

---

## 핵심 원칙

- **데이터 준비는 IPC로** — `dashboard.createTask()`처럼 `page.evaluate(electronAPI.xxx)`를 통해 직접 주입. UI로 입력하는 것보다 빠르고 안정적
- **POM-only** — 스펙 파일에서 `page.locator()`, `page.click()` 직접 호출 금지. 모든 인터랙션은 POM 메서드
- **try/finally 필수** — 테스트가 실패해도 `cleanup()`이 반드시 실행돼야 임시 디렉터리가 남지 않음
- **타이틀 충돌 방지** — `Date.now()` 접미사로 병렬 실행 시 충돌 예방 (현재 workers=1이지만 습관으로)
- **단일 창 vs 다중 창** — 두 번째 창(Compact)이 필요할 때만 `app`을 destructure

---

## 주의사항

- `PROWL_DATA_HOME`이 자동 설정되므로 실제 `~/.prowl` 데이터는 변경되지 않음
- `workers: 1` — 앱 인스턴스 격리를 위해 직렬 실행
- macOS 전용 앱이라 headless 모드 없음 — 로컬 실행 시 앱 창이 실제로 뜸
