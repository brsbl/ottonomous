/**
 * Zustand store for theme (dark/light mode) management.
 * Persists theme preference to localStorage and respects system preference initially.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * LocalStorage key for persisting theme preference
 */
const STORAGE_KEY = 'kanban-theme';

/**
 * Get the initial theme based on system preference
 */
const getInitialTheme = (): Theme => {
  // Check if user has a saved preference
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.state?.theme === 'dark' || parsed.state?.theme === 'light') {
        return parsed.state.theme;
      }
    } catch {
      // Ignore parse errors, use system preference
    }
  }

  // Check system preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return 'light';
};

/**
 * Apply theme to document.documentElement
 */
const applyTheme = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

/**
 * Zustand store for theme state management
 * Uses persist middleware to automatically save to and load from LocalStorage
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),

      setTheme: (theme: Theme) => {
        applyTheme(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        set({ theme: newTheme });
      },
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state: ThemeState | undefined) => {
        // Apply theme after rehydration from localStorage
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

/**
 * Initialize theme on app load
 * This should be called early in the app lifecycle
 */
export const initializeTheme = () => {
  const theme = useThemeStore.getState().theme;
  applyTheme(theme);
};
