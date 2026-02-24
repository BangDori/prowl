# Prowl 도메인 모델

## 도메인

### Task
할 일 관리. Category는 Task를 분류하기 위해 존재하므로 Task 도메인 내부에 속한다.

```ts
interface Task {
  id: string;
  title: string;
  description?: string;
  dueTime?: string;       // "HH:MM" (없으면 종일)
  category?: string;
  completed: boolean;
  completedAt?: string;   // ISO 8601
  createdAt: string;      // ISO 8601
  reminders?: TaskReminder[];
}
```

### Memory
AI에게 주는 규칙/선호.

```ts
interface Memory {
  id: string;
  content: string;
  createdAt: string; // ISO 8601
}
```

### ChatRoom
AI와의 대화. 다른 도메인에 접근할 때 **반드시 Tool 인터페이스를 통해서만** 접근한다.

```ts
interface ChatRoom {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
  locked?: boolean;
}
```

### Preferences
사용자 환경설정. Prowl은 단일 사용자 앱이므로 User 도메인 불필요.

```ts
interface Preferences {
  focusMode: FocusMode;
  notificationsEnabled: boolean;
  shortcuts: ShortcutConfig;
  openaiApiKey?: string;
  favoritedRoomIds: string[];  // ChatRoom 즐겨찾기
}
```

---

## 도메인 관계

```
Task         ←── Tool ───┐
Memory       ←── Tool ───┤ ChatRoom
Preferences  ←── Tool ───┘
```

ChatRoom은 다른 도메인의 내부를 직접 알지 못한다. Tool 인터페이스를 통해서만 접근한다.

---

## 설계 원칙

1. **도메인 경계** — 도메인은 서로의 내부를 직접 참조하지 않는다
2. **Tool 추상화** — ChatRoom이 다른 도메인에 접근할 때는 Tool 인터페이스를 통한다
3. **YAGNI** — 지금 필요하지 않은 추상화는 만들지 않는다
4. **이름이 의도를 드러내야 한다** — `Settings` 보다 `Preferences`가 실제 역할을 더 잘 표현한다

