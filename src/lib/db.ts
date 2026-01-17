import Dexie, { type Table } from 'dexie';
import type { Project, Folder, Tag } from '@/types';

/**
 * Ableton Project Manager Database
 *
 * Uses Dexie (IndexedDB wrapper) for local-first data persistence.
 * Stores projects, folders, and tags with appropriate indexes for
 * efficient querying and filtering.
 */
export class AbletonProjectDB extends Dexie {
  /** Table storing Ableton project metadata */
  projects!: Table<Project, string>;

  /** Table storing monitored folder information */
  folders!: Table<Folder, string>;

  /** Table storing user-created tags */
  tags!: Table<Tag, string>;

  constructor() {
    super('AbletonProjectManager');

    // Define database schema with indexes
    // Version 1: Initial schema
    this.version(1).stores({
      // Projects table with indexes on frequently queried fields
      // Primary key: id
      // Indexes: bpm, trackCount, modifiedAt, favorite, analyzed
      projects: 'id, bpm, trackCount, modifiedAt, favorite, analyzed, path, name, rating, createdAt',

      // Folders table
      // Primary key: id
      // Index on path for lookups
      folders: 'id, path, name, lastScanned',

      // Tags table
      // Primary key: id
      // Index on name for lookups
      tags: 'id, name',
    });
  }

  /**
   * Clear all data from the database
   * Useful for resetting the application state
   */
  async clearAll(): Promise<void> {
    await this.transaction('rw', [this.projects, this.folders, this.tags], async () => {
      await this.projects.clear();
      await this.folders.clear();
      await this.tags.clear();
    });
  }

  /**
   * Get projects filtered by BPM range
   */
  async getProjectsByBpmRange(min: number, max: number): Promise<Project[]> {
    return this.projects.where('bpm').between(min, max).toArray();
  }

  /**
   * Get projects filtered by track count range
   */
  async getProjectsByTrackCountRange(min: number, max: number): Promise<Project[]> {
    return this.projects.where('trackCount').between(min, max).toArray();
  }

  /**
   * Get all favorite projects
   */
  async getFavoriteProjects(): Promise<Project[]> {
    return this.projects.where('favorite').equals(1).toArray();
  }

  /**
   * Get all analyzed projects
   */
  async getAnalyzedProjects(): Promise<Project[]> {
    return this.projects.where('analyzed').equals(1).toArray();
  }

  /**
   * Get projects sorted by modification date (most recent first)
   */
  async getRecentProjects(limit: number = 50): Promise<Project[]> {
    return this.projects.orderBy('modifiedAt').reverse().limit(limit).toArray();
  }
}

// Export singleton database instance
export const db = new AbletonProjectDB();
