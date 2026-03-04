# 테스트 가이드

Prowl의 테스트 철학, 구조, 작성 방식. 실제 코드베이스에서 검증된 패턴을 정리한다.

---

## 테스트 계층

```
유닛 테스트 (vitest)    — 빠르고 격리된 단일 함수/클래스 검증
통합 테스트 (vitest)    — IPC 핸들러 등 여러 모듈이 연결되는 지점 검증
E2E 테스트 (Playwright) — 실제 Electron 앱을 띄워 사용자 시나리오 검증
```

현재 테스트 파일 위치:

| 계층 | 위치 | Runner |
|------|------|--------|
| 유닛 / 통합 | `src/**/*.test.ts` | vitest |
| E2E | `e2e/specs/*.spec.ts` | Playwright |

---

## 실행

```bash
bun run test          # 유닛 + 통합 (vitest)
bun run e2e           # E2E (Playwright)
```

---

## 유닛 / 통합 테스트 (vitest)

### 기본 원칙

- **파일 기반 서비스**는 `node:fs`를 mock, 실제 파일 I/O 없이 동작 검증
- **electron API**는 항상 mock (`electron` 패키지 통째로 모킹)
- **외부 의존성** (ai SDK, electron-store 등)은 mock, 내부 로직만 검증
- 테스트가 실제 파일을 읽거나 쓰면 환경 오염 — **절대 실제 경로 사용 금지**

### Mock 패턴

#### `vi.hoisted` + `vi.mock` — 표준 패턴

```ts
// 1. vi.hoisted로 mock 함수를 팩토리 실행 전에 선언
const { mockExistsSync, mockReadFileSync, mockWriteFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadFileSync: vi.fn(),
  mockWriteFileSync: vi.fn(),
}));

// 2. 모듈 mock에서 hoisted 변수 참조
vi.mock("node:fs", () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
}));

// 3. 테스트 코드에서 제어
it("파일 없으면 빈 배열", () => {
  mockExistsSync.mockReturnValue(false);
  expect(listTasks()).toEqual([]);
});
```

`vi.hoisted`가 필요한 이유: `vi.mock` 팩토리는 파일 상단으로 호이스팅되어 실행되므로, 팩토리 안에서 참조하는 변수도 호이스팅이 보장돼야 한다.

#### 파일 존재 여부 분기

파일 기반 서비스는 "폴더는 있고 파일은 없음" 시나리오가 많다.

```ts
// 파일 경로에 .json이 붙으면 파일, 아니면 폴더
mockExistsSync.mockImplementation((p: string) => !p.endsWith(".json"));
```

#### electron mock

```ts
vi.mock("electron", () => ({
  app: { getPath: vi.fn().mockReturnValue("/home/test"), quit: vi.fn() },
  ipcMain: { handle: vi.fn() },
  shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() },
}));
```

#### IPC 핸들러 추출 헬퍼

`ipc.test.ts`에서 사용하는 패턴 — 채널명으로 등록된 핸들러를 꺼내 직접 호출한다.

```ts
const mockIpcHandle = vi.mocked(ipcMain.handle);

function getHandler(channel: string) {
  const call = mockIpcHandle.mock.calls.find((c) => c[0] === channel);
  if (!call) throw new Error(`Handler not registered: ${channel}`);
  return call[1] as (...args: unknown[]) => Promise<unknown>;
}

it("설정을 저장한다", async () => {
  const handler = getHandler("settings:set");
  const result = await handler({}, settings);
  expect(setSettings).toHaveBeenCalledWith(settings);
});
```

#### AI 도구 (tool-registry) 테스트

AI 도구(`chat-tools-*.ts`)는 `toolRegistry`에 side-effect로 등록된다. 등록 후 꺼내 `execute`를 직접 호출한다.

```ts
// side-effect import로 등록 트리거
import "./chat-tools-tasks";

const tools = toolRegistry.getAllTools();
const execute = (tools.add_task as { execute: Function }).execute;

it("태스크를 추가한다", async () => {
  const result = await execute({ title: "새 태스크", date: "2025-01-15" });
  expect(result.success).toBe(true);
});
```

---

### 테스트 구조

```ts
describe("서비스/함수명", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본값 세팅 (happy path 기준)
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("[]");
  });

  describe("함수명", () => {
    it("정상 케이스", () => { ... });
    it("에러 케이스 — 없는 ID", () => { ... });
    it("경계 조건 — 빈 배열", () => { ... });
  });
});
```

`beforeEach`에서 `vi.clearAllMocks()`를 항상 호출해 테스트 간 상태 오염을 방지한다.

---

### 작성된 테스트 목록

