/**
 * Board component - main container for the kanban board.
 * Displays columns in a horizontal flex layout with overflow scrolling.
 * Supports drag-and-drop for both cards and columns.
 * Includes search and filter functionality for cards.
 */

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useBoardStore } from '../store/boardStore';
import { useThemeStore, initializeTheme } from '../store/themeStore';
import { Column } from './Column';
import { CardModal } from './CardModal';
import { Card as CardComponent } from './Card';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { EmptyBoardState } from './EmptyBoardState';
import { exportBoard, importBoard } from '../utils/exportImport';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import type { Card, Column as ColumnType, Priority } from '../types';

/**
 * LocalStorage key for tracking first-time user status
 */
const FIRST_TIME_USER_KEY = 'kanban-first-time-user';

/**
 * Priority options for filtering
 */
const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export function Board() {
  const board = useBoardStore((state) => state.board);
  const cards = useBoardStore((state) => state.cards);
  const labels = useBoardStore((state) => state.labels);
  const addColumn = useBoardStore((state) => state.addColumn);
  const addCard = useBoardStore((state) => state.addCard);
  const updateCard = useBoardStore((state) => state.updateCard);
  const deleteCard = useBoardStore((state) => state.deleteCard);
  const moveCard = useBoardStore((state) => state.moveCard);
  const moveColumn = useBoardStore((state) => state.moveColumn);
  const undo = useBoardStore((state) => state.undo);
  const redo = useBoardStore((state) => state.redo);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [showLabelFilter, setShowLabelFilter] = useState(false);
  const [showPriorityFilter, setShowPriorityFilter] = useState(false);
  const labelFilterRef = useRef<HTMLDivElement>(null);
  const priorityFilterRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State for keyboard shortcuts modal
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // State for delete confirmation via keyboard shortcut
  const [pendingDeleteCardId, setPendingDeleteCardId] = useState<string | null>(null);

  // State for tracking selected card for modal (set via click or keyboard)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const selectedCard: Card | null = selectedCardId ? cards[selectedCardId] ?? null : null;

  // State for tracking the currently dragging card for DragOverlay
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const activeCard: Card | null = activeCardId ? cards[activeCardId] ?? null : null;

  // State for tracking the currently dragging column for DragOverlay
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const activeColumn: ColumnType | null = activeColumnId
    ? board.columns.find((col) => col.id === activeColumnId) ?? null
    : null;

  // State for first-time user onboarding
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(() => {
    // Check localStorage on initial render
    const stored = localStorage.getItem(FIRST_TIME_USER_KEY);
    return stored === null; // True if never visited before
  });

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, []);

  // Mark user as not first-time after they've seen the board
  useEffect(() => {
    if (isFirstTimeUser) {
      // Don't immediately dismiss - wait for user interaction or timeout
      const timeout = setTimeout(() => {
        localStorage.setItem(FIRST_TIME_USER_KEY, 'false');
      }, 60000); // Keep hint visible for 1 minute before auto-dismissing
      return () => clearTimeout(timeout);
    }
  }, [isFirstTimeUser]);

  /**
   * Dismiss the first-time user hint
   */
  const handleDismissFirstTimeHint = () => {
    setIsFirstTimeUser(false);
    localStorage.setItem(FIRST_TIME_USER_KEY, 'false');
  };

  // Keyboard navigation callback - opens card modal when Enter is pressed
  const handleKeyboardCardSelect = useCallback(
    (_columnIndex: number, _cardIndex: number, cardId: string) => {
      setSelectedCardId(cardId);
    },
    []
  );

  // Keyboard navigation hook - tracks selected column and card for arrow key navigation
  const {
    selectedColumnIndex,
    selectedCardIndex,
    isNavigating,
  } = useKeyboardNavigation({
    columns: board.columns,
    onCardSelect: handleKeyboardCardSelect,
    enabled: selectedCardId === null, // Disable when modal is open
  });

  // Clear keyboard navigation when modal closes
  useEffect(() => {
    if (selectedCardId === null && isNavigating) {
      // Modal just closed - keep navigation active for continued browsing
    }
  }, [selectedCardId, isNavigating]);

  /**
   * Get the currently selected card ID for keyboard shortcuts
   */
  const getSelectedCardId = useCallback((): string | null => {
    if (selectedColumnIndex >= 0 && selectedColumnIndex < board.columns.length && selectedCardIndex >= 0) {
      const column = board.columns[selectedColumnIndex];
      if (selectedCardIndex < column.cardIds.length) {
        return column.cardIds[selectedCardIndex];
      }
    }
    return null;
  }, [board.columns, selectedColumnIndex, selectedCardIndex]);

  /**
   * Get the currently selected column ID for keyboard shortcuts
   */
  const getSelectedColumnId = useCallback((): string | null => {
    if (selectedColumnIndex >= 0 && selectedColumnIndex < board.columns.length) {
      return board.columns[selectedColumnIndex].id;
    }
    // Default to first column if nothing selected
    if (board.columns.length > 0) {
      return board.columns[0].id;
    }
    return null;
  }, [board.columns, selectedColumnIndex]);

  /**
   * Handle new card shortcut (n key)
   */
  const handleNewCardShortcut = useCallback((columnId: string) => {
    addCard(columnId, { title: 'New Card', labels: [] });
  }, [addCard]);

  /**
   * Handle edit card shortcut (e key)
   */
  const handleEditCardShortcut = useCallback((cardId: string) => {
    setSelectedCardId(cardId);
  }, []);

  /**
   * Handle delete card shortcut (d key) - shows confirmation
   */
  const handleDeleteCardShortcut = useCallback((cardId: string) => {
    setPendingDeleteCardId(cardId);
  }, []);

  /**
   * Confirm delete for keyboard shortcut deletion
   */
  const handleConfirmShortcutDelete = useCallback(() => {
    if (pendingDeleteCardId) {
      deleteCard(pendingDeleteCardId);
      setPendingDeleteCardId(null);
    }
  }, [pendingDeleteCardId, deleteCard]);

  /**
   * Cancel delete for keyboard shortcut deletion
   */
  const handleCancelShortcutDelete = useCallback(() => {
    setPendingDeleteCardId(null);
  }, []);

  /**
   * Handle move card to next column shortcut (m key)
   */
  const handleMoveCardNextShortcut = useCallback((cardId: string, currentColumnId: string) => {
    const currentColumnIndex = board.columns.findIndex(col => col.id === currentColumnId);
    if (currentColumnIndex >= 0 && currentColumnIndex < board.columns.length - 1) {
      const nextColumn = board.columns[currentColumnIndex + 1];
      moveCard(cardId, currentColumnId, nextColumn.id, nextColumn.cardIds.length);
    }
  }, [board.columns, moveCard]);

  /**
   * Handle move card to previous column shortcut (Shift+m key)
   */
  const handleMoveCardPreviousShortcut = useCallback((cardId: string, currentColumnId: string) => {
    const currentColumnIndex = board.columns.findIndex(col => col.id === currentColumnId);
    if (currentColumnIndex > 0) {
      const prevColumn = board.columns[currentColumnIndex - 1];
      moveCard(cardId, currentColumnId, prevColumn.id, prevColumn.cardIds.length);
    }
  }, [board.columns, moveCard]);

  /**
   * Handle show help shortcut (? key)
   */
  const handleShowHelpShortcut = useCallback(() => {
    setShowShortcutsModal(true);
  }, []);

  /**
   * Handle focus search shortcut (/ key)
   */
  const handleFocusSearchShortcut = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  // Keyboard shortcuts hook - handles action shortcuts (n, e, d, m, M, Ctrl+Z, etc.)
  useKeyboardShortcuts({
    enabled: selectedCardId === null && !showShortcutsModal && !pendingDeleteCardId,
    selectedColumnIndex,
    selectedCardIndex,
    getSelectedCardId,
    getSelectedColumnId,
    onNewCard: handleNewCardShortcut,
    onEditCard: handleEditCardShortcut,
    onDeleteCard: handleDeleteCardShortcut,
    onMoveCardNext: handleMoveCardNextShortcut,
    onMoveCardPrevious: handleMoveCardPreviousShortcut,
    onUndo: undo,
    onRedo: redo,
    onShowHelp: handleShowHelpShortcut,
    onFocusSearch: handleFocusSearchShortcut,
  });

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (labelFilterRef.current && !labelFilterRef.current.contains(event.target as Node)) {
        setShowLabelFilter(false);
      }
      if (priorityFilterRef.current && !priorityFilterRef.current.contains(event.target as Node)) {
        setShowPriorityFilter(false);
      }
    };

    if (showLabelFilter || showPriorityFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLabelFilter, showPriorityFilter]);

  /**
   * Check if a card matches the current search and filter criteria
   */
  const cardMatchesFilters = useCallback((card: Card): boolean => {
    // Check search query (case-insensitive title contains)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (!card.title.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Check label filter (card must have at least one selected label)
    if (selectedLabelIds.length > 0) {
      const cardLabelIds = card.labels?.map((l) => l.id) ?? [];
      const hasMatchingLabel = selectedLabelIds.some((labelId) =>
        cardLabelIds.includes(labelId)
      );
      if (!hasMatchingLabel) {
        return false;
      }
    }

    // Check priority filter (card priority must be one of selected)
    if (selectedPriorities.length > 0) {
      if (!card.priority || !selectedPriorities.includes(card.priority)) {
        return false;
      }
    }

    return true;
  }, [searchQuery, selectedLabelIds, selectedPriorities]);

  /**
   * Toggle a label in the filter selection
   */
  const toggleLabelFilter = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  /**
   * Toggle a priority in the filter selection
   */
  const togglePriorityFilter = (priority: Priority) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLabelIds([]);
    setSelectedPriorities([]);
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = searchQuery.trim() !== '' || selectedLabelIds.length > 0 || selectedPriorities.length > 0;

  // Configure drag-and-drop sensors for pointer and keyboard interactions
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Require 8px movement before drag starts (prevents accidental drags)
    },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  /**
   * Find which column a card belongs to
   */
  const findColumnForCard = (cardId: string): string | null => {
    for (const column of board.columns) {
      if (column.cardIds.includes(cardId)) {
        return column.id;
      }
    }
    return null;
  };

  /**
   * Handle drag start event - track the active dragging item (card or column) for overlay
   */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeType = active.data.current?.type;

    if (activeType === 'column') {
      // Dragging a column
      setActiveColumnId(active.id as string);
      setActiveCardId(null);
    } else {
      // Dragging a card
      setActiveCardId(active.id as string);
      setActiveColumnId(null);
    }
  };

  /**
   * Handle drag end event - move card or column to new position
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeType = active.data.current?.type;

    // Clear the active items for overlay
    setActiveCardId(null);
    setActiveColumnId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle column reordering
    if (activeType === 'column') {
      const overType = over.data.current?.type;

      // Only reorder if dropping over another column
      if (overType === 'column') {
        const fromIndex = board.columns.findIndex((col) => col.id === activeId);
        const toIndex = board.columns.findIndex((col) => col.id === overId);

        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
          moveColumn(fromIndex, toIndex);
        }
      }
      return;
    }

    // Handle card drag-and-drop
    // Find source column for the dragged card
    const sourceColumnId = findColumnForCard(activeId);
    if (!sourceColumnId) return;

    // Determine the destination column and index
    let destinationColumnId: string;
    let destinationIndex: number;

    // Check if dropping over another card
    const overCardColumnId = findColumnForCard(overId);
    if (overCardColumnId) {
      // Dropping over a card - insert at that card's position
      destinationColumnId = overCardColumnId;
      const targetColumn = board.columns.find((col) => col.id === overCardColumnId);
      if (targetColumn) {
        destinationIndex = targetColumn.cardIds.indexOf(overId);
        // If dragging down within the same column, adjust index
        if (sourceColumnId === destinationColumnId) {
          const sourceIndex = targetColumn.cardIds.indexOf(activeId);
          if (sourceIndex < destinationIndex) {
            destinationIndex = destinationIndex;
          }
        }
      } else {
        return;
      }
    } else {
      // Dropping over a column droppable zone (empty area) - check for -droppable suffix
      let columnId = overId;
      if (overId.endsWith('-droppable')) {
        columnId = overId.replace('-droppable', '');
      }
      const targetColumn = board.columns.find((col) => col.id === columnId);
      if (targetColumn) {
        destinationColumnId = columnId;
        // Append to end of column
        destinationIndex = targetColumn.cardIds.length;
      } else {
        return;
      }
    }

    // Only move if something changed
    if (
      sourceColumnId === destinationColumnId &&
      board.columns.find((c) => c.id === sourceColumnId)?.cardIds.indexOf(activeId) ===
        destinationIndex
    ) {
      return;
    }

    // Move the card
    moveCard(activeId, sourceColumnId, destinationColumnId, destinationIndex);
  };

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const newColumnInputRef = useRef<HTMLInputElement>(null);
  const [pendingImportData, setPendingImportData] = useState<{
    board: typeof board;
    cards: typeof cards;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Get cards for a specific column by resolving card IDs to Card objects.
   * Applies current search and filter criteria.
   */
  const getColumnCards = useCallback((cardIds: string[]) => {
    return cardIds
      .map((id) => cards[id])
      .filter((card): card is Card => card !== undefined)
      .filter(cardMatchesFilters);
  }, [cards, cardMatchesFilters]);

  /**
   * Calculate total visible cards across all columns after filtering
   */
  const totalVisibleCards = useMemo(() => {
    return board.columns.reduce((sum, column) => {
      return sum + column.cardIds
        .map((id) => cards[id])
        .filter((card): card is Card => card !== undefined)
        .filter(cardMatchesFilters).length;
    }, 0);
  }, [board.columns, cards, cardMatchesFilters]);

  /**
   * Calculate total cards in the board (unfiltered)
   */
  const totalCards = useMemo(() => {
    return Object.keys(cards).length;
  }, [cards]);

  /**
   * Check if the board is completely empty (no cards at all)
   */
  const isBoardEmpty = totalCards === 0;

  /**
   * Handle card click - open the card modal
   */
  const handleCardClick = (cardId: string) => {
    setSelectedCardId(cardId);
  };

  /**
   * Handle card modal close
   */
  const handleCloseModal = () => {
    setSelectedCardId(null);
  };

  /**
   * Handle card save from modal
   */
  const handleSaveCard = (updates: Partial<Card>) => {
    if (selectedCardId) {
      updateCard(selectedCardId, updates);
    }
  };

  /**
   * Handle card delete from modal
   */
  const handleDeleteCard = () => {
    if (selectedCardId) {
      deleteCard(selectedCardId);
      setSelectedCardId(null);
    }
  };

  /**
   * Handle export button click - downloads board as JSON
   */
  const handleExport = () => {
    exportBoard(board, cards);
  };

  /**
   * Handle import button click - opens file picker
   */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle file selection for import
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be selected again
    event.target.value = '';

    try {
      setImportError(null);
      const data = await importBoard(file);
      setPendingImportData({ board: data.board, cards: data.cards });
      setShowConfirmDialog(true);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import file');
    }
  };

  /**
   * Confirm and apply the imported board data
   */
  const handleConfirmImport = () => {
    if (pendingImportData) {
      // Update the store with imported data
      useBoardStore.setState({
        board: pendingImportData.board,
        cards: pendingImportData.cards,
      });
    }
    setShowConfirmDialog(false);
    setPendingImportData(null);
  };

  /**
   * Cancel the import operation
   */
  const handleCancelImport = () => {
    setShowConfirmDialog(false);
    setPendingImportData(null);
  };

  /**
   * Handle adding a new column
   */
  const handleAddColumn = () => {
    const trimmedTitle = newColumnTitle.trim();
    if (trimmedTitle) {
      addColumn(trimmedTitle);
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  /**
   * Handle keyboard events for new column input
   */
  const handleNewColumnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddColumn();
    } else if (e.key === 'Escape') {
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  /**
   * Cancel adding a new column
   */
  const handleCancelAddColumn = () => {
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  // Focus new column input when adding starts
  useEffect(() => {
    if (isAddingColumn && newColumnInputRef.current) {
      newColumnInputRef.current.focus();
    }
  }, [isAddingColumn]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
      {/* Board Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{board.title}</h1>
            {board.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{board.description}</p>
            )}
          </div>

          {/* Search and Filter Section */}
          <div className="flex-1 max-w-2xl flex items-center gap-2">
            {/* Search Bar */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards... (press / to focus)"
                className="w-full pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Label Filter Dropdown */}
            <div className="relative" ref={labelFilterRef}>
              <button
                onClick={() => {
                  setShowLabelFilter(!showLabelFilter);
                  setShowPriorityFilter(false);
                }}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  selectedLabelIds.length > 0
                    ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600'
                    : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                Labels
                {selectedLabelIds.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                    {selectedLabelIds.length}
                  </span>
                )}
              </button>
              {showLabelFilter && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-20 py-1">
                  {labels.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      No labels available
                    </div>
                  ) : (
                    labels.map((label) => (
                      <button
                        key={label.id}
                        onClick={() => toggleLabelFilter(label.id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="flex-1 text-gray-700 dark:text-gray-200 truncate">
                          {label.name}
                        </span>
                        {selectedLabelIds.includes(label.id) && (
                          <svg
                            className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    ))
                  )}
                  {selectedLabelIds.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                      <button
                        onClick={() => setSelectedLabelIds([])}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Clear label filter
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Priority Filter Dropdown */}
            <div className="relative" ref={priorityFilterRef}>
              <button
                onClick={() => {
                  setShowPriorityFilter(!showPriorityFilter);
                  setShowLabelFilter(false);
                }}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  selectedPriorities.length > 0
                    ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600'
                    : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                  />
                </svg>
                Priority
                {selectedPriorities.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                    {selectedPriorities.length}
                  </span>
                )}
              </button>
              {showPriorityFilter && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-20 py-1">
                  {PRIORITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => togglePriorityFilter(option.value)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between"
                    >
                      <span className="text-gray-700 dark:text-gray-200">{option.label}</span>
                      {selectedPriorities.includes(option.value) && (
                        <svg
                          className="w-4 h-4 text-blue-600 dark:text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                  {selectedPriorities.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                      <button
                        onClick={() => setSelectedPriorities([])}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Clear priority filter
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                title="Clear all filters"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Export/Import/Theme Toolbar */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* Keyboard Shortcuts Help */}
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="inline-flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              title="Keyboard shortcuts (press ?)"
              aria-label="Show keyboard shortcuts"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              )}
            </button>

            <button
              onClick={handleExport}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              title="Export board as JSON"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export
            </button>

            <button
              onClick={handleImportClick}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              title="Import board from JSON"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import
            </button>

            {/* Hidden file input for import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Filter Status Bar - shows when filters are active */}
        {hasActiveFilters && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Showing {totalVisibleCards} of {totalCards} cards
            </span>
            {totalVisibleCards === 0 && totalCards > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                - No matching cards found
              </span>
            )}
          </div>
        )}

        {/* Import error message */}
        {importError && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-red-700 dark:text-red-300">{importError}</span>
              <button
                onClick={() => setImportError(null)}
                className="ml-auto text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-backdrop-fade-in motion-reduce:animate-none">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-modal-scale-in motion-reduce:animate-none transition-all duration-200 ease-out">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Import Board?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              This will replace your current board and all its cards with the imported data. This
              action cannot be undone.
            </p>
            {pendingImportData && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-4 text-sm">
                <p className="font-medium text-gray-700 dark:text-gray-200">
                  Board: {pendingImportData.board.title}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {pendingImportData.board.columns.length} columns,{' '}
                  {Object.keys(pendingImportData.cards).length} cards
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelImport}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Card Confirmation Dialog (for keyboard shortcut deletion) */}
      {pendingDeleteCardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-backdrop-fade-in motion-reduce:animate-none">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-modal-scale-in motion-reduce:animate-none transition-all duration-200 ease-out">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Card?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete this card? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelShortcutDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmShortcutDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcut Hint Banner for first-time users (only when board has cards) */}
      {isFirstTimeUser && !isBoardEmpty && (
        <div className="mx-6 mt-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 animate-card-enter">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Tip: Press</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                ?
              </kbd>
              <span>to view keyboard shortcuts for faster navigation</span>
            </div>
            <button
              onClick={handleDismissFirstTimeHint}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Dismiss"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Empty Board State - shown when board has no cards */}
      {isBoardEmpty && (
        <EmptyBoardState
          isFirstTimeUser={isFirstTimeUser}
          onDismissFirstTimeHint={handleDismissFirstTimeHint}
          onShowKeyboardShortcuts={() => setShowShortcutsModal(true)}
        />
      )}

      {/* Columns Container - horizontal scroll with DndContext wrapper */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex gap-4 h-full min-w-max">
            {/* Wrap columns in SortableContext for column reordering */}
            <SortableContext
              items={board.columns.map((col) => col.id)}
              strategy={horizontalListSortingStrategy}
            >
              {board.columns.map((column, colIndex) => (
                <Column
                  key={column.id}
                  column={column}
                  cards={getColumnCards(column.cardIds)}
                  onCardClick={handleCardClick}
                  selectedCardIndex={
                    isNavigating && selectedColumnIndex === colIndex
                      ? selectedCardIndex
                      : -1
                  }
                />
              ))}
            </SortableContext>

            {/* Add Column Button/Form */}
            <div className="flex-shrink-0 w-[300px]">
              {isAddingColumn ? (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow p-3">
                  <input
                    ref={newColumnInputRef}
                    type="text"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={handleNewColumnKeyDown}
                    placeholder="Enter column title..."
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleAddColumn}
                      className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    >
                      Add Column
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAddColumn}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingColumn(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Column
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Drag Overlay - shows card or column preview while dragging */}
        <DragOverlay>
          {activeCard ? (
            <CardComponent card={activeCard} isOverlay />
          ) : activeColumn ? (
            <Column
              column={activeColumn}
              cards={getColumnCards(activeColumn.cardIds)}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Card Modal for viewing/editing card details */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          onSave={handleSaveCard}
          onDelete={handleDeleteCard}
          onClose={handleCloseModal}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}

      {/* Delete Confirmation Dialog (for keyboard shortcut deletion) */}
      {pendingDeleteCardId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-backdrop-fade-in motion-reduce:animate-none"
          onClick={handleCancelShortcutDelete}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full mx-4 p-6 animate-modal-scale-in motion-reduce:animate-none transition-all duration-200 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Card?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete "{cards[pendingDeleteCardId]?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelShortcutDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmShortcutDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Board;
