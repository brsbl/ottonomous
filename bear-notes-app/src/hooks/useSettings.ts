/**
 * useSettings Hook
 * Provides reactive access to app settings from the Zustand store
 */

import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import type { AppSettings } from '../types';

/**
 * Return type for the useSettings hook
 */
interface UseSettingsResult {
  // State
  settings: AppSettings;
  isLoading: boolean;

  // Derived state
  theme: AppSettings['theme'];
  fontSize: AppSettings['fontSize'];
  sidebarVisible: boolean;
  sortOrder: AppSettings['sortOrder'];

  // Actions
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  setTheme: (theme: AppSettings['theme']) => Promise<void>;
  setFontSize: (fontSize: AppSettings['fontSize']) => Promise<void>;
  toggleSidebar: () => Promise<void>;
  setSortOrder: (sortOrder: AppSettings['sortOrder']) => Promise<void>;
  loadSettings: () => Promise<void>;
}

/**
 * Hook for accessing and managing app settings
 *
 * Provides:
 * - settings: Full settings object
 * - Individual settings values (theme, fontSize, etc.)
 * - isLoading: Whether settings are being loaded
 * - Actions for updating settings
 *
 * @example
 * ```tsx
 * function SettingsPanel() {
 *   const { theme, setTheme, fontSize, setFontSize } = useSettings();
 *
 *   return (
 *     <div>
 *       <select value={theme} onChange={e => setTheme(e.target.value)}>
 *         <option value="light">Light</option>
 *         <option value="dark">Dark</option>
 *         <option value="system">System</option>
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSettings(): UseSettingsResult {
  // Select state from the store
  const settings = useAppStore((state) => state.settings);
  const isLoading = useAppStore((state) => state.settingsLoading);

  // Get actions from the store
  const storeUpdateSettings = useAppStore((state) => state.updateSettings);
  const storeLoadSettings = useAppStore((state) => state.loadSettings);

  // Wrap actions with useCallback for stable references
  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => storeUpdateSettings(updates),
    [storeUpdateSettings]
  );

  const setTheme = useCallback(
    (theme: AppSettings['theme']) => storeUpdateSettings({ theme }),
    [storeUpdateSettings]
  );

  const setFontSize = useCallback(
    (fontSize: AppSettings['fontSize']) => storeUpdateSettings({ fontSize }),
    [storeUpdateSettings]
  );

  const toggleSidebar = useCallback(
    () => {
      // Use getState() to read current value, avoiding stale closure
      const currentVisible = useAppStore.getState().settings.sidebarVisible;
      return storeUpdateSettings({ sidebarVisible: !currentVisible });
    },
    [storeUpdateSettings]
  );

  const setSortOrder = useCallback(
    (sortOrder: AppSettings['sortOrder']) => storeUpdateSettings({ sortOrder }),
    [storeUpdateSettings]
  );

  const loadSettings = useCallback(() => storeLoadSettings(), [storeLoadSettings]);

  return {
    // Full settings object
    settings,
    isLoading,

    // Individual values for convenience
    theme: settings.theme,
    fontSize: settings.fontSize,
    sidebarVisible: settings.sidebarVisible,
    sortOrder: settings.sortOrder,

    // Actions
    updateSettings,
    setTheme,
    setFontSize,
    toggleSidebar,
    setSortOrder,
    loadSettings,
  };
}
