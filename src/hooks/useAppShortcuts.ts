/**
 * useAppShortcuts hook - provides global keyboard shortcuts for the Personal Knowledge Base.
 * Implements app-wide shortcuts for common actions like creating notes, searching, etc.
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  registerShortcut,
  unregisterShortcut,
  SHORTCUT_KEYS,
  formatShortcut,
  getModifierSymbol,
  isMac,
} from '../lib/shortcuts';

// =============================================================================
// Types
// =============================================================================

/**
 * Callbacks for app-wide keyboard shortcuts.
 */
export interface AppShortcutCallbacks {
  /** Callback when Cmd/Ctrl+N is pressed - create new note */
  onNewNote?: () => void;
  /** Callback when Cmd/Ctrl+O is pressed - open quick switcher */
  onQuickSwitcher?: () => void;
  /** Callback when Cmd/Ctrl+P is pressed - open command palette */
  onCommandPalette?: () => void;
  /** Callback when Cmd/Ctrl+F is pressed - search in note */
  onSearchInNote?: () => void;
  /** Callback when Cmd/Ctrl+Shift+F is pressed - global search */
  onGlobalSearch?: () => void;
}

/**
 * Options for the useAppShortcuts hook.
 */
export interface UseAppShortcutsOptions extends AppShortcutCallbacks {
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean;
}

/**
 * Shortcut hint for UI display.
 */
