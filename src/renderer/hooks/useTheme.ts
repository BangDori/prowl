/** 테마 설정을 읽고 data-theme 속성을 document에 적용하는 훅 */
import { useSettings } from "@renderer/components/sections/useSettings";
import type { Theme } from "@shared/types";
import { useEffect } from "react";

export function useTheme() {
  const { data: settings } = useSettings();
  const theme: Theme = settings?.theme ?? "system";

  useEffect(() => {
    const html = document.documentElement;

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = (e: MediaQueryListEvent | MediaQueryList) => {
        html.setAttribute("data-theme", e.matches ? "dark" : "light");
      };
      apply(mq);
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    } else {
      html.setAttribute("data-theme", theme);
    }

    return () => {
      html.removeAttribute("data-theme");
    };
  }, [theme]);

  return theme;
}
