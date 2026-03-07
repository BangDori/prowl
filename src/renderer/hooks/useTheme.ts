/** 테마 설정에 따라 <html>에 data-theme 속성을 설정하는 훅 */
import type { Theme } from "@shared/types";
import { useEffect } from "react";
import { useSettings } from "../components/sections/useSettings";

function applyTheme(theme: Theme): void {
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export function useTheme(): void {
  const { data: settings } = useSettings();
  const theme: Theme = settings?.theme ?? "system";

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
}
