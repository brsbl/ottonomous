/**
 * Zustand store for the Personal Knowledge Base application state.
 * Provides centralized state management with IndexedDB persistence.
 */

import { create } from 'zustand';
import type Fuse from 'fuse.js';
import type { Note, Folder, Tag, Template, SmartCollection, NoteLink, TemplateCategory } from '../types';
import { db } from '../lib/db';
import { buildBacklinksIndex, getBacklinks as getBacklinksFromIndex } from '../lib/linkParser';
import {
  createSearchIndex,
  searchNotes as performFuseSearch,
  type SearchResult,
} from '../lib/search';

/**
 * Built-in template definitions.
 * These templates are seeded into the database on first load if no templates exist.
 */
export const BUILT_IN_TEMPLATES: Array<{ name: string; content: string; category: TemplateCategory }> = [
  {
    name: 'Daily Note',
    category: 'daily',
    content: `# {{date}}

## Tasks
- [ ]

## Notes

`,
  },
  {
    name: 'Meeting Notes',
    category: 'meeting',
    content: `# Meeting: {{title}}

**Date:** {{date}}
**Attendees:**

## Agenda

## Notes

## Action Items

`,
  },
  {
    name: 'Project',
    category: 'project',
    content: `# {{title}}

## Overview

## Goals

## Tasks

## Resources

`,
  },
];

/**
 * Replace template placeholders with actual values.
 * Supports: {{date}}, {{title}}
 */
export function replacePlaceholders(content: string, title: string = 'Untitled'): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return content
    .replace(/\{\{date\}\}/g, dateStr)
    .replace(/\{\{title\}\}/g, title);
}

/**
 * Seed the database with built-in templates if none exist.
 */
export async function seedTemplates(): Promise<Template[]> {
  const existingTemplates = await db.templates.toArray();
  if (existingTemplates.length > 0) {
    return existingTemplates;
  }

  const templates: Template[] = BUILT_IN_TEMPLATES.map((t) => ({
    id: crypto.randomUUID(),
    name: t.name,
    content: t.content,
    category: t.category,
    createdAt: new Date(),
  }));

  await db.templates.bulkAdd(templates);
  return templates;
}

/**
 * KnowledgeBaseState interface defines the shape of the store.
 * Includes all entity collections, UI state, and search state.
 */
export interface KnowledgeBaseState {
  // Entity collections
  notes: Note[];
  folders: Folder[];
  tags: Tag[];
  templates: Template[];
  collections: SmartCollection[];

  // UI state
  activeNoteId: string | null;

  // Search state
  searchQuery: string;
  searchResults: Note[];
  fuseSearchResults: SearchResult[];
  searchIndex: Fuse<Note> | null;

  // Backlinks state
  backlinksIndex: Map<string, NoteLink[]>;

  // Loading state
  isLoading: boolean;
}

/**
 * KnowledgeBaseActions interface defines all available store actions.
 * All mutations persist to IndexedDB for offline-first functionality.
 */
export interface KnowledgeBaseActions {
  // Note CRUD
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setActiveNote: (id: string | null) => void;

  // Data loading
  loadNotes: () => Promise<void>;
  loadFolders: () => Promise<void>;
  loadTags: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  loadCollections: () => Promise<void>;
  loadAll: () => Promise<void>;