export interface ShortcutHint {
  id: string;
  label: string;
  keys: string;
  keysArray: string[];
  description: string;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for managing app-wide keyboard shortcuts.
 * Registers shortcuts on mount and cleans up on unmount.
 *
 * @param options - Configuration options and callbacks
 * @returns Object containing shortcut hints for UI display
 */
export function useAppShortcuts(options: UseAppShortcutsOptions = {}) {
  const {
    enabled = true,
    onNewNote,
    onQuickSwitcher,
    onCommandPalette,
    onSearchInNote,
    onGlobalSearch,
  } = options;

  // Track registered shortcut IDs for cleanup
  const registeredIds = useRef<string[]>([]);

  // Memoize callbacks to avoid unnecessary re-registrations
  const stableOnNewNote = useCallback(() => onNewNote?.(), [onNewNote]);
  const stableOnQuickSwitcher = useCallback(() => onQuickSwitcher?.(), [onQuickSwitcher]);
  const stableOnCommandPalette = useCallback(() => onCommandPalette?.(), [onCommandPalette]);
  const stableOnSearchInNote = useCallback(() => onSearchInNote?.(), [onSearchInNote]);
  const stableOnGlobalSearch = useCallback(() => onGlobalSearch?.(), [onGlobalSearch]);

  // Register shortcuts on mount, cleanup on unmount
  useEffect(() => {
    if (!enabled) {
      // Unregister all if disabled
      registeredIds.current.forEach(unregisterShortcut);
      registeredIds.current = [];
      return;
    }

    const ids: string[] = [];

    // Cmd/Ctrl+N: New note
    if (onNewNote) {
      ids.push(
        registerShortcut({
          ...SHORTCUT_KEYS.NEW_NOTE,
          description: 'Create new note',
          handler: stableOnNewNote,
        })
      );
    }

    // Cmd/Ctrl+O: Quick switcher
    if (onQuickSwitcher) {
      ids.push(
        registerShortcut({
          ...SHORTCUT_KEYS.QUICK_SWITCHER,
          description: 'Open quick switcher',
          handler: stableOnQuickSwitcher,
        })
      );
    }

    // Cmd/Ctrl+P: Command palette
    if (onCommandPalette) {
      ids.push(
        registerShortcut({
          ...SHORTCUT_KEYS.COMMAND_PALETTE,
          description: 'Open command palette',
          handler: stableOnCommandPalette,
        })
      );
    }

    // Cmd/Ctrl+F: Search in note
    if (onSearchInNote) {
      ids.push(
        registerShortcut({
          ...SHORTCUT_KEYS.SEARCH_IN_NOTE,
          description: 'Search in note',
          handler: stableOnSearchInNote,
        })
      );
    }

    // Cmd/Ctrl+Shift+F: Global search
    if (onGlobalSearch) {
      ids.push(
        registerShortcut({
          ...SHORTCUT_KEYS.GLOBAL_SEARCH,
          description: 'Global search',
          handler: stableOnGlobalSearch,
        })
      );
    }

    registeredIds.current = ids;

    // Cleanup on unmount or when dependencies change
    return () => {
      ids.forEach(unregisterShortcut);
      registeredIds.current = [];
    };
  }, [
    enabled,
    onNewNote,
    onQuickSwitcher,
    onCommandPalette,
    onSearchInNote,
    onGlobalSearch,
    stableOnNewNote,
    stableOnQuickSwitcher,
    stableOnCommandPalette,
    stableOnSearchInNote,
    stableOnGlobalSearch,
  ]);

  // Generate shortcut hints for UI display
  const shortcutHints: ShortcutHint[] = [
    {
      id: 'new-note',
      label: 'New Note',
      keys: formatShortcut(SHORTCUT_KEYS.NEW_NOTE.key, SHORTCUT_KEYS.NEW_NOTE.modifiers),
      keysArray: [getModifierSymbol(), 'N'],
      description: 'Create a new note',
    },
    {
      id: 'quick-switcher',
      label: 'Quick Switcher',
      keys: formatShortcut(SHORTCUT_KEYS.QUICK_SWITCHER.key, SHORTCUT_KEYS.QUICK_SWITCHER.modifiers),
      keysArray: [getModifierSymbol(), 'O'],
      description: 'Quickly switch between notes',
    },
    {
      id: 'command-palette',
      label: 'Command Palette',
      keys: formatShortcut(SHORTCUT_KEYS.COMMAND_PALETTE.key, SHORTCUT_KEYS.COMMAND_PALETTE.modifiers),
      keysArray: [getModifierSymbol(), 'P'],
      description: 'Open command palette',
    },
    {
      id: 'search-in-note',
      label: 'Search in Note',
      keys: formatShortcut(SHORTCUT_KEYS.SEARCH_IN_NOTE.key, SHORTCUT_KEYS.SEARCH_IN_NOTE.modifiers),
      keysArray: [getModifierSymbol(), 'F'],
      description: 'Search within current note',
    },
    {
      id: 'global-search',
      label: 'Global Search',
      keys: formatShortcut(SHORTCUT_KEYS.GLOBAL_SEARCH.key, SHORTCUT_KEYS.GLOBAL_SEARCH.modifiers),
      keysArray: [getModifierSymbol(), 'Shift', 'F'],
      description: 'Search across all notes',
    },
  ];

  return {
    shortcutHints,
    isMac: isMac(),
    modifierSymbol: getModifierSymbol(),
  };
}

// =============================================================================
// Shortcut Hint Component Data
// =============================================================================

/**
 * Get all app shortcuts for display in help modal or tooltips.
 */
export function getAppShortcutHints(): ShortcutHint[] {
  const modSymbol = getModifierSymbol();

  return [
    {
      id: 'new-note',
      label: 'New Note',
      keys: `${modSymbol}+N`,
      keysArray: [modSymbol, 'N'],
      description: 'Create a new note',
    },
    {
      id: 'quick-switcher',
      label: 'Quick Switcher',
      keys: `${modSymbol}+O`,
      keysArray: [modSymbol, 'O'],
      description: 'Quickly switch between notes',
    },
    {
      id: 'command-palette',
      label: 'Command Palette',
      keys: `${modSymbol}+P`,
      keysArray: [modSymbol, 'P'],
      description: 'Open command palette',
    },
    {
      id: 'search-in-note',
      label: 'Search in Note',
      keys: `${modSymbol}+F`,
      keysArray: [modSymbol, 'F'],
      description: 'Search within current note',
    },
    {
      id: 'global-search',
      label: 'Global Search',
      keys: `${modSymbol}+Shift+F`,
      keysArray: [modSymbol, 'Shift', 'F'],
      description: 'Search across all notes',
    },
    {
      id: 'save',
      label: 'Save',
      keys: `${modSymbol}+S`,
      keysArray: [modSymbol, 'S'],
      description: 'Save current note',
    },
    {
      id: 'undo',
      label: 'Undo',
      keys: `${modSymbol}+Z`,
      keysArray: [modSymbol, 'Z'],
      description: 'Undo last action',
    },
    {
      id: 'redo',
      label: 'Redo',
      keys: `${modSymbol}+Shift+Z`,
      keysArray: [modSymbol, 'Shift', 'Z'],
      description: 'Redo last undone action',
    },
  ];
}

export default useAppShortcuts;
