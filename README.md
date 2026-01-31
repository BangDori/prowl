<p align="center">
  <img src="assets/prowl-logo.png" width="180" alt="Prowl Logo">
</p>

<h1 align="center">Prowl</h1>

<p align="center">
  <strong>A cat that watches your background jobs from the macOS menubar</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS-black?style=flat-square&logo=apple" alt="macOS">
  <img src="https://img.shields.io/badge/electron-28-47848F?style=flat-square&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/react-18-61DAFB?style=flat-square&logo=react" alt="React">
</p>

---

## 🪄 What is Prowl?

**Prowl**은 `launchd` 기반 백그라운드 스크립트들을 메뉴바에서 한 눈에 모니터링하고 제어할 수 있는 macOS 앱입니다.

AI 에이전트와 자동화 도구가 늘어나면서 백그라운드에서 조용히 돌아가는 스크립트도 많아졌습니다. 하지만 이런 스케줄링 작업들을 한 눈에 관리할 수 있는 도구는 마땅치 않았습니다. Prowl은 macOS의 `launchd`로 등록된 작업들을 메뉴바에서 간편하게 모니터링하고 제어할 수 있게 해줍니다.

---

## ✨ Features

| 기능             | 설명                                          |
| ---------------- | --------------------------------------------- |
| **패턴 설정**    | 감지할 plist 패턴을 직접 설정                 |
| **커스터마이징** | 작업별 아이콘, 이름, 설명을 UI에서 직접 편집  |
| **스케줄 표시**  | "매주 금 11:00", "화/수/목 09:00" 형태로 표시 |
| **실행 상태**    | 마지막 실행 시간 및 성공/실패 여부            |
| **토글 제어**    | 작업 활성화/비활성화 원클릭                   |
| **수동 실행**    | 스케줄 무시하고 즉시 실행                     |
| **로그 뷰어**    | 실행 로그 바로 확인                           |

---

## 🚀 Installation

<p align="center">
  <a href="https://github.com/BangDori/prowl/releases/latest">
    <img src="https://img.shields.io/badge/Download-Prowl.dmg-black?style=for-the-badge&logo=apple" alt="Download DMG">
  </a>
</p>

1. DMG 파일 다운로드
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

## ✏️ Customization

각 작업의 아이콘, 이름, 설명을 UI에서 직접 편집할 수 있습니다.

1. 작업 카드 우측 상단의 **연필 아이콘**을 클릭
2. 원하는 이모지, 이름, 설명을 입력
3. **체크 아이콘**을 클릭하여 저장

커스터마이징한 내용은 앱 내부에 저장되며, plist 파일에는 영향을 주지 않습니다.

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

