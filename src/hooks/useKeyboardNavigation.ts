/**
 * useKeyboardNavigation hook - provides keyboard navigation for the kanban board.
 * Tracks selected column index and card index, handles arrow key navigation.
 */

import { useState, useCallback, useEffect } from 'react';

export interface KeyboardNavigationState {
  /** Currently selected column index (-1 if none selected) */
  selectedColumnIndex: number;
  /** Currently selected card index within the column (-1 if none selected) */
  selectedCardIndex: number;
  /** Whether keyboard navigation is active */
  isNavigating: boolean;
}

export interface UseKeyboardNavigationProps {
  /** Array of columns with their card counts */
  columns: Array<{
    id: string;
    cardIds: string[];
  }>;
  /** Callback when a card is selected (for opening modal, etc.) */
  onCardSelect?: (columnIndex: number, cardIndex: number, cardId: string) => void;
  /** Whether navigation is enabled (disable when modal is open, etc.) */
  enabled?: boolean;
}

export interface UseKeyboardNavigationReturn extends KeyboardNavigationState {
  /** Set selection to a specific column and card */
  setSelection: (columnIndex: number, cardIndex: number) => void;
  /** Clear the current selection */
  clearSelection: () => void;
  /** Get the currently selected card ID, if any */
  getSelectedCardId: () => string | null;
  /** Check if a specific card is selected */
  isCardSelected: (columnIndex: number, cardIndex: number) => boolean;
}

/**
 * Hook for managing keyboard navigation on the kanban board.
 * Handles arrow key navigation between columns and cards.
 */
