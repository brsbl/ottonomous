/**
 * Tests for Zustand App Store
 *
 * Tests the following:
 * - Store initial state
 * - selectSelectedNote selector
 * - selectSortedNotes selector with various sort orders
 * - Store actions (with mocked database operations)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore, selectSelectedNote, selectSortedNotes } from './appStore';
import type { Note } from '../types';
import { DEFAULT_SETTINGS } from '../types';

// Mock the database operations
vi.mock('../db/noteOperations', () => ({
  getAllNotes: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  archiveNote: vi.fn(),
  unarchiveNote: vi.fn(),
  pinNote: vi.fn(),
  unpinNote: vi.fn(),
}));

vi.mock('../db/database', () => ({
  db: {
    settings: {
      get: vi.fn(),
      update: vi.fn(),
      put: vi.fn(),
    },
  },
  initializeDatabase: vi.fn(),
}));

// Helper to create mock notes
function createMockNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'test-id-' + Math.random().toString(36).substr(2, 9),
    title: 'Test Note',
    content: 'Test content',
    tags: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    isArchived: false,
    isPinned: false,
    ...overrides,
  };
}

describe('appStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.setState({
      notes: [],
      selectedNoteId: null,
      notesLoading: false,
      settings: DEFAULT_SETTINGS,
      settingsLoading: false,
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('has empty notes array', () => {
      const state = useAppStore.getState();
      expect(state.notes).toEqual([]);
    });

    it('has no selected note', () => {
      const state = useAppStore.getState();
      expect(state.selectedNoteId).toBeNull();
    });

    it('has notesLoading as false', () => {
      const state = useAppStore.getState();
      expect(state.notesLoading).toBe(false);
    });

    it('has default settings', () => {
      const state = useAppStore.getState();
      expect(state.settings).toEqual(DEFAULT_SETTINGS);
    });

    it('has settingsLoading as false', () => {
      const state = useAppStore.getState();
      expect(state.settingsLoading).toBe(false);
    });
  });

  describe('selectSelectedNote', () => {
    it('returns null when no note is selected', () => {
      const state = useAppStore.getState();
      expect(selectSelectedNote(state)).toBeNull();
    });

    it('returns null when selectedNoteId does not match any note', () => {
      const note = createMockNote({ id: 'note-1' });
      useAppStore.setState({
        notes: [note],
        selectedNoteId: 'non-existent-id',
      });
      const state = useAppStore.getState();
      expect(selectSelectedNote(state)).toBeNull();
    });

    it('returns the selected note when it exists', () => {
      const note = createMockNote({ id: 'note-1', title: 'Selected Note' });
      useAppStore.setState({
        notes: [note],
        selectedNoteId: 'note-1',
      });
      const state = useAppStore.getState();
      const selected = selectSelectedNote(state);
      expect(selected).not.toBeNull();
      expect(selected?.id).toBe('note-1');
      expect(selected?.title).toBe('Selected Note');
    });

    it('returns correct note when multiple notes exist', () => {
      const notes = [
        createMockNote({ id: 'note-1', title: 'Note 1' }),
        createMockNote({ id: 'note-2', title: 'Note 2' }),
        createMockNote({ id: 'note-3', title: 'Note 3' }),
      ];
      useAppStore.setState({
        notes,
        selectedNoteId: 'note-2',
      });
      const state = useAppStore.getState();
      const selected = selectSelectedNote(state);
      expect(selected?.id).toBe('note-2');
      expect(selected?.title).toBe('Note 2');
    });
  });

  describe('selectSortedNotes', () => {
    describe('pinned notes sorting', () => {
      it('returns pinned notes first regardless of sort order', () => {
        const notes = [
          createMockNote({ id: 'unpinned', title: 'Unpinned', isPinned: false }),
          createMockNote({ id: 'pinned', title: 'Pinned', isPinned: true }),
        ];
        useAppStore.setState({
          notes,
          settings: { ...DEFAULT_SETTINGS, sortOrder: 'updated' },
        });
        const state = useAppStore.getState();
        const sorted = selectSortedNotes(state);
        expect(sorted[0].id).toBe('pinned');
        expect(sorted[1].id).toBe('unpinned');
      });

      it('sorts multiple pinned notes among themselves', () => {
        const notes = [
          createMockNote({
            id: 'pinned-old',
            title: 'Pinned Old',
            isPinned: true,
            updatedAt: new Date('2024-01-01'),
          }),
          createMockNote({
            id: 'pinned-new',
            title: 'Pinned New',
            isPinned: true,
            updatedAt: new Date('2024-01-10'),
          }),
          createMockNote({ id: 'unpinned', title: 'Unpinned', isPinned: false }),
        ];
        useAppStore.setState({
          notes,
          settings: { ...DEFAULT_SETTINGS, sortOrder: 'updated' },
        });
        const state = useAppStore.getState();
        const sorted = selectSortedNotes(state);
        // Pinned notes come first, sorted by updated date (newest first)
        expect(sorted[0].id).toBe('pinned-new');
        expect(sorted[1].id).toBe('pinned-old');
        expect(sorted[2].id).toBe('unpinned');
      });
    });

    describe('sort by updated', () => {
      it('sorts notes by updatedAt descending', () => {
        const notes = [
          createMockNote({
            id: 'old',
            title: 'Old',
            updatedAt: new Date('2024-01-01'),
          }),
          createMockNote({
            id: 'new',
            title: 'New',
            updatedAt: new Date('2024-01-10'),
          }),
          createMockNote({
            id: 'middle',
            title: 'Middle',
            updatedAt: new Date('2024-01-05'),
          }),
        ];
        useAppStore.setState({
          notes,
          settings: { ...DEFAULT_SETTINGS, sortOrder: 'updated' },
        });
        const state = useAppStore.getState();
        const sorted = selectSortedNotes(state);
        expect(sorted[0].id).toBe('new');
        expect(sorted[1].id).toBe('middle');
        expect(sorted[2].id).toBe('old');
      });
    });

    describe('sort by created', () => {
      it('sorts notes by createdAt descending', () => {
        const notes = [
          createMockNote({
            id: 'old',
            title: 'Old',
            createdAt: new Date('2024-01-01'),
          }),
          createMockNote({
            id: 'new',
            title: 'New',
            createdAt: new Date('2024-01-10'),
          }),
          createMockNote({
            id: 'middle',
            title: 'Middle',
            createdAt: new Date('2024-01-05'),
          }),
        ];
        useAppStore.setState({
          notes,
          settings: { ...DEFAULT_SETTINGS, sortOrder: 'created' },
        });
        const state = useAppStore.getState();
        const sorted = selectSortedNotes(state);
        expect(sorted[0].id).toBe('new');
        expect(sorted[1].id).toBe('middle');
        expect(sorted[2].id).toBe('old');
      });
    });

    describe('sort by title', () => {
      it('sorts notes by title alphabetically', () => {
        const notes = [
          createMockNote({ id: 'c', title: 'Charlie' }),
          createMockNote({ id: 'a', title: 'Alpha' }),
          createMockNote({ id: 'b', title: 'Bravo' }),
        ];
        useAppStore.setState({
          notes,
          settings: { ...DEFAULT_SETTINGS, sortOrder: 'title' },
        });
        const state = useAppStore.getState();
        const sorted = selectSortedNotes(state);
        expect(sorted[0].title).toBe('Alpha');
        expect(sorted[1].title).toBe('Bravo');
        expect(sorted[2].title).toBe('Charlie');
      });

      it('handles case-insensitive title sorting', () => {
        const notes = [
          createMockNote({ id: 'b', title: 'beta' }),
          createMockNote({ id: 'a', title: 'Alpha' }),
        ];
        useAppStore.setState({
          notes,
          settings: { ...DEFAULT_SETTINGS, sortOrder: 'title' },
        });
        const state = useAppStore.getState();
        const sorted = selectSortedNotes(state);
        expect(sorted[0].title).toBe('Alpha');
        expect(sorted[1].title).toBe('beta');
      });
    });

    describe('edge cases', () => {
      it('returns empty array for empty notes', () => {
        useAppStore.setState({ notes: [] });
        const state = useAppStore.getState();
        const sorted = selectSortedNotes(state);
        expect(sorted).toEqual([]);
      });

      it('returns single note as is', () => {
        const note = createMockNote({ id: 'single' });
        useAppStore.setState({ notes: [note] });
        const state = useAppStore.getState();
        const sorted = selectSortedNotes(state);
        expect(sorted).toHaveLength(1);
        expect(sorted[0].id).toBe('single');
      });

      it('does not mutate original notes array', () => {
        const notes = [
          createMockNote({ id: 'b', title: 'B' }),
          createMockNote({ id: 'a', title: 'A' }),
        ];
        useAppStore.setState({
          notes,
          settings: { ...DEFAULT_SETTINGS, sortOrder: 'title' },
        });
        const state = useAppStore.getState();
        selectSortedNotes(state);
        // Original order should be preserved
        expect(state.notes[0].id).toBe('b');
        expect(state.notes[1].id).toBe('a');
      });
    });
  });

  describe('selectNote action', () => {
    it('sets selectedNoteId to the given id', () => {
      useAppStore.getState().selectNote('note-123');
      const state = useAppStore.getState();
      expect(state.selectedNoteId).toBe('note-123');
    });

    it('sets selectedNoteId to null for deselection', () => {
      useAppStore.setState({ selectedNoteId: 'note-123' });
      useAppStore.getState().selectNote(null);
      const state = useAppStore.getState();
      expect(state.selectedNoteId).toBeNull();
    });
  });

  describe('loadNotes action', () => {
    it('sets notesLoading to true while loading', async () => {
      const noteOps = await import('../db/noteOperations');
      vi.mocked(noteOps.getAllNotes).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Start loading but don't await
      useAppStore.getState().loadNotes();

      // Check loading state immediately
      expect(useAppStore.getState().notesLoading).toBe(true);
    });

    it('loads notes and sets notesLoading to false on success', async () => {
      const noteOps = await import('../db/noteOperations');
      const mockNotes = [createMockNote({ id: 'loaded-note' })];
      vi.mocked(noteOps.getAllNotes).mockResolvedValue(mockNotes);

      await useAppStore.getState().loadNotes();

      const state = useAppStore.getState();
      expect(state.notes).toEqual(mockNotes);
      expect(state.notesLoading).toBe(false);
    });

    it('sets notesLoading to false on error and throws', async () => {
      const noteOps = await import('../db/noteOperations');
      const error = new Error('Database error');
      vi.mocked(noteOps.getAllNotes).mockRejectedValue(error);

      await expect(useAppStore.getState().loadNotes()).rejects.toThrow(
        'Database error'
      );
      expect(useAppStore.getState().notesLoading).toBe(false);
    });
  });

  describe('createNote action', () => {
    it('creates a note and adds it to the store', async () => {
      const noteOps = await import('../db/noteOperations');
      const newNote = createMockNote({ id: 'new-note', content: 'Hello' });
      vi.mocked(noteOps.createNote).mockResolvedValue(newNote);

      const result = await useAppStore.getState().createNote('Hello');

      expect(noteOps.createNote).toHaveBeenCalledWith({ content: 'Hello' });
      expect(result).toEqual(newNote);
      expect(useAppStore.getState().notes[0]).toEqual(newNote);
    });

    it('selects the newly created note', async () => {
      const noteOps = await import('../db/noteOperations');
      const newNote = createMockNote({ id: 'new-note' });
      vi.mocked(noteOps.createNote).mockResolvedValue(newNote);

      await useAppStore.getState().createNote();

      expect(useAppStore.getState().selectedNoteId).toBe('new-note');
    });

    it('prepends new note to existing notes', async () => {
      const noteOps = await import('../db/noteOperations');
      const existingNote = createMockNote({ id: 'existing' });
      const newNote = createMockNote({ id: 'new-note' });
      useAppStore.setState({ notes: [existingNote] });
      vi.mocked(noteOps.createNote).mockResolvedValue(newNote);

      await useAppStore.getState().createNote();

      const notes = useAppStore.getState().notes;
      expect(notes).toHaveLength(2);
      expect(notes[0].id).toBe('new-note');
      expect(notes[1].id).toBe('existing');
    });
  });

  describe('updateNote action', () => {
    it('updates a note in the store', async () => {
      const noteOps = await import('../db/noteOperations');
      const originalNote = createMockNote({ id: 'note-1', title: 'Original' });
      const updatedNote = { ...originalNote, title: 'Updated' };
      useAppStore.setState({ notes: [originalNote] });
      vi.mocked(noteOps.updateNote).mockResolvedValue(updatedNote);

      const result = await useAppStore.getState().updateNote('note-1', {
        title: 'Updated',
      });

      expect(noteOps.updateNote).toHaveBeenCalledWith('note-1', {
        title: 'Updated',
      });
      expect(result.title).toBe('Updated');
      expect(useAppStore.getState().notes[0].title).toBe('Updated');
    });

    it('only updates the matching note', async () => {
      const noteOps = await import('../db/noteOperations');
      const notes = [
        createMockNote({ id: 'note-1', title: 'Note 1' }),
        createMockNote({ id: 'note-2', title: 'Note 2' }),
      ];
      useAppStore.setState({ notes });
      const updatedNote = { ...notes[0], title: 'Updated Note 1' };
      vi.mocked(noteOps.updateNote).mockResolvedValue(updatedNote);

      await useAppStore.getState().updateNote('note-1', {
        title: 'Updated Note 1',
      });

      const state = useAppStore.getState();
      expect(state.notes[0].title).toBe('Updated Note 1');
      expect(state.notes[1].title).toBe('Note 2');
    });
  });

  describe('deleteNote action', () => {
    it('removes the note from the store', async () => {
      const noteOps = await import('../db/noteOperations');
      const note = createMockNote({ id: 'to-delete' });
      useAppStore.setState({ notes: [note] });
      vi.mocked(noteOps.deleteNote).mockResolvedValue(undefined);

      await useAppStore.getState().deleteNote('to-delete');

      expect(noteOps.deleteNote).toHaveBeenCalledWith('to-delete');
      expect(useAppStore.getState().notes).toHaveLength(0);
    });

    it('clears selection if deleted note was selected', async () => {
      const noteOps = await import('../db/noteOperations');
      const note = createMockNote({ id: 'to-delete' });
      useAppStore.setState({ notes: [note], selectedNoteId: 'to-delete' });
      vi.mocked(noteOps.deleteNote).mockResolvedValue(undefined);

      await useAppStore.getState().deleteNote('to-delete');

      expect(useAppStore.getState().selectedNoteId).toBeNull();
    });

    it('preserves selection if different note was deleted', async () => {
      const noteOps = await import('../db/noteOperations');
      const notes = [
        createMockNote({ id: 'selected' }),
        createMockNote({ id: 'to-delete' }),
      ];
      useAppStore.setState({ notes, selectedNoteId: 'selected' });
      vi.mocked(noteOps.deleteNote).mockResolvedValue(undefined);

      await useAppStore.getState().deleteNote('to-delete');

      expect(useAppStore.getState().selectedNoteId).toBe('selected');
    });
  });

  describe('archiveNote action', () => {
    it('removes note from active notes list', async () => {
      const noteOps = await import('../db/noteOperations');
      const note = createMockNote({ id: 'to-archive' });
      const archivedNote = { ...note, isArchived: true };
      useAppStore.setState({ notes: [note] });
      vi.mocked(noteOps.archiveNote).mockResolvedValue(archivedNote);

      const result = await useAppStore.getState().archiveNote('to-archive');

      expect(result.isArchived).toBe(true);
      expect(useAppStore.getState().notes).toHaveLength(0);
    });

    it('clears selection if archived note was selected', async () => {
      const noteOps = await import('../db/noteOperations');
      const note = createMockNote({ id: 'to-archive' });
      useAppStore.setState({ notes: [note], selectedNoteId: 'to-archive' });
      vi.mocked(noteOps.archiveNote).mockResolvedValue({
        ...note,
        isArchived: true,
      });

      await useAppStore.getState().archiveNote('to-archive');

      expect(useAppStore.getState().selectedNoteId).toBeNull();
    });
  });

  describe('unarchiveNote action', () => {
    it('adds note back to active notes list', async () => {
      const noteOps = await import('../db/noteOperations');
      const restoredNote = createMockNote({ id: 'restored', isArchived: false });
      useAppStore.setState({ notes: [] });
      vi.mocked(noteOps.unarchiveNote).mockResolvedValue(restoredNote);

      const result = await useAppStore.getState().unarchiveNote('restored');

      expect(result.isArchived).toBe(false);
      expect(useAppStore.getState().notes).toHaveLength(1);
      expect(useAppStore.getState().notes[0].id).toBe('restored');
    });
  });

  describe('pinNote action', () => {
    it('updates note isPinned to true', async () => {
      const noteOps = await import('../db/noteOperations');
      const note = createMockNote({ id: 'to-pin', isPinned: false });
      const pinnedNote = { ...note, isPinned: true };
      useAppStore.setState({ notes: [note] });
      vi.mocked(noteOps.pinNote).mockResolvedValue(pinnedNote);

      const result = await useAppStore.getState().pinNote('to-pin');

      expect(result.isPinned).toBe(true);
      expect(useAppStore.getState().notes[0].isPinned).toBe(true);
    });
  });

  describe('unpinNote action', () => {
    it('updates note isPinned to false', async () => {
      const noteOps = await import('../db/noteOperations');
      const note = createMockNote({ id: 'to-unpin', isPinned: true });
      const unpinnedNote = { ...note, isPinned: false };
      useAppStore.setState({ notes: [note] });
      vi.mocked(noteOps.unpinNote).mockResolvedValue(unpinnedNote);

      const result = await useAppStore.getState().unpinNote('to-unpin');

      expect(result.isPinned).toBe(false);
      expect(useAppStore.getState().notes[0].isPinned).toBe(false);
    });
  });

  describe('loadSettings action', () => {
    it('loads settings from database', async () => {
      const { db } = await import('../db/database');
      const dbSettings = {
        id: 'app-settings',
        theme: 'dark' as const,
        fontSize: 'large' as const,
        sidebarVisible: false,
        sortOrder: 'title' as const,
      };
      vi.mocked(db.settings.get).mockResolvedValue(dbSettings);

      await useAppStore.getState().loadSettings();

      const state = useAppStore.getState();
      expect(state.settings.theme).toBe('dark');
      expect(state.settings.fontSize).toBe('large');
      expect(state.settings.sidebarVisible).toBe(false);
      expect(state.settings.sortOrder).toBe('title');
      expect(state.settingsLoading).toBe(false);
    });

    it('uses default settings if none exist in database', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.get).mockResolvedValue(undefined);

      await useAppStore.getState().loadSettings();

      const state = useAppStore.getState();
      expect(state.settings).toEqual(DEFAULT_SETTINGS);
    });

    it('sets settingsLoading to false on error and throws', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.get).mockRejectedValue(new Error('DB error'));

      await expect(useAppStore.getState().loadSettings()).rejects.toThrow(
        'DB error'
      );
      expect(useAppStore.getState().settingsLoading).toBe(false);
    });
  });

  describe('updateSettings action', () => {
    it('updates settings in store and database', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');

      await useAppStore.getState().updateSettings({ theme: 'dark' });

      expect(db.settings.put).toHaveBeenCalledWith({
        id: 'app-settings',
        theme: 'dark',
        fontSize: 'medium',
        sidebarVisible: true,
        sortOrder: 'updated',
      });
      expect(useAppStore.getState().settings.theme).toBe('dark');
    });

    it('merges updates with existing settings', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');
      useAppStore.setState({
        settings: {
          theme: 'light',
          fontSize: 'medium',
          sidebarVisible: true,
          sortOrder: 'updated',
        },
      });

      await useAppStore.getState().updateSettings({ fontSize: 'large' });

      const settings = useAppStore.getState().settings;
      expect(settings.theme).toBe('light');
      expect(settings.fontSize).toBe('large');
      expect(settings.sidebarVisible).toBe(true);
      expect(settings.sortOrder).toBe('updated');
    });
  });
});
