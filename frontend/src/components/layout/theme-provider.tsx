"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme-store";

/**
 * Mounts on the client and aligns the zustand store with the value the
 * inline boot script wrote to <html>. The boot script runs synchronously
 * before hydration to avoid a flash of the wrong theme.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useThemeStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return <>{children}</>;
}

/**
 * SSR-safe inline script that reads localStorage and sets the .dark class
 * on <html> BEFORE React hydrates, eliminating the FOUC.
 */
export const themeBootScript = `(() => {
  try {
    var k = '11408-theme';
    var v = localStorage.getItem(k);
    if (v !== 'light' && v !== 'dark') v = 'dark';
    var c = document.documentElement.classList;
    if (v === 'dark') c.add('dark'); else c.remove('dark');
    document.documentElement.style.colorScheme = v;
  } catch (e) { /* noop */ }
})();`;
