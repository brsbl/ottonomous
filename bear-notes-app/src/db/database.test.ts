import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Dexie from 'dexie'
import { NotesDatabase, db, initializeDatabase } from './database'

describe('NotesDatabase', () => {
  describe('schema definition', () => {
    it('should create a database named BearNotesDB', () => {
      const testDb = new NotesDatabase()
      expect(testDb.name).toBe('BearNotesDB')
      testDb.close()
    })

    it('should have notes table', () => {
      const testDb = new NotesDatabase()
      expect(testDb.notes).toBeDefined()
      testDb.close()
    })

    it('should have settings table', () => {
      const testDb = new NotesDatabase()
      expect(testDb.settings).toBeDefined()
      testDb.close()
    })

    it('should extend Dexie', () => {
      const testDb = new NotesDatabase()
      expect(testDb).toBeInstanceOf(Dexie)
      testDb.close()
    })
  })

  describe('singleton instance', () => {
    it('should export a db singleton', () => {
      expect(db).toBeDefined()
      expect(db).toBeInstanceOf(NotesDatabase)
    })

    it('should have correct database name', () => {
      expect(db.name).toBe('BearNotesDB')
    })
  })
})

describe('initializeDatabase', () => {
  // Use a separate test database to avoid polluting the main db
  let testDb: NotesDatabase

  beforeEach(async () => {
    // Create a fresh database for each test
    testDb = new NotesDatabase()
    // Delete any existing data
    await testDb.settings.clear()
  })

  afterEach(async () => {
    await testDb.close()
    await Dexie.delete('BearNotesDB')
  })

  it('should initialize with default settings when empty', async () => {
    // Clear and initialize using the actual db singleton
    await db.settings.clear()
    await initializeDatabase()

    const settings = await db.settings.get('app-settings')
    expect(settings).toBeDefined()
    expect(settings?.theme).toBe('system')
    expect(settings?.fontSize).toBe('medium')
    expect(settings?.sidebarVisible).toBe(true)
    expect(settings?.sortOrder).toBe('updated')
  })

  it('should not overwrite existing settings', async () => {
    // Add custom settings first
    await db.settings.clear()
    await db.settings.add({
      id: 'app-settings',
      theme: 'dark',
      fontSize: 'large',
      sidebarVisible: false,
      sortOrder: 'title',
    })

    // Call initialize - should not overwrite
    await initializeDatabase()

    const settings = await db.settings.get('app-settings')
    expect(settings?.theme).toBe('dark')
    expect(settings?.fontSize).toBe('large')
    expect(settings?.sidebarVisible).toBe(false)
    expect(settings?.sortOrder).toBe('title')
  })

  it('should create settings with correct id', async () => {
    await db.settings.clear()
    await initializeDatabase()

    const settings = await db.settings.get('app-settings')
    expect(settings?.id).toBe('app-settings')
  })
})

describe('database indexes', () => {
  beforeEach(async () => {
    await db.notes.clear()
  })

  afterEach(async () => {
    await db.notes.clear()
  })

  it('should allow storing notes with required fields', async () => {
    const note = {
      id: 'test-id-1',
      title: 'Test Note',
      content: 'Test content',
      tags: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
      isPinned: false,
    }

    await db.notes.add(note)
    const retrieved = await db.notes.get('test-id-1')

    expect(retrieved).toBeDefined()
    expect(retrieved?.title).toBe('Test Note')
  })

  it('should query notes by id (primary key)', async () => {
    const note = {
      id: 'unique-id-123',
      title: 'Unique Note',
      content: 'Content',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
      isPinned: false,
    }

    await db.notes.add(note)
    const result = await db.notes.get('unique-id-123')

    expect(result).toBeDefined()
    expect(result?.id).toBe('unique-id-123')
  })

  it('should query notes by tag using multi-entry index', async () => {
    const note1 = {
      id: 'note-1',
      title: 'Work Note',
      content: '#work stuff',
      tags: ['work', 'important'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
      isPinned: false,
    }

    const note2 = {
      id: 'note-2',
      title: 'Personal Note',
      content: '#personal stuff',
      tags: ['personal'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
      isPinned: false,
    }

    await db.notes.bulkAdd([note1, note2])

    const workNotes = await db.notes.where('tags').equals('work').toArray()
    expect(workNotes.length).toBe(1)
    expect(workNotes[0].id).toBe('note-1')

    const importantNotes = await db.notes
      .where('tags')
      .equals('important')
      .toArray()
    expect(importantNotes.length).toBe(1)
    expect(importantNotes[0].id).toBe('note-1')
  })

  it('should query notes by isArchived', async () => {
    const activeNote = {
      id: 'active-1',
      title: 'Active',
      content: '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
      isPinned: false,
    }

    const archivedNote = {
      id: 'archived-1',
      title: 'Archived',
      content: '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: true,
      isPinned: false,
    }

    await db.notes.bulkAdd([activeNote, archivedNote])

    const archivedNotes = await db.notes
      .filter((note) => note.isArchived)
      .toArray()
    expect(archivedNotes.length).toBe(1)
    expect(archivedNotes[0].id).toBe('archived-1')
  })

  it('should allow updating notes', async () => {
    const note = {
      id: 'update-test',
      title: 'Original',
      content: 'Original content',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
      isPinned: false,
    }

    await db.notes.add(note)
    await db.notes.update('update-test', { title: 'Updated' })

    const updated = await db.notes.get('update-test')
    expect(updated?.title).toBe('Updated')
  })

  it('should allow deleting notes', async () => {
    const note = {
      id: 'delete-test',
      title: 'To Delete',
      content: '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
      isPinned: false,
    }

    await db.notes.add(note)
    await db.notes.delete('delete-test')

    const deleted = await db.notes.get('delete-test')
    expect(deleted).toBeUndefined()
  })
})
