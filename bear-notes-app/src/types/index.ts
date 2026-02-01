/**
 * Core types for the Bear Notes App
 * Based on the spec data model
 */

/**
 * A note in the application
 */
export interface Note {
  /** UUID v4 identifier */
  id: string;
  /** Extracted from first H1 or first line */
  title: string;
  /** Raw markdown content */
  content: string;
  /** Extracted tags array, e.g., ["work", "work/projects"] */
  tags: string[];
  /** When the note was created */
  createdAt: Date;
  /** When the note was last modified */
  updatedAt: Date;
  /** Whether the note is archived (hidden from main list) */
  isArchived: boolean;
  /** Whether the note is pinned to the top */
  isPinned: boolean;
}

/**
 * A tag in the application
 * Tags are derived from notes, not stored separately
 */
export interface Tag {
  /** Full path: "work/projects/alpha" */
  name: string;
  /** Computed from notes containing this tag */
  noteCount: number;
  /** Whether the tag is pinned to the top of the sidebar */
  isPinned: boolean;
  /** Optional custom color for the tag */
  color?: string;
}

/**
 * Application settings
 */
export interface AppSettings {
  /** Current theme: light, dark, or follow system preference */
  theme: 'light' | 'dark' | 'system';
  /** Editor font size */
  fontSize: 'small' | 'medium' | 'large';
  /** Whether the sidebar is visible */
  sidebarVisible: boolean;
  /** How notes are sorted in the list */
  sortOrder: 'updated' | 'created' | 'title';
}

/**
 * A search result item
 */
export interface SearchResult {
  /** The matching note */
  note: Note;
  /** Highlighted title with matches wrapped */
  highlightedTitle?: string;
  /** Highlighted content snippet with matches wrapped */
  highlightedContent?: string;
  /** Relevance score from search engine */
  score: number;
}

/**
 * Hierarchical tag tree node for sidebar display
 */
export interface TagTreeNode {
  /** The tag name (just the leaf part, e.g., "projects" not "work/projects") */
  name: string;
  /** Full path of the tag (e.g., "work/projects") */
  fullPath: string;
  /** Number of notes with this exact tag or any child tag */
  noteCount: number;
  /** Whether this tag is pinned */
  isPinned: boolean;
  /** Child tags */
  children: TagTreeNode[];
}

/**
 * Note creation input (subset of Note without auto-generated fields)
 */
export type NoteInput = Pick<Note, 'content'> & Partial<Pick<Note, 'title'>>;

/**
 * Note update input (all fields optional except id)
 */
export type NoteUpdate = Partial<Omit<Note, 'id' | 'createdAt'>>;

/**
 * Default settings for new users
 */
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  fontSize: 'medium',
  sidebarVisible: true,
  sortOrder: 'updated',
};