| 파일 | 검증 대상 | 케이스 수 |
|------|-----------|---------|
| `src/main/lib/prowl-home.test.ts` | `getDataHome` — env 분기 | 2 |
| `src/main/services/approval.test.ts` | `waitForApproval`, `resolveApproval`, 타임아웃 | 6 |
| `src/main/services/memory.test.ts` | Memory CRUD | 9 |
| `src/main/services/tasks.test.ts` | 날짜 기반 + 백로그 Task CRUD | 28 |
| `src/main/services/categories.test.ts` | 카테고리 CRUD, resolveCategory | 18 |
| `src/main/services/settings.test.ts` | getSettings, setSettings, getChatConfig, setChatConfig, favoritedRooms | 12 |
| `src/main/services/chat-rooms.test.ts` | listChatRooms, createChatRoom, getChatRoom, deleteChatRoom, saveChatMessages | 13 |
| `src/main/services/chat-tools-tasks.test.ts` | update_task, add_task, delete_task, get_today_info, list_tasks | 15 |
| `src/main/services/chat.test.ts` | streamChatMessage, getProviderStatuses | 7 |
| `src/main/ipc.test.ts` | 모든 IPC 핸들러 등록 + 동작 검증 | 24 |
| `src/main/windows/tray.test.ts` | createTray, 이벤트 등록, 컨텍스트 메뉴 | 5 |
| `src/main/utils/pattern-matcher.test.ts` | matchesAnyPattern, filterByPatterns | 6 |
| `src/renderer/utils/date.test.ts` | formatRelativeTime, formatDateTime | 6 |

---

## E2E 테스트 (Playwright)

### 실행 환경

`e2e/runner.ts`가 Electron 앱을 격리된 임시 홈 디렉터리(`PROWL_DATA_HOME`)로 실행한다. 실제 사용자 데이터에 영향을 주지 않는다.

```ts
const { app, page, cleanup } = await launchApp();
// 테스트 후
await cleanup(); // 임시 디렉터리 제거
```

### Page Object Model (POM)

UI 인터랙션은 `e2e/pages/` 안의 POM으로 추상화한다. 테스트 코드에서 셀렉터를 직접 쓰지 않는다.

```ts
// ✅ POM 사용
const dashboard = new DashboardPage(page, app);
await dashboard.waitForLoad();
await dashboard.createTask("2025-01-15", "할 일");

// ❌ 테스트 코드에서 셀렉터 직접 사용 금지
await page.click('[data-testid="task-input"]');
```

### 현재 E2E 시나리오

| 파일 | Journey |
|------|---------|
| `e2e/specs/task-management.spec.ts` | 대시보드 로드, 태스크 생성/완료 |
| `e2e/specs/compact-sync.spec.ts` | Compact에서 완료 → Dashboard 반영 |
| `e2e/specs/chat.spec.ts` | 채팅 메시지 전송, Tool Calling (E2E_OPENAI_KEY 필요) |

### OpenAI 의존 테스트

`chat.spec.ts`는 실제 API 호출이 필요하다. `E2E_OPENAI_KEY` 미설정 시 자동 skip된다.

```ts
test.skip(!process.env.E2E_OPENAI_KEY, "E2E_OPENAI_KEY 환경변수 필요");
```

---

## 무엇을 테스트하는가

### 테스트해야 하는 것

- **비즈니스 로직** — 정렬 순서, 상태 전이, 에러 조건
- **경계 조건** — 빈 배열, 없는 ID, 완료된 항목 수정 시도
- **IPC 핸들러** — 올바른 서비스를 호출하는지, 반환값 형태가 맞는지
- **승인 흐름** — `waitForApproval` 타임아웃, resolve/reject 양쪽

### 테스트하지 않는 것

- **단순 패스스루** — `getDataHome`처럼 env를 읽어 반환하는 것 외엔 로직이 없는 함수는 최소한만
- **외부 라이브러리 동작** — electron-store 내부, Playwright API 자체
- **UI 렌더링 세부 사항** — 스타일, 픽셀 단위 레이아웃

---

## 자주 하는 실수

### mock 선언 위치 오류

```ts
// ❌ vi.mock 팩토리 안에서 외부 변수 참조 → 호이스팅 문제로 undefined
const mockFn = vi.fn();
vi.mock("./module", () => ({ fn: mockFn })); // mockFn이 undefined일 수 있음

// ✅ vi.hoisted 사용
const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }));
vi.mock("./module", () => ({ fn: mockFn }));
```

### beforeEach에서 clearAllMocks 누락

```ts
// ❌ 이전 테스트의 mock 호출 이력이 남음
beforeEach(() => {
  mockFn.mockReturnValue(true);
});

// ✅ 먼저 초기화
beforeEach(() => {
  vi.clearAllMocks();
  mockFn.mockReturnValue(true);
});
```

### 실제 파일 경로 사용

```ts
// ❌ 실제 홈 디렉터리를 오염시킴
vi.mock("@main/lib/prowl-home", () => ({
  getDataHome: vi.fn().mockReturnValue(process.env.HOME), // 절대 안됨
}));

// ✅ 안전한 가짜 경로
vi.mock("@main/lib/prowl-home", () => ({
  getDataHome: vi.fn().mockReturnValue("/home/test"),
}));
```
