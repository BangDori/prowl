/** 테마 설정에 따라 <html>에 dark 클래스를 토글하는 훅 */
import type { Theme } from "@shared/types";
import { useEffect } from "react";
import { useSettings } from "../components/sections/useSettings";

function applyDarkClass(isDark: boolean): void {
  document.documentElement.classList.toggle("dark", isDark);
}

function resolveIsDark(theme: Theme): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useTheme(): void {
  const { data: settings } = useSettings();
  const theme: Theme = settings?.theme ?? "system";

  useEffect(() => {
    applyDarkClass(resolveIsDark(theme));

    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => applyDarkClass(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);
}
