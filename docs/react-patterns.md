# React Patterns

Prowl에서 검증된 React 패턴. Vercel Engineering 가이드에서 Electron 환경에 맞게 추려낸 핵심 규칙.

---

## 상태 관리

### 파생 상태는 렌더 중에 계산 (effect 금지)

props/state에서 계산 가능한 값은 state로 저장하거나 effect로 동기화하지 않는다.

```tsx
// Bad
const [fullName, setFullName] = useState('')
useEffect(() => {
  setFullName(firstName + ' ' + lastName)
}, [firstName, lastName])

// Good
const fullName = firstName + ' ' + lastName
```

### 함수형 setState로 stale closure 방지

현재 상태 기반으로 업데이트할 때는 함수형 setState를 사용해 의존성 배열을 단순화하고 stale closure를 방지한다.

```tsx
// Bad — items를 의존성으로 가져야 하고, 잊으면 버그
const removeItem = useCallback((id: string) => {
  setItems(items.filter(item => item.id !== id))
}, [items])

// Good — 항상 최신 상태, 의존성 없음
const removeItem = useCallback((id: string) => {
  setItems(curr => curr.filter(item => item.id !== id))
}, [])
```

### 초기화 비용이 큰 state는 lazy 초기화

```tsx
// Bad — buildIndex()가 매 렌더마다 실행됨
const [index, setIndex] = useState(buildIndex(items))

// Good — 최초 렌더에만 실행
const [index, setIndex] = useState(() => buildIndex(items))
```

### 자주 바뀌지만 UI에 반영 안 해도 되는 값은 useRef

```tsx
// Bad — 마우스 이동마다 리렌더
const [x, setX] = useState(0)

// Good — ref로 추적, DOM 직접 조작
const xRef = useRef(0)
const elRef = useRef<HTMLDivElement>(null)
const onMove = (e: MouseEvent) => {
  xRef.current = e.clientX
  if (elRef.current) elRef.current.style.transform = `translateX(${e.clientX}px)`
}
```

---

## Effect / 의존성

### effect 의존성은 원시값으로 좁히기

```tsx
// Bad — user의 어떤 필드가 바뀌어도 실행
useEffect(() => {
  fetchData(user.id)
}, [user])

// Good
useEffect(() => {
  fetchData(user.id)
}, [user.id])
```

### 콜백 안에서만 쓰는 값은 구독하지 않기

```tsx
// Bad — searchParams 변경마다 리렌더
const searchParams = useSearchParams()
const handleShare = () => {
  const ref = searchParams.get('ref')
  share(chatId, { ref })
}

// Good — 클릭 시점에만 읽기
const handleShare = () => {
  const ref = new URLSearchParams(window.location.search).get('ref')
  share(chatId, { ref })
}
```

### 이벤트 핸들러를 effect 의존성에 넣지 않기

콜백이 바뀔 때 effect가 재구독되는 것을 막으려면 ref에 저장한다.

```tsx
// Bad — handler 바뀔 때마다 재구독
useEffect(() => {
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [handler])

// Good
const handlerRef = useRef(handler)
useEffect(() => { handlerRef.current = handler }, [handler])
useEffect(() => {
  const listener = (e: KeyboardEvent) => handlerRef.current(e)
  window.addEventListener('keydown', listener)
  return () => window.removeEventListener('keydown', listener)
}, [])
```

---

## 렌더링

### 조건부 렌더링에 `&&` 대신 삼항 연산자

숫자/NaN이 조건에 올 수 있으면 `&&`는 `0`이나 `NaN`을 렌더한다.

```tsx
// Bad — count가 0이면 "0"이 렌더됨
{count && <Badge>{count}</Badge>}

// Good
{count > 0 ? <Badge>{count}</Badge> : null}
```

### 정적 JSX는 컴포넌트 바깥으로 끌어올리기

```tsx
// Bad — 매 렌더마다 객체 재생성
function Container() {
  return <div>{loading && <div className="skeleton" />}</div>
}

// Good
const skeleton = <div className="skeleton" />
function Container() {
  return <div>{loading && skeleton}</div>
}
```

---

## 임포트

### lucide-react는 직접 경로 임포트

barrel import는 수천 개의 아이콘 모듈을 모두 로드한다.

```tsx
// Bad — 1500+ 모듈 로드
import { Check, X, Bell } from 'lucide-react'

// Good
import Check from 'lucide-react/dist/esm/icons/check'
import X from 'lucide-react/dist/esm/icons/x'
import Bell from 'lucide-react/dist/esm/icons/bell'
```

---

## 비동기

### 독립적인 비동기 작업은 Promise.all

```tsx
// Bad — 순차 실행 (3 round-trips)
const tasks = await fetchTasks()
const memories = await fetchMemories()
const settings = await fetchSettings()

// Good — 병렬 실행 (1 round-trip)
const [tasks, memories, settings] = await Promise.all([
  fetchTasks(),
  fetchMemories(),
  fetchSettings(),
])
```
