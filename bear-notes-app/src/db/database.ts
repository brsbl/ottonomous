/**
 * Dexie.js database configuration for Bear Notes App
 * Provides IndexedDB storage with proper indexes for efficient queries
 */

import Dexie, { type Table } from 'dexie';
import type { Note, AppSettings } from '../types';

/**
 * NotesDatabase - Dexie.js wrapper for IndexedDB storage
 *
 * Tables:
 * - notes: Store all notes with indexes for efficient queries
 * - settings: Store application settings (single row)
 *
 * Indexes on notes:
 * - id: Primary key (UUID)
 * - title: For sorting alphabetically
 * - *tags: Multi-entry index for tag filtering
 * - createdAt: For sorting by creation date
 * - updatedAt: For sorting by last modified
 * - isArchived: For filtering archived/active notes
 */
export class NotesDatabase extends Dexie {
  notes!: Table<Note, string>;
  settings!: Table<AppSettings & { id: string }, string>;

  constructor() {
    super('BearNotesDB');

    this.version(1).stores({
      // id is primary key, *tags creates multi-entry index for array
      notes: 'id, title, *tags, createdAt, updatedAt, isArchived',
      // settings uses a fixed id for single-row storage
      settings: 'id',
    });
  }
}

/**
 * Singleton database instance
 * Use this throughout the application for all database operations
 */
export const db = new NotesDatabase();

/**
 * Initialize database with default settings if empty
 * Should be called on application startup
 */
export async function initializeDatabase(): Promise<void> {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      id: 'app-settings',
      theme: 'system',
      fontSize: 'medium',
      sidebarVisible: true,
      sortOrder: 'updated',
    });
  }
}
