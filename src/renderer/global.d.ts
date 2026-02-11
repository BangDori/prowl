/** 전역 Window.electronAPI 타입 선언 */
import type { ElectronAPI } from "../preload/index";

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
