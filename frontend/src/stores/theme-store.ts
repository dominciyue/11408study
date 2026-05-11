import { create } from "zustand";

export type Theme = "light" | "dark";

const STORAGE_KEY = "11408-theme";

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return "dark";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.style.colorScheme = theme;
}

interface ThemeState {
  theme: Theme;
  hydrated: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  hydrate: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  // Default to "dark" to match what the inline script does in SSR; the
  // hydrate() call below realigns this to the persisted value on mount.
  theme: "dark",
  hydrated: false,

  setTheme: (theme) => {
    applyTheme(theme);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        /* ignore */
      }
    }
    set({ theme });
  },

  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },

  hydrate: () => {
    if (get().hydrated) return;
    const stored = readStoredTheme();
    applyTheme(stored);
    set({ theme: stored, hydrated: true });
  },
}));
