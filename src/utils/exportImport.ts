/**
 * Export/Import utilities for the Kanban Board application.
 * Provides functions to export board data to JSON and import from JSON files.
 */

import type { Board, Card, Column, Label } from '../types';

/**
 * Data structure for exported board data
 */
export interface ExportedBoardData {
  version: string;
  exportedAt: string;
  board: Board;
  cards: Record<string, Card>;
}

/**
 * Validation result for imported data
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Check if a value is a non-null object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validate that a label has the required structure
 */
function isValidLabel(label: unknown): label is Label {
  if (!isObject(label)) return false;
  return (
    typeof label.id === 'string' &&
    typeof label.name === 'string' &&
    typeof label.color === 'string'
  );
}

/**
 * Validate that a card has the required structure
 */
function isValidCard(card: unknown): card is Card {
  if (!isObject(card)) return false;

  // Required fields
  if (typeof card.id !== 'string') return false;
  if (typeof card.title !== 'string') return false;
  if (typeof card.createdAt !== 'string') return false;
  if (typeof card.updatedAt !== 'string') return false;
  if (!Array.isArray(card.labels)) return false;

  // Validate all labels
  for (const label of card.labels) {
    if (!isValidLabel(label)) return false;
  }

  // Optional fields type checks
  if (card.description !== undefined && typeof card.description !== 'string') return false;
  if (card.priority !== undefined &&
      !['low', 'medium', 'high', 'urgent'].includes(card.priority as string)) return false;
  if (card.dueDate !== undefined && typeof card.dueDate !== 'string') return false;
  if (card.assignee !== undefined && typeof card.assignee !== 'string') return false;

  return true;
}

/**
 * Validate that a column has the required structure
 */
function isValidColumn(column: unknown): column is Column {
  if (!isObject(column)) return false;

  // Required fields
  if (typeof column.id !== 'string') return false;
  if (typeof column.title !== 'string') return false;
  if (!Array.isArray(column.cardIds)) return false;

  // Validate cardIds are strings
  for (const cardId of column.cardIds) {
    if (typeof cardId !== 'string') return false;
  }

  // Optional fields type checks
  if (column.wipLimit !== undefined && typeof column.wipLimit !== 'number') return false;
  if (column.color !== undefined && typeof column.color !== 'string') return false;

  return true;
}

/**
 * Validate that a board has the required structure
 */
function isValidBoard(board: unknown): board is Board {
  if (!isObject(board)) return false;

  // Required fields
  if (typeof board.id !== 'string') return false;
  if (typeof board.title !== 'string') return false;
  if (typeof board.createdAt !== 'string') return false;
  if (typeof board.updatedAt !== 'string') return false;
  if (!Array.isArray(board.columns)) return false;

  // Validate all columns
  for (const column of board.columns) {
    if (!isValidColumn(column)) return false;
  }

  // Optional fields type checks
  if (board.description !== undefined && typeof board.description !== 'string') return false;

  return true;
}

/**
 * Validate that a cards object has the required structure
 */
function isValidCardsMap(cards: unknown): cards is Record<string, Card> {
  if (!isObject(cards)) return false;

  for (const [id, card] of Object.entries(cards)) {
    if (typeof id !== 'string') return false;
    if (!isValidCard(card)) return false;
  }

  return true;
}

/**
 * Validate imported board data structure
 * @param data - The parsed JSON data to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateImportedData(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return { valid: false, error: 'Invalid data format: expected an object' };
  }

  // Check for required top-level fields
  if (typeof data.version !== 'string') {
    return { valid: false, error: 'Missing or invalid version field' };
  }

  if (typeof data.exportedAt !== 'string') {
    return { valid: false, error: 'Missing or invalid exportedAt field' };
  }

  if (!isValidBoard(data.board)) {
    return { valid: false, error: 'Invalid board structure' };
  }

  if (!isValidCardsMap(data.cards)) {
    return { valid: false, error: 'Invalid cards structure' };
  }

  // Cross-validate: all cardIds in columns should exist in cards map
  const board = data.board as Board;
  const cards = data.cards as Record<string, Card>;

  for (const column of board.columns) {
    for (const cardId of column.cardIds) {
      if (!cards[cardId]) {
        return {
          valid: false,
          error: `Card "${cardId}" referenced in column "${column.title}" does not exist in cards map`
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Export board and cards data to a JSON file
 * Creates a blob and triggers a download
 * @param board - The board data to export
 * @param cards - The cards map to export
 */
export function exportBoard(board: Board, cards: Record<string, Card>): void {
  const exportData: ExportedBoardData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    board,
    cards,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Create a temporary link element and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${board.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Import board data from a JSON file
 * Parses the file and validates the data structure
 * @param file - The File object to read
 * @returns Promise resolving to the validated board data or throwing an error
 */
export async function importBoard(file: File): Promise<ExportedBoardData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') {
          reject(new Error('Failed to read file content'));
          return;
        }

        const data = JSON.parse(content);
        const validation = validateImportedData(data);

        if (!validation.valid) {
          reject(new Error(validation.error || 'Invalid data format'));
          return;
        }

        resolve(data as ExportedBoardData);
      } catch (error) {
        if (error instanceof SyntaxError) {
          reject(new Error('Invalid JSON format'));
        } else {
          reject(error);
        }
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
