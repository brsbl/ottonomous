/**
 * Column component - vertical container for cards in a kanban column.
 * Displays column header with title and card count, scrollable card list,
 * and an add card button.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Column as ColumnType, Card as CardType } from '../types';
import { Card } from './Card';
import { useBoardStore } from '../store/boardStore';

interface ColumnProps {
  /** The column data */
  column: ColumnType;
  /** Array of cards in this column */
  cards: CardType[];
  /** Optional callback when a card is clicked */
  onCardClick?: (cardId: string) => void;
}

/**
 * Column component that renders a vertical container with header,
 * scrollable card list, and add card button.
 */
export function Column({ column, cards, onCardClick }: ColumnProps) {
  // Make column droppable for card drag-and-drop
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const addCardInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="flex flex-col min-w-[300px] bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
      {/* Column Header */}
      <div className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-t-lg">
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
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-300 dark:bg-gray-600 px-2 py-0.5 rounded-full">
              {cards.length}
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
                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-10">
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

      {/* Scrollable Card List Area - droppable zone with SortableContext */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 overflow-y-auto min-h-[200px] space-y-2 transition-colors ${
          isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
        }`}
      >
        <SortableContext
          items={cards.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onClick={() => onCardClick?.(card.id)}
            />
          ))}
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
            className="w-full flex items-center justify-center gap-1 py-2 px-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
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
