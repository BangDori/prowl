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

## ✨ Features

### Task Manager

파일 기반 태스크를 날짜·카테고리로 관리합니다.

- **Full View** — 월별 캘린더 그리드에서 태스크를 확인하고 추가·수정·완료 처리합니다. 날짜를 클릭하면 해당 날의 태스크 목록이 펼쳐집니다.
- **Compact View** — 메뉴바에서 바로 꺼내는 스티키 윈도우. 카테고리별·날짜별로 오늘 할 일을 빠르게 훑고 완료 처리할 수 있습니다.

### Personalize

AI 동작 방식을 내 취향으로 조정합니다.

- **Memory** — AI에게 기억시킬 선호·규칙을 영구 저장
- **System Prompt** — 기본 시스템 프롬프트를 직접 편집
- **톤 & 매너** — AI 응답 스타일 설정

### Prowl Chat

ChatGPT OAuth 또는 API Key로 AI 채팅을 사용합니다. 채팅창 드롭다운에서 모델을 즉시 전환할 수 있습니다.

---

## 🚀 Installation

```bash
brew install BangDori/prowl/prowl
```

Homebrew로 설치하면 앱 내에서 자동 업데이트가 지원됩니다.

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

Dashboard → Settings에서 API Key를 입력합니다.

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

