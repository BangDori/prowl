/** 윈도우 모듈 배럴 export */
// Compact sticky view
export {
  getCompactWindow,
  hideCompactWindow,
  isCompactVisible,
  showCompactWindow,
  toggleCompactWindow,
} from "./compact-window";
// Dashboard window
export { closeDashboardWindow, getDashboardWindow, showDashboardWindow } from "./dashboard-window";
export { createSplashWindow, dismissSplash, getSplashWindow } from "./splash";
// Tray and sub-window
export { createTray, getSubWindow, getTray, popUpTrayMenu } from "./tray";
