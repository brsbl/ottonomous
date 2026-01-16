/**
 * useKeyboardShortcuts hook - provides keyboard action shortcuts for the kanban board.
 * Handles shortcuts like n=new card, e=edit, d=delete, m/M=move card, etc.
 */

import { useCallback, useEffect } from 'react';

export interface UseKeyboardShortcutsProps {
  /** Whether shortcuts are enabled (disable when modal is open, etc.) */
  enabled?: boolean;
  /** Currently selected column index (-1 if none) */
  selectedColumnIndex: number;
  /** Currently selected card index (-1 if none) */
  selectedCardIndex: number;
  /** Get the currently selected card ID */
  getSelectedCardId: () => string | null;
  /** Get the column ID for current selection */
  getSelectedColumnId: () => string | null;
  /** Callback when 'n' is pressed - new card in current column */
  onNewCard?: (columnId: string) => void;
  /** Callback when 'e' is pressed - edit selected card */
  onEditCard?: (cardId: string) => void;
  /** Callback when 'd' is pressed - delete selected card (should show confirm) */
  onDeleteCard?: (cardId: string) => void;
  /** Callback when 'm' is pressed - move card to next column */
  onMoveCardNext?: (cardId: string, currentColumnId: string) => void;
  /** Callback when 'M' (Shift+m) is pressed - move card to previous column */
  onMoveCardPrevious?: (cardId: string, currentColumnId: string) => void;
  /** Callback when Ctrl+Z is pressed - undo */
  onUndo?: () => void;
  /** Callback when Ctrl+Shift+Z is pressed - redo */
  onRedo?: () => void;
  /** Callback when '?' is pressed - show help */
  onShowHelp?: () => void;
  /** Callback when '/' is pressed - focus search */
  onFocusSearch?: () => void;
}

/**
 * Hook for managing keyboard action shortcuts on the kanban board.
 */
export function useKeyboardShortcuts({
  enabled = true,
  getSelectedCardId,
  getSelectedColumnId,
  onNewCard,
  onEditCard,
  onDeleteCard,
  onMoveCardNext,
  onMoveCardPrevious,
  onUndo,
  onRedo,
  onShowHelp,
  onFocusSearch,
}: UseKeyboardShortcutsProps): void {
  /**
   * Handle keyboard events for shortcuts
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if focus is on an input, textarea, or other editable element
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Ctrl+Z and Ctrl+Shift+Z even in inputs
        if (!(event.ctrlKey || event.metaKey)) {
          return;
        }
      }

      const { key, shiftKey, ctrlKey, metaKey } = event;
      const modKey = ctrlKey || metaKey; // Support both Ctrl (Windows/Linux) and Cmd (Mac)

      // Undo: Ctrl+Z (without Shift)
      if (modKey && !shiftKey && key.toLowerCase() === 'z') {
        event.preventDefault();
        onUndo?.();
        return;
      }

      // Redo: Ctrl+Shift+Z
      if (modKey && shiftKey && key.toLowerCase() === 'z') {
        event.preventDefault();
        onRedo?.();
        return;
      }

      // The following shortcuts should not trigger when in input fields
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Show help: ?
      if (key === '?' || (shiftKey && key === '/')) {
        event.preventDefault();
        onShowHelp?.();
        return;
      }

      // Focus search: /
      if (key === '/' && !shiftKey) {
        event.preventDefault();
        onFocusSearch?.();
        return;
      }

      // New card: n
      if (key.toLowerCase() === 'n' && !modKey && !shiftKey) {
        event.preventDefault();
        const columnId = getSelectedColumnId();
        if (columnId && onNewCard) {
          onNewCard(columnId);
        }
        return;
      }

      // The following require a selected card
      const cardId = getSelectedCardId();
      const columnId = getSelectedColumnId();

      // Edit card: e
      if (key.toLowerCase() === 'e' && !modKey && !shiftKey) {
        event.preventDefault();
        if (cardId && onEditCard) {
          onEditCard(cardId);
        }
        return;
      }

      // Delete card: d
      if (key.toLowerCase() === 'd' && !modKey && !shiftKey) {
        event.preventDefault();
        if (cardId && onDeleteCard) {
          onDeleteCard(cardId);
        }
        return;
      }

      // Move card to next column: m (lowercase)
      if (key === 'm' && !modKey && !shiftKey) {
        event.preventDefault();
        if (cardId && columnId && onMoveCardNext) {
          onMoveCardNext(cardId, columnId);
        }
        return;
      }

      // Move card to previous column: M (Shift+m)
      if (key === 'M' && !modKey && shiftKey) {
        event.preventDefault();
        if (cardId && columnId && onMoveCardPrevious) {
          onMoveCardPrevious(cardId, columnId);
        }
        return;
      }
    },
    [
      enabled,
      getSelectedCardId,
      getSelectedColumnId,
      onNewCard,
      onEditCard,
      onDeleteCard,
      onMoveCardNext,
      onMoveCardPrevious,
      onUndo,
      onRedo,
      onShowHelp,
      onFocusSearch,
    ]
  );

  // Add global keyboard event listener
  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);
}

export default useKeyboardShortcuts;
