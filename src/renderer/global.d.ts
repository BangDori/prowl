/** 전역 Window.electronAPI 타입 선언 및 Electron webview 커스텀 엘리먼트 타입 */
import type { ElectronAPI } from "../preload/index";

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      allowpopups?: string;
    };
  }
}
