import { useEffect, useRef } from "react";

/**
 * 콘텐츠 높이에 맞춰 윈도우 크기를 자동 조정하는 훅
 */
export function useAutoResize() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      const height = el.scrollHeight;
      if (height > 0) {
        window.electronAPI.resizeWindow(height);
      }
    });

    observer.observe(el);

    // 초기 사이즈 설정
    const height = el.scrollHeight;
    if (height > 0) {
      window.electronAPI.resizeWindow(height);
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}
