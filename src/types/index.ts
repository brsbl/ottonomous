/**
 * TypeScript type definitions for the Kanban Board application.
 * These types define the core data model for boards, columns, cards, and labels.
 */

/**
 * Priority levels for cards, ordered from lowest to highest urgency.
 */
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Label for categorizing cards with colored tags.
 */
export interface Label {
  /** Unique identifier for the label */
  id: string;
  /** Display name of the label */
  name: string;
  /** Color for the label (hex, rgb, or named color) */
  color: string;
}

/**
 * Card represents a task or work item on the board.
 */
export interface Card {
  /** Unique identifier for the card */
  id: string;
  /** Title/name of the card */
  title: string;
  /** Optional detailed description of the card */
  description?: string;
  /** Labels attached to this card for categorization */
  labels: Label[];
  /** Optional priority level of the card */
  priority?: Priority;
  /** Optional due date in ISO 8601 format */
  dueDate?: string;
  /** Optional assignee name or identifier */
  assignee?: string;
  /** ISO 8601 timestamp when the card was created */
  createdAt: string;
  /** ISO 8601 timestamp when the card was last updated */
  updatedAt: string;
}

/**
 * Column represents a vertical lane on the board containing cards.
 */
export interface Column {
  /** Unique identifier for the column */
  id: string;
  /** Display title of the column */
  title: string;
  /** Optional work-in-progress limit; undefined means unlimited */
  wipLimit?: number;
  /** Optional accent color for the column header */
  color?: string;
  /** Ordered list of card IDs in this column */
  cardIds: string[];
}

/**
 * Board is the top-level container for columns and represents the entire kanban board.
 */
export interface Board {
  /** Unique identifier for the board */
  id: string;
  /** Display title of the board */
  title: string;
  /** Optional description of the board's purpose */
  description?: string;
  /** Ordered list of columns on the board */
  columns: Column[];
  /** ISO 8601 timestamp when the board was created */
  createdAt: string;
  /** ISO 8601 timestamp when the board was last updated */
  updatedAt: string;
}
