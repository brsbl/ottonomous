export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'kanban-theme';

/**
 * Detect the system's color scheme preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Get the stored theme preference from localStorage
 */
export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return null;
}

/**
 * Store the theme preference in localStorage
 */
export function storeTheme(theme: Theme): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Get the effective theme (resolves 'system' to actual theme)
 */
export function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Apply the theme to the document
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') {
    return;
  }

  const effectiveTheme = getEffectiveTheme(theme);
  const root = document.documentElement;

  // Remove both theme classes first
  root.classList.remove('light', 'dark');

  // Add the effective theme class
  root.classList.add(effectiveTheme);
}

/**
 * Set and persist the theme
 */
export function setTheme(theme: Theme): void {
  storeTheme(theme);
  applyTheme(theme);
}

/**
 * Initialize theme on app load
 */
export function initializeTheme(): Theme {
  const storedTheme = getStoredTheme();
  const theme = storedTheme || 'system';
  applyTheme(theme);
  return theme;
}

/**
 * Subscribe to system theme changes
 */
export function subscribeToSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };

  mediaQuery.addEventListener('change', handler);

  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}
