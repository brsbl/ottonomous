/**
 * Zustand App Store for Bear Notes App
 * Provides centralized state management for notes, settings, and UI state
 */

import { create } from 'zustand';
import type { Note, AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import * as noteOps from '../db/noteOperations';
import { db, initializeDatabase } from '../db/database';

/**
 * Application state interface
 */
interface AppState {
  // Notes state
  notes: Note[];
  selectedNoteId: string | null;
  notesLoading: boolean;

  // Settings state
  settings: AppSettings;
  settingsLoading: boolean;

  // Initialization state
  initialized: boolean;
  initializePromise: Promise<void> | null;

  // Note actions
  loadNotes: () => Promise<void>;
  createNote: (content?: string) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  selectNote: (id: string | null) => void;
  archiveNote: (id: string) => Promise<Note>;
  unarchiveNote: (id: string) => Promise<Note>;
  pinNote: (id: string) => Promise<Note>;
  unpinNote: (id: string) => Promise<Note>;

  // Settings actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;

  // Initialization
  initialize: () => Promise<void>;
}

/**
 * Create the Zustand store
 */
export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  notes: [],
  selectedNoteId: null,
  notesLoading: false,
  settings: DEFAULT_SETTINGS,
  settingsLoading: false,
  initialized: false,
  initializePromise: null,

  /**
   * Load all non-archived notes from the database
   */
  loadNotes: async () => {
    set({ notesLoading: true });
    try {
      const notes = await noteOps.getAllNotes();
      set({ notes, notesLoading: false });
    } catch (error) {
      console.error('Failed to load notes:', error);
      set({ notesLoading: false });
      throw error;
    }
  },

  /**
   * Create a new note and add it to the store
   */
  createNote: async (content = '') => {
    const note = await noteOps.createNote({ content });
    set((state) => ({
      notes: [note, ...state.notes],
      selectedNoteId: note.id,
    }));
    return note;
  },

  /**
   * Update an existing note
   */
  updateNote: async (id, updates) => {
    const updatedNote = await noteOps.updateNote(id, updates);
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
    }));
    return updatedNote;
  },

  /**
   * Delete a note permanently
   */
  deleteNote: async (id) => {
    await noteOps.deleteNote(id);
    set((state) => {
      const newNotes = state.notes.filter((n) => n.id !== id);
      // Clear selection if deleted note was selected
      const newSelectedId = state.selectedNoteId === id ? null : state.selectedNoteId;
      return { notes: newNotes, selectedNoteId: newSelectedId };
    });
  },

  /**
   * Select a note by ID (or deselect with null)
   */
  selectNote: (id) => {
    set({ selectedNoteId: id });
  },

  /**
   * Archive a note (moves to archive, not deleted)
   */
  archiveNote: async (id) => {
    const archivedNote = await noteOps.archiveNote(id);
    set((state) => ({
      // Remove from active notes list (since it's now archived)
      notes: state.notes.filter((n) => n.id !== id),
      selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
    }));
    return archivedNote;
  },

  /**
   * Unarchive a note (restore from archive)
   */
  unarchiveNote: async (id) => {
    const restoredNote = await noteOps.unarchiveNote(id);
    set((state) => ({
      notes: [restoredNote, ...state.notes],
    }));
    return restoredNote;
  },

  /**
   * Pin a note to the top
   */
  pinNote: async (id) => {
    const pinnedNote = await noteOps.pinNote(id);
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? pinnedNote : n)),
    }));
    return pinnedNote;
  },

  /**
   * Unpin a note
   */
  unpinNote: async (id) => {
    const unpinnedNote = await noteOps.unpinNote(id);
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? unpinnedNote : n)),
    }));
    return unpinnedNote;
  },

  /**
   * Load settings from the database
   */
  loadSettings: async () => {
    set({ settingsLoading: true });
    try {
      const settingsRecord = await db.settings.get('app-settings');
      if (settingsRecord) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, ...settings } = settingsRecord;
        set({ settings: settings as AppSettings, settingsLoading: false });
      } else {
        set({ settings: DEFAULT_SETTINGS, settingsLoading: false });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ settingsLoading: false });
      throw error;
    }
  },

  /**
   * Update settings in the database and store
   */
  updateSettings: async (updates) => {
    const currentSettings = get().settings;
    const newSettings = { ...currentSettings, ...updates };

    // Use put() for upsert behavior - works even if settings record doesn't exist
    await db.settings.put({ id: 'app-settings', ...newSettings });
    set({ settings: newSettings });
  },

  /**
   * Initialize the app - load database, notes, and settings
   * Guards against multiple concurrent calls using initialized flag and Promise cache
   */
  initialize: async () => {
    // Already initialized, return immediately
    if (get().initialized) {
      return;
    }

    // Initialization in progress, return existing promise
    const existingPromise = get().initializePromise;
    if (existingPromise) {
      return existingPromise;
    }

    // Start initialization and cache the promise
    const initPromise = (async () => {
      try {
        await initializeDatabase();
        await Promise.all([get().loadNotes(), get().loadSettings()]);
        set({ initialized: true });
      } finally {
        set({ initializePromise: null });
      }
    })();

    set({ initializePromise: initPromise });
    return initPromise;
  },
}));

/**
 * Selector for getting the currently selected note
 */
export const selectSelectedNote = (state: AppState): Note | null => {
  if (!state.selectedNoteId) return null;
  return state.notes.find((n) => n.id === state.selectedNoteId) ?? null;
};

/**
 * Selector for getting notes sorted by the user's preference
 */
export const selectSortedNotes = (state: AppState): Note[] => {
  const { notes, settings } = state;
  const sorted = [...notes];

  // Pinned notes always come first
  sorted.sort((a, b) => {
    // First sort by pinned status
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // Then sort by user preference
    switch (settings.sortOrder) {
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  return sorted;
};
