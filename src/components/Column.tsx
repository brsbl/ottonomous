/**
 * Column component - vertical container for cards in a kanban column.
 * Displays column header with title and card count, scrollable card list,
 * and an add card button. Supports WIP (Work In Progress) limits with visual warnings.
 * Supports drag-and-drop for column reordering.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Column as ColumnType, Card as CardType } from '../types';
import { Card } from './Card';
import { EmptyColumnState } from './EmptyColumnState';
import { useBoardStore } from '../store/boardStore';

interface ColumnProps {
  /** The column data */
  column: ColumnType;
  /** Array of cards in this column */
  cards: CardType[];
  /** Optional callback when a card is clicked */
  onCardClick?: (cardId: string) => void;
  /** Whether this is an overlay version (for drag preview) */
  isOverlay?: boolean;
  /** Index of the selected card for keyboard navigation (-1 if none) */
  selectedCardIndex?: number;
}

/**
 * Column component that renders a vertical container with header,
 * scrollable card list, and add card button. Includes WIP limit display and warnings.
 */
export function Column({ column, cards, onCardClick, isOverlay = false, selectedCardIndex = -1 }: ColumnProps) {
  // Make column sortable for column drag-and-drop reordering
  const {
    attributes,
    listeners,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
    disabled: isOverlay,
  });

  // Make column droppable for card drag-and-drop (for the card list area)
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: `${column.id}-droppable`,
    data: {
      type: 'column',
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showWipSettings, setShowWipSettings] = useState(false);
  const [wipLimitInput, setWipLimitInput] = useState(column.wipLimit?.toString() ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const addCardInputRef = useRef<HTMLInputElement>(null);
  const wipInputRef = useRef<HTMLInputElement>(null);

  // Calculate WIP limit status
  const cardCount = cards.length;
  const hasWipLimit = column.wipLimit !== undefined && column.wipLimit !== null;
  const isAtLimit = hasWipLimit && cardCount >= column.wipLimit!;
  const isOverLimit = hasWipLimit && cardCount > column.wipLimit!;

  const updateColumn = useBoardStore((state) => state.updateColumn);
  const deleteColumn = useBoardStore((state) => state.deleteColumn);
  const addCard = useBoardStore((state) => state.addCard);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Focus add card input when form opens
  useEffect(() => {
    if (isAddingCard && addCardInputRef.current) {
      addCardInputRef.current.focus();
    }
  }, [isAddingCard]);

  // Focus WIP limit input when settings open
  useEffect(() => {
    if (showWipSettings && wipInputRef.current) {
      wipInputRef.current.focus();
      wipInputRef.current.select();
    }
  }, [showWipSettings]);

  // Update local wipLimitInput when column.wipLimit changes
  useEffect(() => {
    setWipLimitInput(column.wipLimit?.toString() ?? '');
  }, [column.wipLimit]);

  /**
   * Start editing the column title
   */
  const handleStartEdit = () => {
    setEditTitle(column.title);
    setIsEditing(true);
    setShowMenu(false);
  };

  /**
   * Save the edited title
   */
  const handleSaveEdit = () => {
    const trimmedTitle = editTitle.trim();
    if (trimmedTitle && trimmedTitle !== column.title) {
      updateColumn(column.id, { title: trimmedTitle });
    }
    setIsEditing(false);
  };

  /**
   * Cancel editing and restore original title
   */
  const handleCancelEdit = () => {
    setEditTitle(column.title);
    setIsEditing(false);
  };

  /**
   * Handle keyboard events for title editing
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  /**
   * Handle column deletion with confirmation
   */
  const handleDelete = () => {
    setShowMenu(false);

    if (cards.length > 0) {
      const confirmed = window.confirm(
        `Delete "${column.title}"?\n\nThis column contains ${cards.length} card${cards.length > 1 ? 's' : ''} that will also be deleted. This action cannot be undone.`
      );
      if (!confirmed) return;
    }

    deleteColumn(column.id);
  };

  /**
   * Open WIP limit settings
   */
  const handleOpenWipSettings = () => {
    setShowMenu(false);
    setWipLimitInput(column.wipLimit?.toString() ?? '');
    setShowWipSettings(true);
  };

  /**
   * Save the WIP limit
   */
  const handleSaveWipLimit = () => {
    const trimmedInput = wipLimitInput.trim();
    if (trimmedInput === '') {
      // Clear WIP limit
      updateColumn(column.id, { wipLimit: undefined });
    } else {
      const limit = parseInt(trimmedInput, 10);
      if (!isNaN(limit) && limit > 0) {
        updateColumn(column.id, { wipLimit: limit });
      }
    }
    setShowWipSettings(false);
  };

  /**
   * Clear/remove WIP limit
   */
  const handleClearWipLimit = () => {
    updateColumn(column.id, { wipLimit: undefined });
    setWipLimitInput('');
    setShowWipSettings(false);
  };

  /**
   * Cancel WIP limit editing
   */
  const handleCancelWipSettings = () => {
    setWipLimitInput(column.wipLimit?.toString() ?? '');
    setShowWipSettings(false);
  };

  /**
   * Handle keyboard events for WIP limit input
   */
  const handleWipInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveWipLimit();
    } else if (e.key === 'Escape') {
      handleCancelWipSettings();
    }
  };

  /**
   * Open the add card form
   */
  const handleStartAddCard = () => {
    setIsAddingCard(true);
    setNewCardTitle('');
  };

  /**
   * Create a new card with the entered title
   */
  const handleAddCard = useCallback(() => {
    const trimmedTitle = newCardTitle.trim();
    if (trimmedTitle) {
      addCard(column.id, {
        title: trimmedTitle,
        labels: [],
      });
      setNewCardTitle('');
      // Keep form open for quick multiple card creation
    }
  }, [addCard, column.id, newCardTitle]);

  /**
   * Cancel adding a new card
   */
  const handleCancelAddCard = useCallback(() => {
    setIsAddingCard(false);
    setNewCardTitle('');
  }, []);

  /**
   * Handle keyboard events for add card input
   */
  const handleAddCardKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCard();
      } else if (e.key === 'Escape') {
        handleCancelAddCard();
      }
    },
    [handleAddCard, handleCancelAddCard]
  );

  // Determine container styling based on WIP limit status
  const getContainerClassName = () => {
    let baseClass = `flex flex-col min-w-[300px] rounded-lg shadow
      transition-all duration-200 ease-in-out
      motion-reduce:transition-none
      ${isDragging ? 'opacity-50 scale-[1.02]' : 'animate-column-enter'}
      ${isOverlay ? 'shadow-xl ring-2 ring-blue-500 scale-[1.02]' : ''}`;
    if (isOverLimit) {
      return `${baseClass} bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-400`;
    } else if (isAtLimit) {
      return `${baseClass} bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500 dark:border-orange-400`;
    }
    return `${baseClass} bg-gray-100 dark:bg-gray-800`;
  };

  // Determine header styling based on WIP limit status
  const getHeaderClassName = () => {
    let baseClass = 'px-3 py-2 rounded-t-lg cursor-grab active:cursor-grabbing';
    if (isOverLimit) {
      return `${baseClass} bg-red-100 dark:bg-red-900/40`;
    } else if (isAtLimit) {
      return `${baseClass} bg-orange-100 dark:bg-orange-900/40`;
    }
    return `${baseClass} bg-gray-200 dark:bg-gray-700`;
  };

  // Determine card count badge styling based on WIP limit status
  const getBadgeClassName = () => {
    let baseClass = 'text-xs px-2 py-0.5 rounded-full flex items-center gap-1';
    if (isOverLimit) {
      return `${baseClass} text-red-700 dark:text-red-300 bg-red-200 dark:bg-red-800/50 font-semibold`;
    } else if (isAtLimit) {
      return `${baseClass} text-orange-700 dark:text-orange-300 bg-orange-200 dark:bg-orange-800/50 font-semibold`;
    }
    return `${baseClass} text-gray-500 dark:text-gray-400 bg-gray-300 dark:bg-gray-600`;
  };

  return (
    <div
      ref={setSortableNodeRef}
      style={style}
      className={getContainerClassName()}
    >
      {/* Column Header - acts as drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={getHeaderClassName()}>
        <div className="flex items-center justify-between">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              className="font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 px-2 py-0.5 rounded border border-blue-500 outline-none flex-1 mr-2"
            />
          ) : (
            <h2
              className="font-semibold text-gray-700 dark:text-gray-200 cursor-pointer hover:text-gray-900 dark:hover:text-white"
              onClick={handleStartEdit}
              title="Click to edit column title"
            >
              {column.title}
            </h2>
          )}
          <div className="flex items-center gap-2">
            {/* Card count badge with optional WIP limit display */}
            <span
              className={getBadgeClassName()}
              title={hasWipLimit ? `${cardCount} of ${column.wipLimit} cards (WIP limit)` : `${cardCount} cards`}
            >
              {/* Warning icon when at or over limit */}
              {isAtLimit && (
                <svg
                  className={`w-3 h-3 ${isOverLimit ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {/* Show "current/limit" format when WIP limit is set, otherwise just show count */}
              {hasWipLimit ? `${cardCount}/${column.wipLimit}` : cardCount}
            </span>
            {/* Column Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                title="Column options"
              >
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenWipSettings}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    WIP Limit
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WIP Limit Settings Modal */}
      {showWipSettings && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-600">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Work In Progress Limit
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={wipInputRef}
                type="number"
                min="1"
                value={wipLimitInput}
                onChange={(e) => setWipLimitInput(e.target.value)}
                onKeyDown={handleWipInputKeyDown}
                placeholder="No limit"
                className="flex-1 px-2 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleSaveWipLimit}
                className="px-2 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save
              </button>
            </div>
            <div className="flex items-center gap-2">
              {hasWipLimit && (
                <button
                  type="button"
                  onClick={handleClearWipLimit}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  Remove limit
                </button>
              )}
              <button
                type="button"
                onClick={handleCancelWipSettings}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ml-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Card List Area - droppable zone with SortableContext */}
      <div
        ref={setDroppableNodeRef}
        className={`flex-1 p-2 overflow-y-auto min-h-[200px] space-y-2
          transition-colors duration-200 ease-in-out
          motion-reduce:transition-none
          ${isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
      >
        <SortableContext
          items={cards.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.length === 0 ? (
            <EmptyColumnState
              columnName={column.title}
              onAddCard={handleStartAddCard}
            />
          ) : (
            cards.map((card, index) => (
              <Card
                key={card.id}
                card={card}
                onClick={() => onCardClick?.(card.id)}
                isSelected={selectedCardIndex === index}
              />
            ))
          )}
        </SortableContext>
      </div>

      {/* Add Card Section */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-600">
        {isAddingCard ? (
          /* Inline Add Card Form */
          <div className="space-y-2">
            <input
              ref={addCardInputRef}
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleAddCardKeyDown}
              placeholder="Enter card title..."
              className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddCard}
                disabled={!newCardTitle.trim()}
                className="flex-1 py-1.5 px-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={handleCancelAddCard}
                className="py-1.5 px-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Add Card Button */
          <button
            type="button"
            onClick={handleStartAddCard}
            className="w-full flex items-center justify-center gap-1 py-2 px-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded
              transition-all duration-200 ease-in-out
              hover:shadow-sm
              motion-reduce:transition-none"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add card
          </button>
        )}
      </div>
    </div>
  );
}

export default Column;
