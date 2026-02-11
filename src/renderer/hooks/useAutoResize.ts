/** 콘텐츠 높이 기반 윈도우 자동 리사이즈 훅 */
import { useEffect, useRef } from "react";

/**
 * 콘텐츠 높이에 맞춰 윈도우 크기를 자동 조정하는 훅
 */
export function useAutoResize(disabled = false) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
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
  }, [disabled]);

  return ref;
}
