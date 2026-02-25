/** 외부 URL webview — 네비게이션 이벤트 추적 및 페이지 컨텍스트 추출 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { PageContext } from "./PreviewPanel";

/** webview 타입 — executeJavaScript + 탐색 메서드 + Electron 이벤트 지원 */
type WebviewEl = HTMLElement & {
  executeJavaScript(code: string): Promise<unknown>;
  goBack(): void;
  goForward(): void;
  reload(): void;
  stop(): void;
  loadURL(url: string): void;
  canGoBack(): boolean;
  canGoForward(): boolean;
};

/** PreviewPanel이 UrlContent를 명령형으로 제어하기 위한 핸들 */
export type UrlHandle = {
  goBack(): void;
  goForward(): void;
  reloadOrStop(): void;
  loadURL(url: string): void;
};

export type NavState = {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  currentUrl: string;
};

/**
 * 외부 URL을 webview로 렌더링 — 네비게이션 이벤트 추적 및 페이지 컨텍스트 추출
 *
 * forwardRef + useImperativeHandle로 부모(PreviewPanel)가 goBack/goForward 등을 호출한다.
 * new-window 이벤트를 가로채 인탭 탐색으로 전환한다.
 */
const PreviewUrlContent = forwardRef<
  UrlHandle,
  {
    url: string;
    onPageContextChange?: (ctx: PageContext | null) => void;
    onNavStateChange?: (s: NavState) => void;
    onNewWindow?: (url: string) => void;
  }
>(({ url, onPageContextChange, onNavStateChange, onNewWindow }, ref) => {
  const webviewRef = useRef<HTMLElement>(null);
  const onPageContextChangeRef = useRef(onPageContextChange);
  onPageContextChangeRef.current = onPageContextChange;
  const onNavStateChangeRef = useRef(onNavStateChange);
  onNavStateChangeRef.current = onNavStateChange;
  const onNewWindowRef = useRef(onNewWindow);
  onNewWindowRef.current = onNewWindow;
  const isLoadingRef = useRef(false);

  useImperativeHandle(ref, () => ({
    goBack: () => (webviewRef.current as WebviewEl | null)?.goBack(),
    goForward: () => (webviewRef.current as WebviewEl | null)?.goForward(),
    reloadOrStop: () => {
      const wv = webviewRef.current as WebviewEl | null;
      isLoadingRef.current ? wv?.stop() : wv?.reload();
    },
    loadURL: (u: string) => (webviewRef.current as WebviewEl | null)?.loadURL(u),
  }));

  useEffect(() => {
    const webview = webviewRef.current as WebviewEl | null;
    if (!webview) return;

    const pushNav = (loading: boolean, currentUrl?: string) => {
      isLoadingRef.current = loading;
      onNavStateChangeRef.current?.({
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward(),
        isLoading: loading,
        currentUrl: currentUrl ?? url,
      });
    };

    const handleFinishLoad = async () => {
      let currentUrl = url;
      let title = "";
      let text = "";
      try {
        currentUrl = String(await webview.executeJavaScript("location.href"));
        title = String(await webview.executeJavaScript("document.title"));
        text = String(await webview.executeJavaScript("document.body.innerText")).slice(0, 3000);
      } catch {
        /* CSP 등 무시 */
      }
      pushNav(false, currentUrl);
      onPageContextChangeRef.current?.({ url: currentUrl, title, text });
    };

    const handleStartLoading = () => pushNav(true);
    const handleNavigate = (e: Event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const navUrl = (e as any).url as string | undefined;
      if (navUrl) pushNav(false, navUrl);
    };

    const handleNewWindow = (e: Event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newUrl = (e as any).url as string | undefined;
      if (newUrl?.startsWith("http://") || newUrl?.startsWith("https://")) {
        onNewWindowRef.current?.(newUrl);
      }
    };

    webview.addEventListener("did-finish-load", handleFinishLoad);
    webview.addEventListener("did-start-loading", handleStartLoading);
    webview.addEventListener("did-navigate", handleNavigate);
    webview.addEventListener("did-navigate-in-page", handleNavigate);
    webview.addEventListener("new-window", handleNewWindow);
    return () => {
      webview.removeEventListener("did-finish-load", handleFinishLoad);
      webview.removeEventListener("did-start-loading", handleStartLoading);
      webview.removeEventListener("did-navigate", handleNavigate);
      webview.removeEventListener("did-navigate-in-page", handleNavigate);
      webview.removeEventListener("new-window", handleNewWindow);
      onPageContextChangeRef.current?.(null);
    };
  }, [url]);

  return (
    <webview
      ref={webviewRef as React.RefObject<HTMLElement>}
      src={url}
      style={{ width: "100%", height: "100%", display: "flex" }}
    />
  );
});
PreviewUrlContent.displayName = "PreviewUrlContent";

export default PreviewUrlContent;
