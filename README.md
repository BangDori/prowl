<p align="center">
  <img src="assets/prowl-logo.png" width="180" alt="Prowl Logo">
</p>

<h1 align="center">Prowl</h1>

<p align="center">
  <strong>A cat that lives in your background, assisting your tasks from the macOS menubar</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS-black?style=flat-square&logo=apple" alt="macOS">
  <img src="https://img.shields.io/badge/electron-28-47848F?style=flat-square&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/react-18-61DAFB?style=flat-square&logo=react" alt="React">
</p>

---

## What is Prowl?

**Prowl**은 macOS 메뉴바에 상주하는 생산성 앱입니다.

태스크 관리, AI 채팅, 파일 브라우저, AI 메모리를 메뉴바 하나에서 처리합니다.

---

## Features

### Task Manager

파일 기반 태스크를 날짜·카테고리로 관리합니다.

**Full View** — 월별 캘린더 그리드에서 태스크를 확인하고 추가·수정·완료 처리합니다. 날짜를 클릭하면 해당 날의 태스크 목록이 펼쳐집니다.

**Compact View** — 메뉴바에서 바로 꺼내는 스티키 윈도우. 카테고리별·날짜별로 오늘 할 일을 빠르게 훑고 완료 처리할 수 있습니다.

### Personalize

AI 동작 방식을 내 취향으로 조정합니다.

- **Memory** — AI에게 기억시킬 선호·규칙을 영구 저장
- **System Prompt** — 기본 시스템 프롬프트를 직접 편집
- **톤 & 매너** — AI 응답 스타일 설정

### Prowl Chat

ChatGPT OAuth 또는 API Key로 AI 채팅을 사용합니다. 채팅창 드롭다운에서 모델을 즉시 전환할 수 있습니다.

---

## Installation

### Homebrew (권장)

```bash
brew install BangDori/prowl/prowl
```

Homebrew로 설치하면 앱 내에서 자동 업데이트가 지원됩니다.

### DMG 직접 다운로드

1. [Releases](https://github.com/BangDori/prowl/releases/latest)에서 DMG 파일 다운로드
2. Prowl.app을 Applications 폴더로 드래그
3. 실행 후 메뉴바에서 🐱 아이콘 클릭

> [!NOTE]
> 첫 실행 시 "확인되지 않은 개발자" 경고가 뜨면:
> `시스템 설정 → 개인정보 보호 및 보안 → 확인 없이 열기`

---

## AI Chat

Prowl은 두 가지 인증 방식으로 AI 채팅을 지원합니다.

### ChatGPT OAuth (권장)

Dashboard → Settings → **Connect with ChatGPT** 버튼으로 연결합니다.

브라우저에서 OpenAI 로그인 후 자동으로 인증이 완료되며, 토큰은 만료 5분 전 자동 갱신됩니다.

| 모델 | 비고 |
|------|------|
| gpt-5.3-codex | 기본 모델 |
| gpt-5.2-codex | |
| gpt-5.2 | |
| gpt-5.1-codex-max | |
| gpt-5.1-codex-mini | |

### OpenAI API Key

```bash
# ~/.zshrc에 추가
export OPENAI_API_KEY=sk-...
```

또는 Dashboard → Settings에서 직접 입력할 수 있습니다.

| 모델 |
|------|
| gpt-5.2, gpt-5-mini 등 범용 모델 |

---

## Development

```bash
git clone https://github.com/BangDori/prowl.git
cd prowl
bun install
bun run dev        # 개발 모드
bun run build      # 프로덕션 빌드
bun run test       # 테스트
bun run lint       # 린트
bun run package    # DMG 생성
```

---

## FAQ

### API 키가 없어도 채팅을 쓸 수 있나요?

ChatGPT OAuth로 로그인하면 API Key 없이 채팅이 가능합니다. Settings에서 Connect with ChatGPT 버튼을 사용하세요.

### AI 채팅이 동작하지 않아요

- Settings에서 ChatGPT OAuth 연결 상태를 확인하세요
- API Key 방식을 사용하는 경우 `OPENAI_API_KEY` 환경변수가 설정됐는지 확인하세요
- OAuth 토큰이 만료된 경우 Disconnect 후 다시 Connect하면 됩니다

### "손상된 파일" 또는 "확인되지 않은 개발자" 경고

현재 앱이 Apple 공증(Notarization)을 받지 않아 발생합니다.

**터미널에서 아래 명령어를 실행하세요:**

```bash
xattr -cr /Applications/Prowl.app
```

그 후 앱을 다시 실행하면 정상 작동합니다.

### 앱이 메뉴바에 안 보여요

- `활성 상태 보기`에서 "Prowl" 검색하여 실행 중인지 확인
- 메뉴바 공간 부족 시 다른 아이콘을 `⌘ + 드래그`로 정리
