import { useState, useEffect, useCallback } from 'react';
import {
  Theme,
  getStoredTheme,
  setTheme as setThemeUtil,
  getEffectiveTheme,
  initializeTheme,
  subscribeToSystemTheme,
} from '../lib/theme';

export interface UseThemeReturn {
  /** Current theme setting ('light' | 'dark' | 'system') */
  theme: Theme;
  /** Resolved theme ('light' | 'dark') - what's actually being displayed */
  resolvedTheme: 'light' | 'dark';
  /** Set the theme preference */
  setTheme: (theme: Theme) => void;
  /** Toggle between light and dark (ignores system) */
  toggleTheme: () => void;
}

/**
 * Hook for managing theme state with localStorage persistence
 * and system preference synchronization.
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Initialize from stored preference or default to system
    return getStoredTheme() || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    return getEffectiveTheme(theme);
  });

  // Initialize theme on mount
  useEffect(() => {
    const initialTheme = initializeTheme();
    setThemeState(initialTheme);
    setResolvedTheme(getEffectiveTheme(initialTheme));
  }, []);

  // Update resolved theme when theme changes
  useEffect(() => {
    setResolvedTheme(getEffectiveTheme(theme));
  }, [theme]);

  // Subscribe to system theme changes when using 'system' preference
  useEffect(() => {
    if (theme !== 'system') {
      return;
    }

    const unsubscribe = subscribeToSystemTheme((systemTheme) => {
      setResolvedTheme(systemTheme);
      // Re-apply theme to ensure DOM is updated
      setThemeUtil('system');
    });

    return unsubscribe;
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setThemeUtil(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}
