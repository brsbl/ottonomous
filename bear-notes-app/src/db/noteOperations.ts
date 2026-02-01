/**
 * Note CRUD operations for Bear Notes App
 * Provides all database operations for notes as specified in the NoteOperations interface
 */

import { db } from './database';
import type { Note, NoteInput, NoteUpdate } from '../types';
import { extractTags, extractTitle } from '../utils/tagParser';

/**
 * Generate a UUID v4 for note IDs
 * Uses crypto.randomUUID if available, falls back to manual generation
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a new note
 *
 * @param input - Note input with content (title is optional, will be extracted if not provided)
 * @returns The created note with all fields populated
 */
export async function createNote(input: NoteInput): Promise<Note> {
  const now = new Date();
  const content = input.content || '';

  const note: Note = {
    id: generateId(),
    title: input.title || extractTitle(content),
    content,
    tags: extractTags(content),
    createdAt: now,
    updatedAt: now,
    isArchived: false,
    isPinned: false,
  };

  await db.notes.add(note);
  return note;
}

/**
 * Get a single note by ID
 *
 * @param id - The note ID to fetch
 * @returns The note if found, undefined otherwise
 */
export async function getNote(id: string): Promise<Note | undefined> {
  return db.notes.get(id);
}

/**
 * Update an existing note
 *
 * Automatically updates:
 * - updatedAt timestamp
 * - title (if content changed and no explicit title provided)
 * - tags (if content changed)
 *
 * @param id - The note ID to update
 * @param updates - Partial note object with fields to update
 * @returns The updated note
 * @throws Error if note not found
 */
export async function updateNote(
  id: string,
  updates: NoteUpdate
): Promise<Note> {
  const existingNote = await db.notes.get(id);
  if (!existingNote) {
    throw new Error(`Note with id ${id} not found`);
  }

  // Build update object
  const updateData: NoteUpdate = {
    ...updates,
    updatedAt: new Date(),
  };

  // If content is being updated, re-extract title and tags
  if (updates.content !== undefined) {
    updateData.tags = extractTags(updates.content);
    // Only update title if not explicitly provided
    if (updates.title === undefined) {
      updateData.title = extractTitle(updates.content);
    }
  }

  await db.notes.update(id, updateData);

  // Return the updated note
  const updatedNote = await db.notes.get(id);
  if (!updatedNote) {
    throw new Error(`Failed to retrieve updated note ${id}`);
  }
  return updatedNote;
}

/**
 * Delete a note permanently
 *
 * @param id - The note ID to delete
 */
export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id);
}

/**
 * Get all non-archived notes
 *
 * @returns Array of all active (non-archived) notes
 */
export async function getAllNotes(): Promise<Note[]> {
  return db.notes.filter((note) => !note.isArchived).toArray();
}

/**
 * Get notes containing a specific tag
 *
 * Uses the multi-entry index on tags for efficient lookup
 *
 * @param tag - The tag to filter by (e.g., "work" or "work/projects")
 * @returns Array of notes containing the tag
 */
export async function getNotesByTag(tag: string): Promise<Note[]> {
  return db.notes
    .where('tags')
    .equals(tag)
    .filter((note) => !note.isArchived)
    .toArray();
}

/**
 * Get all archived notes
 *
 * @returns Array of archived notes
 */
export async function getArchivedNotes(): Promise<Note[]> {
  return db.notes.filter((note) => note.isArchived).toArray();
}

/**
 * Get all notes without any tags
 *
 * @returns Array of untagged notes
 */
export async function getUntaggedNotes(): Promise<Note[]> {
  return db.notes
    .filter((note) => !note.isArchived && note.tags.length === 0)
    .toArray();
}

/**
 * Archive a note (soft delete)
 *
 * @param id - The note ID to archive
 * @returns The archived note
 */
export async function archiveNote(id: string): Promise<Note> {
  return updateNote(id, { isArchived: true });
}

/**
 * Unarchive a note (restore from archive)
 *
 * @param id - The note ID to unarchive
 * @returns The restored note
 */
export async function unarchiveNote(id: string): Promise<Note> {
  return updateNote(id, { isArchived: false });
}

/**
 * Pin a note to the top
 *
 * @param id - The note ID to pin
 * @returns The pinned note
 */
export async function pinNote(id: string): Promise<Note> {
  return updateNote(id, { isPinned: true });
}

/**
 * Unpin a note
 *
 * @param id - The note ID to unpin
 * @returns The unpinned note
 */
export async function unpinNote(id: string): Promise<Note> {
  return updateNote(id, { isPinned: false });
}

/**
 * Get the count of all notes (excluding archived)
 *
 * @returns The number of active notes
 */
export async function getNoteCount(): Promise<number> {
  return db.notes.filter((note) => !note.isArchived).count();
}
