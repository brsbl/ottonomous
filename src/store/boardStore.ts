/**
 * Zustand store for the Kanban Board application.
 * Manages board state, cards, and all CRUD operations.
 * Includes LocalStorage persistence via Zustand persist middleware.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Board, Card, Column } from '../types';

/**
 * Generate a unique ID using crypto.randomUUID()
 */
const generateId = (): string => crypto.randomUUID();

/**
 * Get current ISO timestamp
 */
const now = (): string => new Date().toISOString();

/**
 * Create initial default board with 3 columns
 */
const createDefaultBoard = (): Board => {
  const timestamp = now();
  return {
    id: generateId(),
    title: 'My Kanban Board',
    description: 'A simple kanban board to manage your tasks',
    columns: [
      {
        id: generateId(),
        title: 'To Do',
        cardIds: [],
      },
      {
        id: generateId(),
        title: 'In Progress',
        cardIds: [],
      },
      {
        id: generateId(),
        title: 'Done',
        cardIds: [],
      },
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

/**
 * Board store state interface
 */
interface BoardState {
  // State
  board: Board;
  cards: Record<string, Card>;

  // Board actions
  setBoard: (board: Board) => void;

  // Column actions
  addColumn: (title: string) => void;
  updateColumn: (id: string, updates: Partial<Column>) => void;
  deleteColumn: (id: string) => void;
  moveColumn: (fromIndex: number, toIndex: number) => void;

  // Card actions
  addCard: (
    columnId: string,
    card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  moveCard: (
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    toIndex: number
  ) => void;
}

/**
 * LocalStorage key for persisting board state
 */
const STORAGE_KEY = 'kanban-board';

/**
 * Zustand store for board state management
 * Uses persist middleware to automatically save to and load from LocalStorage
 */
export const useBoardStore = create<BoardState>()(
  persist(
    (set) => ({
      // Initial state
      board: createDefaultBoard(),
      cards: {},

      // Set entire board
      setBoard: (board: Board) =>
        set(() => ({
          board,
        })),

  // Add a new column to the board
  addColumn: (title: string) =>
    set((state) => {
      const newColumn: Column = {
        id: generateId(),
        title,
        cardIds: [],
      };
      return {
        board: {
          ...state.board,
          columns: [...state.board.columns, newColumn],
          updatedAt: now(),
        },
      };
    }),

  // Update an existing column
  updateColumn: (id: string, updates: Partial<Column>) =>
    set((state) => ({
      board: {
        ...state.board,
        columns: state.board.columns.map((column) =>
          column.id === id ? { ...column, ...updates } : column
        ),
        updatedAt: now(),
      },
    })),

  // Delete a column and remove its cards
  deleteColumn: (id: string) =>
    set((state) => {
      const column = state.board.columns.find((c) => c.id === id);
      const cardIdsToDelete = column?.cardIds ?? [];

      // Create new cards object without the deleted column's cards
      const newCards = { ...state.cards };
      cardIdsToDelete.forEach((cardId) => {
        delete newCards[cardId];
      });

      return {
        board: {
          ...state.board,
          columns: state.board.columns.filter((column) => column.id !== id),
          updatedAt: now(),
        },
        cards: newCards,
      };
    }),

  // Move a column from one position to another
  moveColumn: (fromIndex: number, toIndex: number) =>
    set((state) => {
      const columns = [...state.board.columns];
      const [movedColumn] = columns.splice(fromIndex, 1);
      columns.splice(toIndex, 0, movedColumn);

      return {
        board: {
          ...state.board,
          columns,
          updatedAt: now(),
        },
      };
    }),

  // Add a new card to a column
  addCard: (
    columnId: string,
    cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>
  ) =>
    set((state) => {
      const timestamp = now();
      const newCard: Card = {
        ...cardData,
        id: generateId(),
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      return {
        cards: {
          ...state.cards,
          [newCard.id]: newCard,
        },
        board: {
          ...state.board,
          columns: state.board.columns.map((column) =>
            column.id === columnId
              ? { ...column, cardIds: [...column.cardIds, newCard.id] }
              : column
          ),
          updatedAt: timestamp,
        },
      };
    }),

  // Update an existing card
  updateCard: (id: string, updates: Partial<Card>) =>
    set((state) => {
      if (!state.cards[id]) return state;

      return {
        cards: {
          ...state.cards,
          [id]: {
            ...state.cards[id],
            ...updates,
            updatedAt: now(),
          },
        },
        board: {
          ...state.board,
          updatedAt: now(),
        },
      };
    }),

  // Delete a card from the board
  deleteCard: (id: string) =>
    set((state) => {
      const newCards = { ...state.cards };
      delete newCards[id];

      return {
        cards: newCards,
        board: {
          ...state.board,
          columns: state.board.columns.map((column) => ({
            ...column,
            cardIds: column.cardIds.filter((cardId) => cardId !== id),
          })),
          updatedAt: now(),
        },
      };
    }),

  // Move a card between columns or within the same column
  moveCard: (
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    toIndex: number
  ) =>
    set((state) => {
      const columns = state.board.columns.map((column) => {
        if (column.id === fromColumnId && column.id === toColumnId) {
          // Moving within the same column
          const cardIds = column.cardIds.filter((id) => id !== cardId);
          cardIds.splice(toIndex, 0, cardId);
          return { ...column, cardIds };
        } else if (column.id === fromColumnId) {
          // Remove from source column
          return {
            ...column,
            cardIds: column.cardIds.filter((id) => id !== cardId),
          };
        } else if (column.id === toColumnId) {
          // Add to target column at specified index
          const cardIds = [...column.cardIds];
          cardIds.splice(toIndex, 0, cardId);
          return { ...column, cardIds };
        }
        return column;
      });

      return {
        board: {
          ...state.board,
          columns,
          updatedAt: now(),
        },
      };
    }),
    }),
    {
      name: STORAGE_KEY,
      // Persist both board and cards state
      partialize: (state) => ({
        board: state.board,
        cards: state.cards,
      }),
    }
  )
);
