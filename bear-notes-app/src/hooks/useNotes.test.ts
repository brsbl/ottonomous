/**
 * Tests for useNotes Hook
 *
 * Tests the following:
 * - Hook returns all expected state properties
 * - Hook returns all expected action functions
 * - Actions delegate correctly to the store
 *
 * Note: We test the hook's behavior by testing the underlying store
 * since the hook is essentially a thin wrapper around Zustand selectors.
 * This avoids issues with React Testing Library and Zustand's re-render behavior.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore, selectSelectedNote, selectSortedNotes } from '../store/appStore';
import type { Note } from '../types';
import { DEFAULT_SETTINGS } from '../types';

// Mock the database operations to prevent actual database calls
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

describe('useNotes hook behavior', () => {
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

  describe('state properties via selectors', () => {
    it('returns notes array from store', () => {
      const mockNotes = [
        createMockNote({ id: 'note-1' }),
        createMockNote({ id: 'note-2' }),
      ];
      useAppStore.setState({ notes: mockNotes });

      const state = useAppStore.getState();
      expect(state.notes).toEqual(mockNotes);
      expect(state.notes).toHaveLength(2);
    });

    it('returns sortedNotes with pinned notes first via selector', () => {
      const mockNotes = [
        createMockNote({
          id: 'unpinned',
          title: 'Unpinned',
          isPinned: false,
          updatedAt: new Date('2024-01-10'),
        }),
        createMockNote({
          id: 'pinned',
          title: 'Pinned',
          isPinned: true,
          updatedAt: new Date('2024-01-01'),
        }),
      ];
      useAppStore.setState({
        notes: mockNotes,
        settings: { ...DEFAULT_SETTINGS, sortOrder: 'updated' },
      });

      const state = useAppStore.getState();
      const sortedNotes = selectSortedNotes(state);

      expect(sortedNotes[0].id).toBe('pinned');
      expect(sortedNotes[1].id).toBe('unpinned');
    });

    it('returns selectedNote when a note is selected via selector', () => {
      const mockNote = createMockNote({ id: 'selected-note' });
      useAppStore.setState({
        notes: [mockNote],
        selectedNoteId: 'selected-note',
      });

      const state = useAppStore.getState();
      const selectedNote = selectSelectedNote(state);

      expect(selectedNote).not.toBeNull();
      expect(selectedNote?.id).toBe('selected-note');
    });

    it('returns null selectedNote when no note is selected via selector', () => {
      const mockNote = createMockNote({ id: 'note-1' });
      useAppStore.setState({
        notes: [mockNote],
        selectedNoteId: null,
      });

      const state = useAppStore.getState();
      const selectedNote = selectSelectedNote(state);

      expect(selectedNote).toBeNull();
    });

    it('returns selectedNoteId from store', () => {
      useAppStore.setState({ selectedNoteId: 'test-id' });

      const state = useAppStore.getState();
      expect(state.selectedNoteId).toBe('test-id');
    });

    it('returns notesLoading state', () => {
      useAppStore.setState({ notesLoading: true });

      const state = useAppStore.getState();
      expect(state.notesLoading).toBe(true);
    });

    it('returns notesLoading as false when not loading', () => {
      useAppStore.setState({ notesLoading: false });

      const state = useAppStore.getState();
      expect(state.notesLoading).toBe(false);
    });
  });

  describe('action functions availability', () => {
    it('store has createNote function', () => {
      const state = useAppStore.getState();
      expect(typeof state.createNote).toBe('function');
    });

    it('store has updateNote function', () => {
      const state = useAppStore.getState();
      expect(typeof state.updateNote).toBe('function');
    });

    it('store has deleteNote function', () => {
      const state = useAppStore.getState();
      expect(typeof state.deleteNote).toBe('function');
    });

    it('store has selectNote function', () => {
      const state = useAppStore.getState();
      expect(typeof state.selectNote).toBe('function');
    });

    it('store has archiveNote function', () => {
      const state = useAppStore.getState();
      expect(typeof state.archiveNote).toBe('function');
    });

    it('store has unarchiveNote function', () => {
      const state = useAppStore.getState();
      expect(typeof state.unarchiveNote).toBe('function');
    });

    it('store has pinNote function', () => {
      const state = useAppStore.getState();
      expect(typeof state.pinNote).toBe('function');
    });

    it('store has unpinNote function', () => {
      const state = useAppStore.getState();
      expect(typeof state.unpinNote).toBe('function');
    });

    it('store has loadNotes function', () => {
      const state = useAppStore.getState();
      expect(typeof state.loadNotes).toBe('function');
    });
  });

  describe('selectNote action', () => {
    it('sets selectedNoteId to the given id', () => {
      useAppStore.getState().selectNote('new-selection');

      const state = useAppStore.getState();
      expect(state.selectedNoteId).toBe('new-selection');
    });

    it('can deselect by passing null', () => {
      useAppStore.setState({ selectedNoteId: 'some-id' });
      useAppStore.getState().selectNote(null);

      const state = useAppStore.getState();
      expect(state.selectedNoteId).toBeNull();
    });
  });

  describe('createNote action', () => {
    it('creates a note and adds it to the store', async () => {
      const noteOps = await import('../db/noteOperations');
      const newNote = createMockNote({ id: 'new-note', content: 'Hello' });
      vi.mocked(noteOps.createNote).mockResolvedValue(newNote);

      const created = await useAppStore.getState().createNote('Hello');

      expect(created.id).toBe('new-note');
      expect(useAppStore.getState().notes).toContainEqual(newNote);
    });

    it('selects the newly created note', async () => {
      const noteOps = await import('../db/noteOperations');
      const newNote = createMockNote({ id: 'new-note' });
      vi.mocked(noteOps.createNote).mockResolvedValue(newNote);

      await useAppStore.getState().createNote();

      expect(useAppStore.getState().selectedNoteId).toBe('new-note');
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

      expect(result.title).toBe('Updated');
      expect(useAppStore.getState().notes[0].title).toBe('Updated');
    });
  });

  describe('deleteNote action', () => {
    it('removes the note from the store', async () => {
      const noteOps = await import('../db/noteOperations');
      const note = createMockNote({ id: 'to-delete' });
      useAppStore.setState({ notes: [note] });
      vi.mocked(noteOps.deleteNote).mockResolvedValue(undefined);

      await useAppStore.getState().deleteNote('to-delete');

      expect(useAppStore.getState().notes).toHaveLength(0);
    });
  });

  describe('archiveNote action', () => {
    it('removes note from active notes list', async () => {
      const noteOps = await import('../db/noteOperations');
      const note = createMockNote({ id: 'to-archive' });
      const archivedNote = { ...note, isArchived: true };
      useAppStore.setState({ notes: [note] });
      vi.mocked(noteOps.archiveNote).mockResolvedValue(archivedNote);

      const archived = await useAppStore.getState().archiveNote('to-archive');

      expect(archived.isArchived).toBe(true);
      expect(useAppStore.getState().notes).toHaveLength(0);
    });
  });

  describe('unarchiveNote action', () => {
    it('adds note back to active notes list', async () => {
      const noteOps = await import('../db/noteOperations');
      const restoredNote = createMockNote({ id: 'restored', isArchived: false });
      vi.mocked(noteOps.unarchiveNote).mockResolvedValue(restoredNote);

      const restored = await useAppStore.getState().unarchiveNote('restored');

      expect(restored.isArchived).toBe(false);
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

      const pinned = await useAppStore.getState().pinNote('to-pin');

      expect(pinned.isPinned).toBe(true);
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

      const unpinned = await useAppStore.getState().unpinNote('to-unpin');

      expect(unpinned.isPinned).toBe(false);
      expect(useAppStore.getState().notes[0].isPinned).toBe(false);
    });
  });

  describe('store subscriptions', () => {
    it('notifies subscribers when notes change', () => {
      const callback = vi.fn();
      const unsubscribe = useAppStore.subscribe(callback);

      const newNote = createMockNote({ id: 'new-note' });
      useAppStore.setState({ notes: [newNote] });

      expect(callback).toHaveBeenCalled();
      unsubscribe();
    });

    it('notifies subscribers when selectedNoteId changes', () => {
      const callback = vi.fn();
      const unsubscribe = useAppStore.subscribe(callback);

      useAppStore.setState({ selectedNoteId: 'some-id' });

      expect(callback).toHaveBeenCalled();
      unsubscribe();
    });
  });
});
