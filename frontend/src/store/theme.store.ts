import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "slate" | "teal" | "violet" | "glass";
export type Mode = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  mode: Mode;

  setTheme: (theme: Theme) => void;
  setMode: (mode: Mode) => void;

  applyTheme: () => void;
}

/**
 * Safely detect system theme (client-side only)
 */
function getSystemMode(): "light" | "dark" {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      /**
       * Default UI theme + mode
       */
      theme: "slate",
      mode: "light",

      /**
       * Set color theme (slate, teal, violet, glass)
       */
      setTheme: (theme) => {
        set({ theme });
        get().applyTheme();
      },

      /**
       * Set light/dark/system mode
       */
      setMode: (mode) => {
        set({ mode });
        get().applyTheme();
      },

      /**
       * Apply BOTH:
       * - next-themes (dark/light/system)
       * - tailwind theme class (color palette)
       */
      applyTheme: () => {
        const { theme, mode } = get();

        if (typeof document === "undefined") return;

        const resolvedMode = mode === "system" ? getSystemMode() : mode;

        // store resolved mode in state (optional but useful)
        set({ mode });

        /**
         * Apply next-themes compatible class
         * <html class="dark">
         */
        document.documentElement.classList.remove("dark");
        if (resolvedMode === "dark") {
          document.documentElement.classList.add("dark");
        }

        /**
         * Apply color theme
         * <html class="theme-violet">
         */
        document.documentElement.classList.remove(
          "theme-slate",
          "theme-teal",
          "theme-violet",
          "theme-glass",
        );

        document.documentElement.classList.add(`theme-${theme}`);
      },
    }),
    {
      name: "shop-admin-theme",

      /**
       * Re-apply theme after refresh
       */
      onRehydrateStorage: () => (state) => {
        state?.applyTheme();
      },
    },
  ),
);
