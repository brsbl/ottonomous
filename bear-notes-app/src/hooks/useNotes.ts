/**
 * useNotes Hook
 * Provides reactive access to notes state and actions from the Zustand store
 */

import { useCallback } from 'react';
import { useAppStore, selectSelectedNote, selectSortedNotes } from '../store/appStore';
import type { Note, NoteUpdate } from '../types';

/**
 * Return type for the useNotes hook
 */
interface UseNotesResult {
  // State
  notes: Note[];
  sortedNotes: Note[];
  selectedNote: Note | null;
  selectedNoteId: string | null;
  isLoading: boolean;

  // Actions
  createNote: (content?: string) => Promise<Note>;
  updateNote: (id: string, updates: NoteUpdate) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  selectNote: (id: string | null) => void;
  archiveNote: (id: string) => Promise<Note>;
  unarchiveNote: (id: string) => Promise<Note>;
  pinNote: (id: string) => Promise<Note>;
  unpinNote: (id: string) => Promise<Note>;
  loadNotes: () => Promise<void>;
}

/**
 * Hook for accessing and managing notes
 *
 * Provides:
 * - notes: Raw array of notes from the store
 * - sortedNotes: Notes sorted by user preference (pinned first, then by sort order)
 * - selectedNote: The currently selected note object
 * - selectedNoteId: The ID of the currently selected note
 * - isLoading: Whether notes are currently being loaded
 * - CRUD actions for notes
 *
 * @example
 * ```tsx
 * function NoteList() {
 *   const { sortedNotes, selectedNoteId, selectNote, createNote } = useNotes();
 *
 *   return (
 *     <div>
 *       <button onClick={() => createNote()}>New Note</button>
 *       {sortedNotes.map(note => (
 *         <div
 *           key={note.id}
 *           onClick={() => selectNote(note.id)}
 *           className={note.id === selectedNoteId ? 'selected' : ''}
 *         >
 *           {note.title}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNotes(): UseNotesResult {
  // Select state from the store
  const notes = useAppStore((state) => state.notes);
  const sortedNotes = useAppStore(selectSortedNotes);
  const selectedNote = useAppStore(selectSelectedNote);
  const selectedNoteId = useAppStore((state) => state.selectedNoteId);
  const isLoading = useAppStore((state) => state.notesLoading);

  // Get actions from the store (these are stable references)
  const storeCreateNote = useAppStore((state) => state.createNote);
  const storeUpdateNote = useAppStore((state) => state.updateNote);
  const storeDeleteNote = useAppStore((state) => state.deleteNote);
  const storeSelectNote = useAppStore((state) => state.selectNote);
  const storeArchiveNote = useAppStore((state) => state.archiveNote);
  const storeUnarchiveNote = useAppStore((state) => state.unarchiveNote);
  const storePinNote = useAppStore((state) => state.pinNote);
  const storeUnpinNote = useAppStore((state) => state.unpinNote);
  const storeLoadNotes = useAppStore((state) => state.loadNotes);

  // Wrap actions with useCallback for stable references
  const createNote = useCallback(
    (content?: string) => storeCreateNote(content),
    [storeCreateNote]
  );

  const updateNote = useCallback(
    (id: string, updates: NoteUpdate) => storeUpdateNote(id, updates),
    [storeUpdateNote]
  );

  const deleteNote = useCallback(
    (id: string) => storeDeleteNote(id),
    [storeDeleteNote]
  );

  const selectNote = useCallback(
    (id: string | null) => storeSelectNote(id),
    [storeSelectNote]
  );

  const archiveNote = useCallback(
    (id: string) => storeArchiveNote(id),
    [storeArchiveNote]
  );

  const unarchiveNote = useCallback(
    (id: string) => storeUnarchiveNote(id),
    [storeUnarchiveNote]
  );

  const pinNote = useCallback(
    (id: string) => storePinNote(id),
    [storePinNote]
  );

  const unpinNote = useCallback(
    (id: string) => storeUnpinNote(id),
    [storeUnpinNote]
  );

  const loadNotes = useCallback(() => storeLoadNotes(), [storeLoadNotes]);

  return {
    // State
    notes,
    sortedNotes,
    selectedNote,
    selectedNoteId,
    isLoading,

    // Actions
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    archiveNote,
    unarchiveNote,
    pinNote,
    unpinNote,
    loadNotes,
  };
}
