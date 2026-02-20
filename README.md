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

## 🪄 What is Prowl?

**Prowl**은 사용자의 백그라운드에 서식하며 작업을 보조하는 macOS 메뉴바 앱입니다.

자동화 도구가 늘어나고 AI와의 작업이 일상이 된 지금, 반복 작업을 직접 스케줄링하고 로컬 환경 전체를 한 곳에서 관리하는 것이 점점 더 중요해지고 있습니다. Prowl은 메뉴바에 조용히 상주하며 스크립트 자동화부터 태스크 관리, AI 채팅까지 모두 처리합니다.

---

## ✨ Features

- **Script Library** — 자연어로 설명하면 AI가 셸 스크립트를 생성하고 스케줄까지 등록. 매일/매주/인터벌/수동 실행 지원
- **Task Manager** — 파일 기반 태스크를 캘린더 그리드에서 관리하고, 스티키 윈도우로 오늘 할 일을 바로 확인
- **AI Chat** — OpenAI 기반 AI 채팅, 입력바에서 모델을 즉시 전환
- **Memory** — AI가 기억할 선호·지시사항을 영구 저장

---

## 🚀 Installation

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

## 🖥 Script Library

자연어로 원하는 작업을 입력하면 Prowl이 셸 스크립트를 생성하고 스케줄을 등록합니다.

### 사용 방법

1. Dashboard → **Script Library** 탭 열기
2. `+ 추가` 버튼 클릭
3. 원하는 작업을 자연어로 입력 (예: `매일 오전 9시에 ~/backup 폴더를 압축해서 ~/archives에 저장`)
4. AI가 생성한 스크립트와 스케줄을 확인 후 저장
5. 토글로 활성화/비활성화, ▶ 버튼으로 즉시 실행

### 지원 스케줄

| 타입 | 설명 |
|------|------|
| `daily` | 매일 지정 시간 실행 |
| `weekly` | 매주 지정 요일·시간 실행 |
| `interval` | N초마다 반복 실행 |
| `manual` | 수동 실행만 |

### OpenAI API 키 설정

Script Library의 AI 스크립트 생성 기능은 OpenAI API를 사용합니다.

```bash
# ~/.zshrc에 추가
export OPENAI_API_KEY=sk-...
```

---

## 🤖 AI Chat

Prowl은 OpenAI 기반 AI 채팅 기능을 내장하고 있습니다. 채팅 입력바의 드롭다운에서 모델을 즉시 전환할 수 있습니다.

### 지원 모델

| 모델 | 환경변수 |
|------|---------|
| GPT-5.2, GPT-4o | `OPENAI_API_KEY` |

API 키가 등록되지 않으면 채팅 메시지로 설정 방법을 안내합니다.

---

## 🛠 Development

```bash
git clone https://github.com/BangDori/prowl.git
cd prowl
bun install
bun run dev        # 개발 모드
bun run build      # 프로덕션 빌드
bun run package    # DMG 생성
```

---

## ❓ FAQ

### 스크립트가 생성되지 않아요

- `OPENAI_API_KEY` 환경변수가 설정되어 있는지 확인하세요
- Dashboard → Settings에서 API 키를 직접 입력할 수도 있습니다

### 스크립트 실행이 실패해요

1. 스크립트 카드에서 마지막 실행 결과 확인
2. `파일 위치 열기` 버튼으로 스크립트 파일을 직접 편집
3. 터미널에서 스크립트를 직접 실행해 오류 확인

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
