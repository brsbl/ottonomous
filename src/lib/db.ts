/**
 * IndexedDB database configuration using Dexie.js
 * Provides offline-first storage for the Personal Knowledge Base application.
 */

import Dexie, { type Table } from 'dexie';
import type { Note, Folder, Tag, Template, SmartCollection } from '../types';

/**
 * KnowledgeBaseDB extends Dexie to provide typed tables for all entities.
 * Schema includes indexes optimized for common query patterns.
 */
export class KnowledgeBaseDB extends Dexie {
  /** Notes table with full-text search support via indexes */
  notes!: Table<Note, string>;
  /** Folders table for hierarchical organization */
  folders!: Table<Folder, string>;
  /** Tags table for categorization */
  tags!: Table<Tag, string>;
  /** Templates table for note creation */
  templates!: Table<Template, string>;
  /** Smart collections table for dynamic note filtering */
  collections!: Table<SmartCollection, string>;

  constructor() {
    super('KnowledgeBaseDB');

    // Version 1 schema definition
    // Indexes are defined using Dexie's shorthand syntax:
    // - Primary key: id (auto-indexed)
    // - Regular indexes: field name
    // - Multi-entry indexes: *field (for array fields)
    // - Compound indexes: [field1+field2]
    this.version(1).stores({
      // Notes: Core content storage
      // Indexes support:
      // - Lookup by id (primary key)
      // - Search by title
      // - Filter by folderId (for folder navigation)
      // - Filter by tags (multi-entry for array field)
      // - Sort by createdAt/updatedAt
      // - Filter daily notes by isDaily and dailyDate
      notes: 'id, title, folderId, *tags, createdAt, updatedAt, isDaily, dailyDate',

      // Folders: Hierarchical organization
      // Indexes support:
      // - Lookup by id (primary key)
      // - Search by name
      // - Filter by parentId (for tree navigation)
      folders: 'id, name, parentId',

      // Tags: Categorization labels
      // Indexes support:
      // - Lookup by id (primary key)
      // - Search/filter by name
      tags: 'id, name',

      // Templates: Note creation templates
      // Indexes support:
      // - Lookup by id (primary key)
      // - Search by name
      // - Filter by category
      templates: 'id, name, category',

      // Collections: Smart collections with dynamic rules
      // Indexes support:
      // - Lookup by id (primary key)
      // - Search by name
      collections: 'id, name',
    });
  }
}

/**
 * Singleton database instance for the application.
 * Import this instance to interact with IndexedDB.
 *
 * @example
 * import { db } from './lib/db';
 *
 * // Add a note
 * await db.notes.add({ id: '...', title: '...', ... });
 *
 * // Query notes by folder
 * const notes = await db.notes.where('folderId').equals(folderId).toArray();
 *
 * // Query notes by tag (multi-entry index)
 * const taggedNotes = await db.notes.where('tags').equals(tagId).toArray();
 */
export const db = new KnowledgeBaseDB();
