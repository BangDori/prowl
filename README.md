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

자동화 도구가 늘어나고 AI와의 작업이 일상이 된 지금, 내 Mac 위에서 무엇이 돌아가고 있는지 파악하는 것이 점점 더 중요해지고 있습니다. Prowl은 메뉴바에 조용히 상주하며 백그라운드 작업을 모니터링하고, 사용자의 로컬 환경을 보조합니다.

---

## ✨ Features

- **백그라운드 스크립트 모니터링** — launchd 기반 작업의 스케줄, 실행 상태, 로그를 한 눈에 확인하고 제어
- **로컬 하네스 관리** — 로컬 환경의 하네스를 메뉴바에서 간편하게 관리
- **Task Manager** — 파일 기반 태스크를 캘린더 그리드에서 관리하고, 스티키 윈도우로 오늘 할 일을 바로 확인
- **AI Chat** — OpenAI 기반 AI 채팅, 입력바에서 모델을 즉시 전환

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

## 📁 plist 파일 위치

Prowl은 `~/Library/` 폴더 내의 모든 plist 파일을 재귀 탐색합니다.

일반적으로 launchd 작업은 `~/Library/LaunchAgents/`에 저장합니다:

```bash
# plist 파일을 LaunchAgents에 저장
cp your-job.plist ~/Library/LaunchAgents/

# launchd에 등록
launchctl load ~/Library/LaunchAgents/your-job.plist

# 등록된 작업 확인
launchctl list | grep com.yourname
```

> [!TIP]
> `launchctl list` 출력 형식: `PID | 종료코드 | Label`
>
> - PID가 `-`이면 현재 실행 중이 아님
> - 종료코드 `0`은 마지막 실행 성공

---

## 🤖 AI Chat

Prowl은 OpenAI 기반 AI 채팅 기능을 내장하고 있습니다. 채팅 입력바의 드롭다운에서 모델을 즉시 전환할 수 있습니다.

### 지원 모델

| 모델 | 환경변수 |
|------|---------|
| GPT-5.2, GPT-4o | `OPENAI_API_KEY` |

### 설정

```bash
# ~/.zshrc에 추가
export OPENAI_API_KEY=sk-...
```

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

### 작업 목록이 비어 있어요

- 설정(⚙️)에서 감지 패턴이 올바른지 확인하세요
- `~/Library/` 하위 디렉토리에 plist 파일이 있어야 합니다
- 패턴 예시: `com.claude.`, `local.`, `com.mycompany.` (접두사 매칭)

### 작업이 활성화되지 않아요

터미널에서 직접 로드해보세요:

```bash
launchctl load ~/Library/LaunchAgents/your-job.plist
```

오류가 나타나면:

- plist 문법 확인: `plutil -lint your-job.plist`
- 스크립트 실행 권한: `chmod +x /path/to/script.sh`

### 실행 상태가 "실패"로 표시돼요

1. 작업 카드의 로그 버튼(📄)으로 로그 확인
2. 터미널에서 스크립트 직접 실행해 오류 확인
3. Full Disk Access 권한이 필요할 수 있습니다
   - `시스템 설정 → 개인정보 보호 및 보안 → 전체 디스크 접근 권한`

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

### plist 파일 만들기

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.yourname.jobname</string>
    <key>ProgramArguments</key>
    <array>
        <string>/path/to/your/script.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/yourjob.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/yourjob.log</string>
</dict>
</plist>
```

저장 후 활성화:

```bash
launchctl load ~/Library/LaunchAgents/com.yourname.jobname.plist
```

