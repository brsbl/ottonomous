import { create } from 'zustand';

/**
 * Theme type definition
 */
export type Theme = 'dark' | 'light';

/**
 * LocalStorage key for persisting theme preference
 */
const THEME_STORAGE_KEY = 'ableton-project-manager-theme';

/**
 * Get the initial theme based on:
 * 1. Saved preference in localStorage
 * 2. System preference
 * 3. Default to dark (Ableton-inspired)
 */
function getInitialTheme(): Theme {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  }

  // Default to dark theme (Ableton-inspired)
  return 'dark';
}

/**
 * Apply theme class to document.documentElement
 */
function applyTheme(theme: Theme): void {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

/**
 * Persist theme to localStorage
 */
function persistTheme(theme: Theme): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}

/**
 * Theme store state interface
 */
interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

/**
 * Zustand store for theme management
 */
export const useThemeStore = create<ThemeState>((set, get) => {
  // Get initial theme and apply it immediately
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);

  return {
    theme: initialTheme,

    toggleTheme: () => {
      const currentTheme = get().theme;
      const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      persistTheme(newTheme);
      set({ theme: newTheme });
    },

    setTheme: (theme: Theme) => {
      applyTheme(theme);
      persistTheme(theme);
      set({ theme });
    },
  };
});
