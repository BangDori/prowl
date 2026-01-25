import { menubar, Menubar } from "menubar";
import { app, nativeImage, Menu, shell } from "electron";
import * as path from "path";

let mb: Menubar | null = null;

/**
 * 메뉴바 앱 생성 및 설정
 */
export function createMenubar(): Menubar {
  // 개발 모드 감지: --dev 플래그 또는 ELECTRON_DEV 환경변수
  const isDev =
    process.argv.includes("--dev") || process.env.ELECTRON_DEV === "true";

  console.log("isDev:", isDev);
  console.log("__dirname:", __dirname);

  // 트레이 아이콘 경로
  const iconPath = path.join(__dirname, "../../assets/tray-iconTemplate.png");

  // 기본 아이콘 (파일이 없으면)
  let icon = nativeImage.createEmpty();
  try {
    icon = nativeImage.createFromPath(iconPath);
    icon.setTemplateImage(true);
  } catch (e) {
    console.log("Using default icon");
  }

  // 렌더러 URL - 프로덕션에서는 빌드된 파일 사용
  const indexUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "../renderer/index.html")}`;

  console.log("Loading URL:", indexUrl);

  mb = menubar({
    index: indexUrl,
    icon: icon.isEmpty() ? undefined : icon,
    tooltip: "Prowl",
    preloadWindow: true,
    showDockIcon: false,
    browserWindow: {
      width: 400,
      height: 500,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, "../preload/index.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    },
  });

  // 이벤트 핸들러
  mb.on("ready", () => {
    console.log("Menubar app is ready");

    // 우클릭 컨텍스트 메뉴
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Prowl",
        enabled: false,
      },
      { type: "separator" },
      {
        label: "새로고침",
        click: () => {
          mb?.window?.webContents.reload();
        },
      },
      {
        label: "DevTools",
        click: () => {
          mb?.window?.webContents.openDevTools({ mode: "detach" });
        },
        visible: isDev,
      },
      { type: "separator" },
      {
        label: "LaunchAgents 폴더 열기",
        click: () => {
          shell.openPath(
            path.join(app.getPath("home"), "Library/LaunchAgents"),
          );
        },
      },
      { type: "separator" },
      {
        label: "종료",
        click: () => {
          app.quit();
        },
      },
    ]);

    mb?.tray.on("right-click", () => {
      mb?.tray.popUpContextMenu(contextMenu);
    });
  });

  mb.on("after-create-window", () => {
    // 개발 모드에서 DevTools 자동 열기 (필요시)
    // if (isDev) {
    //   mb?.window?.webContents.openDevTools({ mode: 'detach' });
    // }
  });

  mb.on("show", () => {
    // 창이 보일 때 데이터 새로고침
    mb?.window?.webContents.send("window:show");
  });

  return mb;
}

export function getMenubar(): Menubar | null {
  return mb;
}
