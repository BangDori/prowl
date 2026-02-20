/** 윈도우 모듈 배럴 export */
// Chat window
export {
  closeChatWindow,
  getChatWindow,
  isChatWindowActive,
  isChatWindowExpanded,
  resizeChatWindow,
  showChatWindow,
  toggleChatWindow,
  toggleExpandChatWindow,
} from "./chat-window";
// Compact sticky view
export {
  getCompactWindow,
  hideCompactWindow,
  isCompactVisible,
  showCompactWindow,
  toggleCompactWindow,
} from "./compact-window";
// Dashboard window
export {
  closeDashboardWindow,
  getDashboardWindow,
  showDashboardWindow,
  toggleDashboardWindow,
} from "./dashboard-window";
export { createSplashWindow, dismissSplash, getSplashWindow } from "./splash";
// Tray and sub-window
export { createTray, getSubWindow, getTray, popUpTrayMenu } from "./tray";
