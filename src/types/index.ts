/**
 * TypeScript type definitions for the Personal Knowledge Base application.
 * These types define the core data model for notes, folders, tags, templates,
 * smart collections, and graph visualization.
 */

// =============================================================================
// Personal Knowledge Base Types
// =============================================================================

/**
 * Note represents a single knowledge entry with Markdown content.
 */
export interface Note {
  /** Unique identifier (UUID) */
  id: string;
  /** Note title (also used as display name) */
  title: string;
  /** Markdown content */
  content: string;
  /** Parent folder ID, null if at root */
  folderId: string | null;
  /** Array of tag IDs */
  tags: string[];
  /** Timestamp when note was created */
  createdAt: Date;
  /** Timestamp when note was last updated */
  updatedAt: Date;
  /** Flag indicating if this is a daily note */
  isDaily: boolean;
  /** Date string (YYYY-MM-DD) for daily notes */
  dailyDate?: string;
  /** Template ID this note was created from */
  templateId?: string;
}

/**
 * Folder for organizing notes hierarchically.
 */
export interface Folder {
  /** Unique identifier */
  id: string;
  /** Folder display name */
  name: string;
  /** Parent folder ID for nesting, null if at root */
  parentId: string | null;
  /** Optional folder color for visual distinction */
  color?: string;
  /** Timestamp when folder was created */
  createdAt: Date;
}

/**
 * Tag for categorizing notes with colored labels.
 */
export interface Tag {
  /** Unique identifier */
  id: string;
  /** Tag display name */
  name: string;
  /** Color for visual distinction (hex, rgb, or named color) */
  color: string;
  /** Timestamp when tag was created */
  createdAt: Date;
}

/**
 * Template category types for built-in and custom templates.
 */
export type TemplateCategory = 'daily' | 'meeting' | 'project' | 'custom';

/**
 * Template for creating notes with predefined structure.
 */
export interface Template {
  /** Unique identifier */
  id: string;
  /** Template display name */
  name: string;
  /** Template content with {{placeholders}} */
  content: string;
  /** Category for organizing templates */
  category: TemplateCategory;
  /** Timestamp when template was created */
  createdAt: Date;
}

/**
 * Field types that can be used in collection rules.
 */
export type CollectionRuleField = 'tag' | 'folder' | 'createdAt' | 'content';

/**
 * Operators for collection rule comparisons.
 */
export type CollectionRuleOperator = 'contains' | 'equals' | 'before' | 'after';

/**
 * Rule for filtering notes in smart collections.
 */
export interface CollectionRule {
  /** Field to filter on */
  field: CollectionRuleField;
  /** Comparison operator */
  operator: CollectionRuleOperator;
  /** Value to compare against */
  value: string;
}

/**
 * SmartCollection auto-filters notes based on defined rules.
 */
export interface SmartCollection {
  /** Unique identifier */
  id: string;
  /** Collection display name */
  name: string;
  /** Array of filter rules (combined with AND logic) */
  rules: CollectionRule[];
  /** Timestamp when collection was created */
  createdAt: Date;
}

/**
 * NoteLink represents a bidirectional link between notes.
 */
export interface NoteLink {
  /** Note ID containing the link */
  sourceId: string;
  /** Note ID being linked to */
  targetId: string;
  /** Surrounding text context for backlink display */
  context: string;
}

/**
 * GraphNode represents a note in the graph visualization.
 */
export interface GraphNode {
  /** Note ID */
  id: string;
  /** Note title for display */
  title: string;
  /** Number of connections (links) */
  linkCount: number;
  /** X position in graph (set by D3 force simulation) */
  x?: number;
  /** Y position in graph (set by D3 force simulation) */
  y?: number;
  /** Fixed X position (for pinned nodes) */
  fx?: number | null;
  /** Fixed Y position (for pinned nodes) */
  fy?: number | null;
}

/**
 * GraphEdge represents a link between nodes in the graph.
 */
export interface GraphEdge {
  /** Source node ID */
  source: string | GraphNode;
  /** Target node ID */
  target: string | GraphNode;
}

/**
 * GraphData contains all data needed for graph visualization.
 */
export interface GraphData {
  /** Array of graph nodes (one per note) */
  nodes: GraphNode[];
  /** Array of graph edges (one per link) */
  edges: GraphEdge[];
}

// =============================================================================
// Legacy Kanban Board Types (for backward compatibility)
// =============================================================================

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
