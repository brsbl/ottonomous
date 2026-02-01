import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Dexie from 'dexie'
import { db } from './database'
import {
  createNote,
  getNote,
  updateNote,
  deleteNote,
  getAllNotes,
  getNotesByTag,
  getArchivedNotes,
  getUntaggedNotes,
  archiveNote,
  unarchiveNote,
  pinNote,
  unpinNote,
  getNoteCount,
} from './noteOperations'

describe('Note CRUD Operations', () => {
  beforeEach(async () => {
    await db.notes.clear()
  })

  afterEach(async () => {
    await db.notes.clear()
  })

  describe('createNote', () => {
    it('should create a note with required fields', async () => {
      const note = await createNote({ content: 'Test content' })

      expect(note.id).toBeDefined()
      expect(note.content).toBe('Test content')
      expect(note.createdAt).toBeInstanceOf(Date)
      expect(note.updatedAt).toBeInstanceOf(Date)
      expect(note.isArchived).toBe(false)
      expect(note.isPinned).toBe(false)
    })

    it('should generate a UUID for id', async () => {
      const note = await createNote({ content: 'Test' })
      // UUID v4 pattern
      expect(note.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('should extract title from content when not provided', async () => {
      const note = await createNote({ content: '# My Title\nContent here' })
      expect(note.title).toBe('My Title')
    })

    it('should use provided title over extracted one', async () => {
      const note = await createNote({
        content: '# Extracted Title\nContent',
        title: 'Custom Title',
      })
      expect(note.title).toBe('Custom Title')
    })

    it('should extract tags from content', async () => {
      const note = await createNote({ content: 'Hello #world and #test' })
      expect(note.tags).toContain('world')
      expect(note.tags).toContain('test')
    })

    it('should extract hierarchical tags with parents', async () => {
      const note = await createNote({ content: '#work/projects/alpha' })
      expect(note.tags).toContain('work')
      expect(note.tags).toContain('work/projects')
      expect(note.tags).toContain('work/projects/alpha')
    })

    it('should persist note to database', async () => {
      const note = await createNote({ content: 'Persisted' })
      const retrieved = await db.notes.get(note.id)
      expect(retrieved).toBeDefined()
      expect(retrieved?.content).toBe('Persisted')
    })

    it('should handle empty content', async () => {
      const note = await createNote({ content: '' })
      expect(note.content).toBe('')
      expect(note.title).toBe('Untitled')
      expect(note.tags).toEqual([])
    })
  })

  describe('getNote', () => {
    it('should retrieve an existing note by id', async () => {
      const created = await createNote({ content: 'Find me' })
      const retrieved = await getNote(created.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.content).toBe('Find me')
    })

    it('should return undefined for non-existent id', async () => {
      const result = await getNote('non-existent-id')
      expect(result).toBeUndefined()
    })
  })

  describe('updateNote', () => {
    it('should update note content', async () => {
      const note = await createNote({ content: 'Original' })
      const updated = await updateNote(note.id, { content: 'Updated' })

      expect(updated.content).toBe('Updated')
    })

    it('should update updatedAt timestamp', async () => {
      const note = await createNote({ content: 'Original' })
      const originalUpdatedAt = note.updatedAt

      // Small delay to ensure different timestamp
      await new Promise((r) => setTimeout(r, 10))

      const updated = await updateNote(note.id, { content: 'Updated' })
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      )
    })

    it('should re-extract tags when content changes', async () => {
      const note = await createNote({ content: '#old-tag' })
      expect(note.tags).toContain('old-tag')

      const updated = await updateNote(note.id, { content: '#new-tag' })
      expect(updated.tags).not.toContain('old-tag')
      expect(updated.tags).toContain('new-tag')
    })

    it('should re-extract title when content changes', async () => {
      const note = await createNote({ content: '# Old Title' })
      expect(note.title).toBe('Old Title')

      const updated = await updateNote(note.id, { content: '# New Title' })
      expect(updated.title).toBe('New Title')
    })

    it('should not override title if explicitly provided', async () => {
      const note = await createNote({ content: '# Old Title' })

      const updated = await updateNote(note.id, {
        content: '# Content Title',
        title: 'Custom Title',
      })
      expect(updated.title).toBe('Custom Title')
    })

    it('should throw error for non-existent note', async () => {
      await expect(
        updateNote('non-existent', { content: 'test' })
      ).rejects.toThrow('Note with id non-existent not found')
    })

    it('should allow partial updates', async () => {
      const note = await createNote({ content: 'Original' })
      const updated = await updateNote(note.id, { isPinned: true })

      expect(updated.isPinned).toBe(true)
      expect(updated.content).toBe('Original')
    })
  })

  describe('deleteNote', () => {
    it('should permanently delete a note', async () => {
      const note = await createNote({ content: 'Delete me' })
      await deleteNote(note.id)

      const retrieved = await getNote(note.id)
      expect(retrieved).toBeUndefined()
    })

    it('should not throw for non-existent note', async () => {
      await expect(deleteNote('non-existent')).resolves.toBeUndefined()
    })
  })

  describe('getAllNotes', () => {
    it('should return all non-archived notes', async () => {
      await createNote({ content: 'Note 1' })
      await createNote({ content: 'Note 2' })
      const archived = await createNote({ content: 'Archived' })
      await updateNote(archived.id, { isArchived: true })

      const notes = await getAllNotes()
      expect(notes.length).toBe(2)
    })

    it('should return empty array when no notes exist', async () => {
      const notes = await getAllNotes()
      expect(notes).toEqual([])
    })
  })

  describe('getNotesByTag', () => {
    it('should return notes containing specific tag', async () => {
      await createNote({ content: '#work task 1' })
      await createNote({ content: '#work task 2' })
      await createNote({ content: '#personal item' })

      const workNotes = await getNotesByTag('work')
      expect(workNotes.length).toBe(2)
    })

    it('should exclude archived notes', async () => {
      const note = await createNote({ content: '#work archived' })
      await updateNote(note.id, { isArchived: true })
      await createNote({ content: '#work active' })

      const workNotes = await getNotesByTag('work')
      expect(workNotes.length).toBe(1)
    })

    it('should return empty array for non-existent tag', async () => {
      await createNote({ content: '#other' })
      const notes = await getNotesByTag('nonexistent')
      expect(notes).toEqual([])
    })

    it('should match exact tag including nested tags', async () => {
      await createNote({ content: '#work/projects' })

      const workNotes = await getNotesByTag('work')
      expect(workNotes.length).toBe(1)

      const projectNotes = await getNotesByTag('work/projects')
      expect(projectNotes.length).toBe(1)
    })
  })

  describe('getArchivedNotes', () => {
    it('should return only archived notes', async () => {
      await createNote({ content: 'Active' })
      const archived = await createNote({ content: 'Archived' })
      await updateNote(archived.id, { isArchived: true })

      const archivedNotes = await getArchivedNotes()
      expect(archivedNotes.length).toBe(1)
      expect(archivedNotes[0].content).toBe('Archived')
    })

    it('should return empty array when no archived notes', async () => {
      await createNote({ content: 'Active' })
      const archived = await getArchivedNotes()
      expect(archived).toEqual([])
    })
  })

  describe('getUntaggedNotes', () => {
    it('should return notes without any tags', async () => {
      await createNote({ content: 'No tags here' })
      await createNote({ content: '#tagged content' })

      const untagged = await getUntaggedNotes()
      expect(untagged.length).toBe(1)
      expect(untagged[0].content).toBe('No tags here')
    })

    it('should exclude archived untagged notes', async () => {
      const note = await createNote({ content: 'Archived untagged' })
      await updateNote(note.id, { isArchived: true })
      await createNote({ content: 'Active untagged' })

      const untagged = await getUntaggedNotes()
      expect(untagged.length).toBe(1)
    })
  })

  describe('archiveNote', () => {
    it('should set isArchived to true', async () => {
      const note = await createNote({ content: 'To archive' })
      const archived = await archiveNote(note.id)

      expect(archived.isArchived).toBe(true)
    })

    it('should preserve other note properties', async () => {
      const note = await createNote({ content: '#tagged content' })
      const archived = await archiveNote(note.id)

      expect(archived.content).toBe('#tagged content')
      expect(archived.tags).toContain('tagged')
    })
  })

  describe('unarchiveNote', () => {
    it('should set isArchived to false', async () => {
      const note = await createNote({ content: 'Archived' })
      await archiveNote(note.id)
      const unarchived = await unarchiveNote(note.id)

      expect(unarchived.isArchived).toBe(false)
    })
  })

  describe('pinNote', () => {
    it('should set isPinned to true', async () => {
      const note = await createNote({ content: 'To pin' })
      const pinned = await pinNote(note.id)

      expect(pinned.isPinned).toBe(true)
    })
  })

  describe('unpinNote', () => {
    it('should set isPinned to false', async () => {
      const note = await createNote({ content: 'Pinned' })
      await pinNote(note.id)
      const unpinned = await unpinNote(note.id)

      expect(unpinned.isPinned).toBe(false)
    })
  })

  describe('getNoteCount', () => {
    it('should return count of non-archived notes', async () => {
      await createNote({ content: 'Note 1' })
      await createNote({ content: 'Note 2' })
      const archived = await createNote({ content: 'Archived' })
      await archiveNote(archived.id)

      const count = await getNoteCount()
      expect(count).toBe(2)
    })

    it('should return 0 when no notes exist', async () => {
      const count = await getNoteCount()
      expect(count).toBe(0)
    })
  })
})

// Clean up database after all tests
afterEach(async () => {
  try {
    await Dexie.delete('BearNotesDB')
  } catch {
    // Ignore cleanup errors
  }
})