  // Folder CRUD
  createFolder: (folder: Omit<Folder, 'id' | 'createdAt'>) => Promise<Folder>;
  updateFolder: (id: string, updates: Partial<Omit<Folder, 'id' | 'createdAt'>>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // Note organization
  moveNote: (noteId: string, folderId: string | null) => Promise<void>;

  // Tag CRUD
  createTag: (tag: Omit<Tag, 'id' | 'createdAt'>) => Promise<Tag>;
  updateTag: (id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  addTagToNote: (noteId: string, tagId: string) => Promise<void>;
  removeTagFromNote: (noteId: string, tagId: string) => Promise<void>;
  getTagById: (id: string) => Tag | undefined;

  // Template CRUD
  createTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => Promise<Template>;
  updateTemplate: (id: string, updates: Partial<Omit<Template, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

  // Collection CRUD
  createCollection: (collection: Omit<SmartCollection, 'id' | 'createdAt'>) => Promise<SmartCollection>;
  updateCollection: (id: string, updates: Partial<Omit<SmartCollection, 'id' | 'createdAt'>>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;

  // Search
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;
  searchNotes: (query: string) => SearchResult[];
  clearSearch: () => void;
  rebuildSearchIndex: () => void;

  // Backlinks
  refreshBacklinks: () => void;
  getBacklinks: (noteId: string) => NoteLink[];

  // Daily Notes
  createDailyNote: (date?: Date) => Promise<Note>;
  getDailyNote: (date: Date) => Note | undefined;
}

/**
 * Combined store type for the knowledge base.
 */
export type KnowledgeBaseStore = KnowledgeBaseState & KnowledgeBaseActions;

/**
 * Generate a UUID v4 identifier.
 */
const generateId = (): string => {
  return crypto.randomUUID();
};

/**
 * Initial state for the store.
 */
const initialState: KnowledgeBaseState = {
  notes: [],
  folders: [],
  tags: [],
  templates: [],
  collections: [],
  activeNoteId: null,
  searchQuery: '',
  searchResults: [],
  fuseSearchResults: [],
  searchIndex: null,
  backlinksIndex: new Map(),
  isLoading: false,
};

/**
 * Zustand store for the Personal Knowledge Base application.
 * All mutations are persisted to IndexedDB for offline-first functionality.
 */
export const useKnowledgeBase = create<KnowledgeBaseStore>((set, get) => ({
  ...initialState,

  // =========================================================================
  // Note CRUD Operations
  // =========================================================================

  createNote: async (noteData) => {
    const now = new Date();
    const note: Note = {
      ...noteData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    // Persist to IndexedDB
    await db.notes.add(note);

    // Update store state
    set((state) => ({
      notes: [...state.notes, note],
    }));

    return note;
  },

  updateNote: async (id, updates) => {
    const updatedNote = {
      ...updates,
      updatedAt: new Date(),
    };

    // Persist to IndexedDB
    await db.notes.update(id, updatedNote);

    // Update store state
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...updatedNote } : note
      ),
    }));
  },

  deleteNote: async (id) => {
    // Remove from IndexedDB
    await db.notes.delete(id);

    // Update store state
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
      searchResults: state.searchResults.filter((note) => note.id !== id),
    }));
  },

  setActiveNote: (id) => {
    set({ activeNoteId: id });
  },

  // =========================================================================
  // Data Loading Operations
  // =========================================================================

  loadNotes: async () => {
    set({ isLoading: true });
    try {
      const notes = await db.notes.toArray();
      set({ notes, isLoading: false });
    } catch (error) {
      console.error('Failed to load notes:', error);
      set({ isLoading: false });
    }
  },

  loadFolders: async () => {
    try {
      const folders = await db.folders.toArray();
      set({ folders });
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  },

  loadTags: async () => {
    try {
      const tags = await db.tags.toArray();
      set({ tags });
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  },

  loadTemplates: async () => {
    try {
      let templates = await db.templates.toArray();
      // Seed built-in templates if none exist
      if (templates.length === 0) {
        templates = await seedTemplates();
      }
      set({ templates });
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  },

  loadCollections: async () => {
    try {
      const collections = await db.collections.toArray();
      set({ collections });
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  },

  loadAll: async () => {
    set({ isLoading: true });
    try {
      const [notes, folders, tags, templates, collections] = await Promise.all([
        db.notes.toArray(),
        db.folders.toArray(),
        db.tags.toArray(),
        db.templates.toArray(),
        db.collections.toArray(),
      ]);
      set({
        notes,
        folders,
        tags,
        templates,
        collections,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      set({ isLoading: false });
    }
  },

  // =========================================================================
  // Folder CRUD Operations
  // =========================================================================

  createFolder: async (folderData) => {
    const folder: Folder = {
      ...folderData,
      id: generateId(),
      createdAt: new Date(),
    };

    await db.folders.add(folder);
    set((state) => ({
      folders: [...state.folders, folder],
    }));

    return folder;
  },

  updateFolder: async (id, updates) => {
    await db.folders.update(id, updates);
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === id ? { ...folder, ...updates } : folder
      ),
    }));
  },

  deleteFolder: async (id) => {
    await db.folders.delete(id);
    set((state) => ({
      folders: state.folders.filter((folder) => folder.id !== id),
    }));
  },

  // =========================================================================
  // Note Organization Operations
  // =========================================================================

  moveNote: async (noteId, folderId) => {
    const updatedNote = {
      folderId,
      updatedAt: new Date(),
    };

    // Persist to IndexedDB
    await db.notes.update(noteId, updatedNote);

    // Update store state
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === noteId ? { ...note, ...updatedNote } : note
      ),
    }));
  },

  // =========================================================================
  // Tag CRUD Operations
  // =========================================================================

  createTag: async (tagData) => {
    const tag: Tag = {
      ...tagData,
      id: generateId(),
      createdAt: new Date(),
    };

    await db.tags.add(tag);
    set((state) => ({
      tags: [...state.tags, tag],
    }));

    return tag;
  },

  updateTag: async (id, updates) => {
    await db.tags.update(id, updates);
    set((state) => ({
      tags: state.tags.map((tag) =>
        tag.id === id ? { ...tag, ...updates } : tag
      ),
    }));
  },

  deleteTag: async (id) => {
    await db.tags.delete(id);
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== id),
    }));
  },

  addTagToNote: async (noteId, tagId) => {
    const { notes } = get();
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    // Check if tag is already added
    if (note.tags.includes(tagId)) return;

    const updatedTags = [...note.tags, tagId];
    const updatedNote = {
      tags: updatedTags,
      updatedAt: new Date(),
    };

    // Persist to IndexedDB
    await db.notes.update(noteId, updatedNote);

    // Update store state
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === noteId ? { ...n, ...updatedNote } : n
      ),
    }));
  },

  removeTagFromNote: async (noteId, tagId) => {
    const { notes } = get();
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const updatedTags = note.tags.filter((t) => t !== tagId);
    const updatedNote = {
      tags: updatedTags,
      updatedAt: new Date(),
    };

    // Persist to IndexedDB
    await db.notes.update(noteId, updatedNote);

    // Update store state
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === noteId ? { ...n, ...updatedNote } : n
      ),
    }));
  },

  getTagById: (id) => {
    const { tags } = get();
    return tags.find((t) => t.id === id);
  },

  // =========================================================================
  // Template CRUD Operations
  // =========================================================================

  createTemplate: async (templateData) => {
    const template: Template = {
      ...templateData,
      id: generateId(),
      createdAt: new Date(),
    };

    await db.templates.add(template);
    set((state) => ({
      templates: [...state.templates, template],
    }));

    return template;
  },

  updateTemplate: async (id, updates) => {
    await db.templates.update(id, updates);
    set((state) => ({
      templates: state.templates.map((template) =>
        template.id === id ? { ...template, ...updates } : template
      ),
    }));
  },

  deleteTemplate: async (id) => {
    await db.templates.delete(id);
    set((state) => ({
      templates: state.templates.filter((template) => template.id !== id),
    }));
  },

  // =========================================================================
  // Collection CRUD Operations
  // =========================================================================

  createCollection: async (collectionData) => {
    const collection: SmartCollection = {
      ...collectionData,
      id: generateId(),
      createdAt: new Date(),
    };

    await db.collections.add(collection);
    set((state) => ({
      collections: [...state.collections, collection],
    }));

    return collection;
  },

  updateCollection: async (id, updates) => {
    await db.collections.update(id, updates);
    set((state) => ({
      collections: state.collections.map((collection) =>
        collection.id === id ? { ...collection, ...updates } : collection
      ),
    }));
  },

  deleteCollection: async (id) => {
    await db.collections.delete(id);
    set((state) => ({
      collections: state.collections.filter((collection) => collection.id !== id),
    }));
  },

  // =========================================================================
  // Search Operations
  // =========================================================================

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  performSearch: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], fuseSearchResults: [], searchQuery: '' });
      return;
    }

    const { notes } = get();
    let { searchIndex } = get();

    // Create search index if not exists
    if (!searchIndex) {
      searchIndex = createSearchIndex(notes);
      set({ searchIndex });
    }

    // Perform fuzzy search using Fuse.js
    const fuseResults = performFuseSearch(query, searchIndex);

    // Extract notes from search results for backward compatibility
    const results = fuseResults.map((result) => result.note);

    set({
      searchQuery: query,
      searchResults: results,
      fuseSearchResults: fuseResults,
    });
  },

  searchNotes: (query: string): SearchResult[] => {
    if (!query.trim()) {
      return [];
    }

    const { notes } = get();
    let { searchIndex } = get();

    // Create search index if not exists
    if (!searchIndex) {
      searchIndex = createSearchIndex(notes);
      set({ searchIndex });
    }

    const results = performFuseSearch(query, searchIndex);
    set({ fuseSearchResults: results });
    return results;
  },

  clearSearch: () => {
    set({
      searchQuery: '',
      searchResults: [],
      fuseSearchResults: [],
    });
  },

  rebuildSearchIndex: () => {
    const { notes } = get();
    const index = createSearchIndex(notes);
    set({ searchIndex: index });
  },

  // =========================================================================
  // Backlinks Operations
  // =========================================================================

  refreshBacklinks: () => {
    const { notes } = get();
    const index = buildBacklinksIndex(notes);
    set({ backlinksIndex: index });
  },

  getBacklinks: (noteId: string) => {
    const { backlinksIndex } = get();
    return getBacklinksFromIndex(noteId, backlinksIndex);
  },

  // =========================================================================
  // Daily Notes Operations
  // =========================================================================

  createDailyNote: async (date?: Date) => {
    const targetDate = date || new Date();
    const dateString = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check if daily note already exists for this date
    const { notes } = get();
    const existingNote = notes.find(
      (n) => n.isDaily && n.dailyDate === dateString
    );

    if (existingNote) {
      return existingNote;
    }

    // Create daily note with template
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    const dayName = dayNames[targetDate.getDay()];
    const monthName = monthNames[targetDate.getMonth()];
    const dayOfMonth = targetDate.getDate();
    const year = targetDate.getFullYear();

    const template = `# ${dayName}, ${monthName} ${dayOfMonth}, ${year}

## Tasks
- [ ]

## Notes


## Reflections

`;

    const now = new Date();
    const note: Note = {
      id: generateId(),
      title: dateString,
      content: template,
      folderId: null,
      tags: [],
      createdAt: now,
      updatedAt: now,
      isDaily: true,
      dailyDate: dateString,
    };

    // Persist to IndexedDB
    await db.notes.add(note);

    // Update store state
    set((state) => ({
      notes: [...state.notes, note],
    }));

    return note;
  },

  getDailyNote: (date: Date) => {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const { notes } = get();
    return notes.find((n) => n.isDaily && n.dailyDate === dateString);
  },
}));
