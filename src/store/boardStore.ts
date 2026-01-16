/**
 * Zustand store for the Kanban Board application.
 * Manages board state, cards, and all CRUD operations.
 * Includes LocalStorage persistence via Zustand persist middleware.
 * Includes undo/redo functionality with history stack.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Board, Card, Column, Label } from '../types';

/**
 * Generate a unique ID using crypto.randomUUID()
 */
const generateId = (): string => crypto.randomUUID();

/**
 * Get current ISO timestamp
 */
const now = (): string => new Date().toISOString();

/**
 * Maximum number of history states to keep (prevents memory bloat)
 */
const MAX_HISTORY_SIZE = 50;

/**
 * Snapshot of board and cards state for undo/redo
 */
interface HistorySnapshot {
  board: Board;
  cards: Record<string, Card>;
}

/**
 * Predefined label colors for the kanban board
 */
const DEFAULT_LABELS: Label[] = [
  { id: 'label-red', name: 'Red', color: '#ef4444' },
  { id: 'label-orange', name: 'Orange', color: '#f97316' },
  { id: 'label-yellow', name: 'Yellow', color: '#eab308' },
  { id: 'label-green', name: 'Green', color: '#22c55e' },
  { id: 'label-blue', name: 'Blue', color: '#3b82f6' },
  { id: 'label-purple', name: 'Purple', color: '#a855f7' },
];

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
  labels: Label[];

  // History for undo/redo
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  // Computed properties for undo/redo
  canUndo: () => boolean;
  canRedo: () => boolean;

  // History actions
  undo: () => void;
  redo: () => void;

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

  // Label actions
  addLabel: (label: Omit<Label, 'id'>) => void;
}

/**
 * LocalStorage key for persisting board state
 */
const STORAGE_KEY = 'kanban-board';

/**
 * Helper to create a snapshot of the current state
 */
const createSnapshot = (state: { board: Board; cards: Record<string, Card> }): HistorySnapshot => ({
  board: JSON.parse(JSON.stringify(state.board)),
  cards: JSON.parse(JSON.stringify(state.cards)),
});

/**
 * Helper to push current state to history before making changes
 */
const pushToHistory = (state: { board: Board; cards: Record<string, Card>; past: HistorySnapshot[] }): HistorySnapshot[] => {
  const snapshot = createSnapshot(state);
  const newPast = [...state.past, snapshot];
  // Limit history size to prevent memory bloat
  if (newPast.length > MAX_HISTORY_SIZE) {
    return newPast.slice(-MAX_HISTORY_SIZE);
  }
  return newPast;
};

/**
 * Zustand store for board state management
 * Uses persist middleware to automatically save to and load from LocalStorage
 */
export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      // Initial state
      board: createDefaultBoard(),
      cards: {},
      labels: DEFAULT_LABELS,
      past: [],
      future: [],

      // Computed properties for undo/redo
      canUndo: () => get().past.length > 0,
      canRedo: () => get().future.length > 0,

      // Undo: pop from past, push current to future, restore
      undo: () =>
        set((state) => {
          if (state.past.length === 0) return state;

          const newPast = [...state.past];
          const previousState = newPast.pop()!;
          const currentSnapshot = createSnapshot(state);

          return {
            board: previousState.board,
            cards: previousState.cards,
            past: newPast,
            future: [currentSnapshot, ...state.future].slice(0, MAX_HISTORY_SIZE),
          };
        }),

      // Redo: pop from future, push current to past, restore
      redo: () =>
        set((state) => {
          if (state.future.length === 0) return state;

          const newFuture = [...state.future];
          const nextState = newFuture.shift()!;
          const currentSnapshot = createSnapshot(state);

          return {
            board: nextState.board,
            cards: nextState.cards,
            past: [...state.past, currentSnapshot].slice(-MAX_HISTORY_SIZE),
            future: newFuture,
          };
        }),

      // Set entire board
      setBoard: (board: Board) =>
        set((state) => ({
          past: pushToHistory(state),
          future: [], // Clear future on new action
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
            past: pushToHistory(state),
            future: [], // Clear future on new action
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
          past: pushToHistory(state),
          future: [], // Clear future on new action
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
            past: pushToHistory(state),
            future: [], // Clear future on new action
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
            past: pushToHistory(state),
            future: [], // Clear future on new action
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
            past: pushToHistory(state),
            future: [], // Clear future on new action
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
            past: pushToHistory(state),
            future: [], // Clear future on new action
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
            past: pushToHistory(state),
            future: [], // Clear future on new action
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
            past: pushToHistory(state),
            future: [], // Clear future on new action
            board: {
              ...state.board,
              columns,
              updatedAt: now(),
            },
          };
        }),

      // Add a new custom label
      addLabel: (labelData: Omit<Label, 'id'>) =>
        set((state) => {
          const newLabel: Label = {
            ...labelData,
            id: generateId(),
          };
          return {
            labels: [...state.labels, newLabel],
          };
        }),
    }),
    {
      name: STORAGE_KEY,
      // Persist board, cards, labels, and history state
      partialize: (state) => ({
        board: state.board,
        cards: state.cards,
        labels: state.labels,
        past: state.past,
        future: state.future,
      }),
    }
  )
);
