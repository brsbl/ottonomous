import { useEffect, useCallback, useState } from 'react';
import { useProjectStore } from '../store/projectStore';

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  key: string;
  description: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
}

/**
 * List of available keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: '/', description: 'Focus search' },
  { key: 'Escape', description: 'Close modal / Clear selection' },
  { key: 'f', description: 'Toggle favorite on selected' },
  { key: 'a', description: 'Select all', ctrl: true, meta: true },
  { key: '?', description: 'Show keyboard shortcuts', shift: true },
];

/**
 * Check if an element is an input or textarea
 */
function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    element.isContentEditable
  );
}

/**
 * Options for the keyboard shortcuts hook
 */
interface UseKeyboardShortcutsOptions {
  onFocusSearch?: () => void;
  onCloseModal?: () => void;
  onShowHelp?: () => void;
}

/**
 * Custom hook for handling global keyboard shortcuts
 *
 * Shortcuts:
 * - / = Focus search input
 * - Escape = Close modal / clear selection
 * - F = Toggle favorite on selected project(s)
 * - Ctrl/Cmd+A = Select all projects
 * - ? = Show shortcuts help modal
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const {
    selectedProjectIds,
    projects,
    toggleFavorite,
    clearSelection,
  } = useProjectStore();

  const { onFocusSearch, onCloseModal, onShowHelp } = options;

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isInput = isInputElement(event.target);
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // / = Focus search (only when not in an input)
      if (event.key === '/' && !isInput) {
        event.preventDefault();
        if (onFocusSearch) {
          onFocusSearch();
        } else {
          // Default: find and focus the search input
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[placeholder*="Search"]'
          );
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
        return;
      }

      // Escape = Close modal or clear selection
      if (event.key === 'Escape') {
        if (showShortcutsHelp) {
          setShowShortcutsHelp(false);
          return;
        }
        if (onCloseModal) {
          onCloseModal();
        }
        if (selectedProjectIds.length > 0) {
          clearSelection();
        }
        return;
      }

      // ? (Shift+/) = Show shortcuts help
      if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
        if (!isInput) {
          event.preventDefault();
          if (onShowHelp) {
            onShowHelp();
          } else {
            setShowShortcutsHelp(true);
          }
          return;
        }
      }

      // F = Toggle favorite on selected (only when not in an input)
      if ((event.key === 'f' || event.key === 'F') && !isInput && !isCtrlOrCmd) {
        event.preventDefault();
        if (selectedProjectIds.length > 0) {
          selectedProjectIds.forEach((id) => {
            toggleFavorite(id);
          });
        }
        return;
      }

      // Ctrl/Cmd+A = Select all
      if (event.key === 'a' && isCtrlOrCmd && !isInput) {
        event.preventDefault();
        // Select all project IDs
        const allIds = projects.map((p) => p.id);
        // Set all projects as selected using the store
        useProjectStore.setState({ selectedProjectIds: allIds });
        return;
      }
    },
    [
      selectedProjectIds,
      projects,
      toggleFavorite,
      clearSelection,
      onFocusSearch,
      onCloseModal,
      onShowHelp,
      showShortcutsHelp,
    ]
  );

  /**
   * Set up global keyboard event listener
   */
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    showShortcutsHelp,
    setShowShortcutsHelp,
  };
}

export default useKeyboardShortcuts;
