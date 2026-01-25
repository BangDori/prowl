<h1 align="center">
  🐱 Prowl
</h1>

<p align="center">
  <strong>A cat that watches your background jobs from the macOS menubar</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS-black?style=flat-square&logo=apple" alt="macOS">
  <img src="https://img.shields.io/badge/electron-28-47848F?style=flat-square&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/react-18-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
</p>

---

## 🪄 What is Prowl?

**Prowl**은 `launchd` 기반 백그라운드 스크립트들을 메뉴바에서 한 눈에 모니터링하고 제어할 수 있는 macOS 앱입니다.

AI 에이전트와 자동화 도구가 늘어나면서 백그라운드에서 조용히 돌아가는 스크립트도 많아졌습니다. 하지만 이런 스케줄링 작업들을 한 눈에 관리할 수 있는 도구는 마땅치 않았습니다. Prowl은 macOS의 `launchd`로 등록된 작업들을 메뉴바에서 간편하게 모니터링하고 제어할 수 있게 해줍니다.

---

## ✨ Features

| 기능            | 설명                                          |
| --------------- | --------------------------------------------- |
| **패턴 설정**   | 감지할 plist 패턴을 직접 설정                 |
| **스케줄 표시** | "매주 금 11:00", "화/수/목 09:00" 형태로 표시 |
| **실행 상태**   | 마지막 실행 시간 및 성공/실패 여부            |
| **토글 제어**   | 작업 활성화/비활성화 원클릭                   |
| **수동 실행**   | 스케줄 무시하고 즉시 실행                     |
| **로그 뷰어**   | 실행 로그 바로 확인                           |

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

## 🛠 Development

```bash
git clone https://github.com/BangDori/prowl.git
cd prowl
pnpm install
pnpm dev        # 개발 모드
pnpm build      # 프로덕션 빌드
pnpm package    # DMG 생성
```

---

## 📝 Script Metadata

스크립트 파일 상단에 메타데이터를 추가하면 Prowl이 자동으로 인식합니다:

```bash
#!/bin/bash
# @icon 📅
# @description 매일 아침 리포트 생성

# your script here...
```

| 태그           | 용도          | 예시                             |
| -------------- | ------------- | -------------------------------- |
| `@icon`        | 이모지 아이콘 | `# @icon 🔔`                     |
| `@description` | 작업 설명     | `# @description Slack 알림 전송` |

메타데이터가 없으면 기본 아이콘(⚙️)과 "설명 없음"이 표시됩니다.

---

## 🛠 Tech Stack

<p>
  <img src="https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
</p>

---

## 📁 Project Structure

```
prowl/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── services/
│   │   │   ├── launchd.ts    # launchctl wrapper
│   │   │   ├── plist-parser.ts
│   │   │   ├── log-reader.ts
│   │   │   └── script-metadata.ts
│   │   ├── tray.ts           # menubar setup
│   │   └── ipc.ts            # IPC handlers
│   │
│   ├── renderer/             # React UI
│   │   ├── components/
│   │   └── hooks/
│   │
│   └── shared/               # shared types
│
└── assets/
    └── tray-icon.png         # menubar icon
```

---

## 📜 License

MIT © [BangDori](https://github.com/bangdori)