export function useKeyboardNavigation({
  columns,
  onCardSelect,
  enabled = true,
}: UseKeyboardNavigationProps): UseKeyboardNavigationReturn {
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number>(-1);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(-1);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  /**
   * Set selection to a specific column and card index
   */
  const setSelection = useCallback((columnIndex: number, cardIndex: number) => {
    setSelectedColumnIndex(columnIndex);
    setSelectedCardIndex(cardIndex);
    setIsNavigating(true);
  }, []);

  /**
   * Clear the current selection
   */
  const clearSelection = useCallback(() => {
    setSelectedColumnIndex(-1);
    setSelectedCardIndex(-1);
    setIsNavigating(false);
  }, []);

  /**
   * Get the currently selected card ID
   */
  const getSelectedCardId = useCallback((): string | null => {
    if (
      selectedColumnIndex >= 0 &&
      selectedColumnIndex < columns.length &&
      selectedCardIndex >= 0
    ) {
      const column = columns[selectedColumnIndex];
      if (selectedCardIndex < column.cardIds.length) {
        return column.cardIds[selectedCardIndex];
      }
    }
    return null;
  }, [columns, selectedColumnIndex, selectedCardIndex]);

  /**
   * Check if a specific card is selected
   */
  const isCardSelected = useCallback(
    (columnIndex: number, cardIndex: number): boolean => {
      return (
        isNavigating &&
        selectedColumnIndex === columnIndex &&
        selectedCardIndex === cardIndex
      );
    },
    [isNavigating, selectedColumnIndex, selectedCardIndex]
  );

  /**
   * Find the next non-empty column in a given direction
   */
  const findNextColumnWithCards = useCallback(
    (startIndex: number, direction: 1 | -1): number => {
      let index = startIndex + direction;
      while (index >= 0 && index < columns.length) {
        if (columns[index].cardIds.length > 0) {
          return index;
        }
        index += direction;
      }
      // If no non-empty column found, return the column anyway (allows navigating to empty columns)
      const targetIndex = startIndex + direction;
      if (targetIndex >= 0 && targetIndex < columns.length) {
        return targetIndex;
      }
      return startIndex; // Stay at current column
    },
    [columns]
  );

  /**
   * Handle keyboard events for navigation
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
        return;
      }

      const { key } = event;

      // Arrow key navigation
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
        event.preventDefault();

        // If not currently navigating, start at the first column with cards
        if (!isNavigating || selectedColumnIndex === -1) {
          const firstColumnWithCards = columns.findIndex(
            (col) => col.cardIds.length > 0
          );
          if (firstColumnWithCards !== -1) {
            setSelectedColumnIndex(firstColumnWithCards);
            setSelectedCardIndex(0);
            setIsNavigating(true);
          } else if (columns.length > 0) {
            // All columns empty, select first column
            setSelectedColumnIndex(0);
            setSelectedCardIndex(-1);
            setIsNavigating(true);
          }
          return;
        }

        const currentColumn = columns[selectedColumnIndex];
        const currentCardCount = currentColumn?.cardIds.length ?? 0;

        switch (key) {
          case 'ArrowLeft': {
            // Move to previous column
            if (selectedColumnIndex > 0) {
              const newColumnIndex = findNextColumnWithCards(
                selectedColumnIndex,
                -1
              );
              if (newColumnIndex !== selectedColumnIndex) {
                const newColumn = columns[newColumnIndex];
                const newCardCount = newColumn.cardIds.length;
                // Keep the card index within bounds, or select last card if moving to shorter column
                const newCardIndex =
                  newCardCount > 0
                    ? Math.min(selectedCardIndex, newCardCount - 1)
                    : -1;
                setSelectedColumnIndex(newColumnIndex);
                setSelectedCardIndex(newCardIndex);
              }
            }
            break;
          }
          case 'ArrowRight': {
            // Move to next column
            if (selectedColumnIndex < columns.length - 1) {
              const newColumnIndex = findNextColumnWithCards(
                selectedColumnIndex,
                1
              );
              if (newColumnIndex !== selectedColumnIndex) {
                const newColumn = columns[newColumnIndex];
                const newCardCount = newColumn.cardIds.length;
                // Keep the card index within bounds, or select last card if moving to shorter column
                const newCardIndex =
                  newCardCount > 0
                    ? Math.min(selectedCardIndex, newCardCount - 1)
                    : -1;
                setSelectedColumnIndex(newColumnIndex);
                setSelectedCardIndex(newCardIndex);
              }
            }
            break;
          }
          case 'ArrowUp': {
            // Move to previous card in current column
            if (currentCardCount > 0) {
              if (selectedCardIndex > 0) {
                setSelectedCardIndex(selectedCardIndex - 1);
              } else {
                // Wrap to last card
                setSelectedCardIndex(currentCardCount - 1);
              }
            }
            break;
          }
          case 'ArrowDown': {
            // Move to next card in current column
            if (currentCardCount > 0) {
              if (selectedCardIndex < currentCardCount - 1) {
                setSelectedCardIndex(selectedCardIndex + 1);
              } else {
                // Wrap to first card
                setSelectedCardIndex(0);
              }
            }
            break;
          }
        }
      }

      // Enter key - trigger card select callback
      if (key === 'Enter' && isNavigating) {
        const cardId = getSelectedCardId();
        if (cardId && onCardSelect) {
          event.preventDefault();
          onCardSelect(selectedColumnIndex, selectedCardIndex, cardId);
        }
      }

      // Escape key - clear selection
      if (key === 'Escape' && isNavigating) {
        event.preventDefault();
        clearSelection();
      }
    },
    [
      enabled,
      isNavigating,
      selectedColumnIndex,
      selectedCardIndex,
      columns,
      findNextColumnWithCards,
      getSelectedCardId,
      onCardSelect,
      clearSelection,
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

  // Reset selection when columns structure changes significantly
  useEffect(() => {
    if (isNavigating) {
      // Validate current selection is still valid
      if (selectedColumnIndex >= columns.length) {
        if (columns.length > 0) {
          setSelectedColumnIndex(columns.length - 1);
          const newColumn = columns[columns.length - 1];
          const newCardCount = newColumn.cardIds.length;
          setSelectedCardIndex(newCardCount > 0 ? 0 : -1);
        } else {
          clearSelection();
        }
      } else if (selectedColumnIndex >= 0) {
        const currentColumn = columns[selectedColumnIndex];
        const currentCardCount = currentColumn?.cardIds.length ?? 0;
        if (selectedCardIndex >= currentCardCount) {
          setSelectedCardIndex(currentCardCount > 0 ? currentCardCount - 1 : -1);
        }
      }
    }
  }, [columns, isNavigating, selectedColumnIndex, selectedCardIndex, clearSelection]);

  return {
    selectedColumnIndex,
    selectedCardIndex,
    isNavigating,
    setSelection,
    clearSelection,
    getSelectedCardId,
    isCardSelected,
  };
}

export default useKeyboardNavigation;
