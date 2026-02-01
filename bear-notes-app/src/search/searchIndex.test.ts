/**
 * Tests for FlexSearch Index
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  initSearchIndex,
  addToIndex,
  removeFromIndex,
  updateInIndex,
  searchIndex,
  rebuildIndex,
  clearIndex,
} from './searchIndex';
import type { Note } from '../types';

/**
 * Create a mock note for testing
 */
function createMockNote(overrides: Partial<Note> = {}): Note {
  return {
    id: overrides.id ?? 'test-id',
    title: overrides.title ?? 'Test Note',
    content: overrides.content ?? 'This is test content',
    tags: overrides.tags ?? [],
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    isArchived: overrides.isArchived ?? false,
    isPinned: overrides.isPinned ?? false,
  };
}

describe('searchIndex', () => {
  beforeEach(() => {
    clearIndex();
    initSearchIndex();
  });

  describe('initSearchIndex', () => {
    it('should create an empty search index', () => {
      const results = searchIndex('anything');
      expect(results).toEqual([]);
    });
  });

  describe('addToIndex', () => {
    it('should add a note to the index', () => {
      const note = createMockNote({
        id: 'note-1',
        title: 'Meeting Notes',
        content: 'Discussion about project timeline',
      });

      addToIndex(note);

      const results = searchIndex('meeting');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('note-1');
    });

    it('should index both title and content', () => {
      const note = createMockNote({
        id: 'note-1',
        title: 'Meeting Notes',
        content: 'Discussion about project timeline',
      });

      addToIndex(note);

      // Search by title
      const titleResults = searchIndex('meeting');
      expect(titleResults).toHaveLength(1);

      // Search by content
      const contentResults = searchIndex('project');
      expect(contentResults).toHaveLength(1);
    });

    it('should store tags and updatedAt', () => {
      const note = createMockNote({
        id: 'note-1',
        title: 'Work Note',
        content: 'Some work content',
        tags: ['work', 'important'],
        updatedAt: new Date('2024-01-15'),
      });

      addToIndex(note);

      const results = searchIndex('work');
      expect(results).toHaveLength(1);
      expect(results[0].tags).toEqual(['work', 'important']);
    });
  });

  describe('removeFromIndex', () => {
    it('should remove a note from the index', () => {
      const note = createMockNote({
        id: 'note-1',
        title: 'Temporary Note',
        content: 'Will be removed',
      });

      addToIndex(note);
      expect(searchIndex('temporary')).toHaveLength(1);

      removeFromIndex('note-1');
      expect(searchIndex('temporary')).toHaveLength(0);
    });

    it('should not affect other notes', () => {
      const note1 = createMockNote({
        id: 'note-1',
        title: 'First Note',
        content: 'Content one',
      });
      const note2 = createMockNote({
        id: 'note-2',
        title: 'Second Note',
        content: 'Content two',
      });

      addToIndex(note1);
      addToIndex(note2);

      removeFromIndex('note-1');

      expect(searchIndex('first')).toHaveLength(0);
      expect(searchIndex('second')).toHaveLength(1);
    });
  });

  describe('updateInIndex', () => {
    it('should update an existing note', () => {
      const note = createMockNote({
        id: 'note-1',
        title: 'Original Title',
        content: 'Original content',
      });

      addToIndex(note);
      expect(searchIndex('original')).toHaveLength(1);

      const updatedNote = createMockNote({
        id: 'note-1',
        title: 'Updated Title',
        content: 'Updated content',
      });

      updateInIndex(updatedNote);

      expect(searchIndex('original')).toHaveLength(0);
      expect(searchIndex('updated')).toHaveLength(1);
    });
  });

  describe('rebuildIndex', () => {
    it('should rebuild the index from an array of notes', () => {
      const notes = [
        createMockNote({ id: 'note-1', title: 'First', content: 'Alpha content' }),
        createMockNote({ id: 'note-2', title: 'Second', content: 'Beta content' }),
        createMockNote({ id: 'note-3', title: 'Third', content: 'Gamma content' }),
      ];

      rebuildIndex(notes);

      expect(searchIndex('alpha')).toHaveLength(1);
      expect(searchIndex('beta')).toHaveLength(1);
      expect(searchIndex('gamma')).toHaveLength(1);
    });

    it('should clear existing index before rebuilding', () => {
      const oldNote = createMockNote({
        id: 'old-note',
        title: 'Old Note',
        content: 'Should be gone',
      });
      addToIndex(oldNote);

      const newNotes = [
        createMockNote({ id: 'new-note', title: 'New Note', content: 'Fresh content' }),
      ];

      rebuildIndex(newNotes);

      expect(searchIndex('old')).toHaveLength(0);
      expect(searchIndex('new')).toHaveLength(1);
    });
  });

  describe('searchIndex', () => {
    beforeEach(() => {
      const notes = [
        createMockNote({
          id: 'note-1',
          title: 'Meeting Notes',
          content: 'Discussed project timeline with team',
          tags: ['work', 'meetings'],
        }),
        createMockNote({
          id: 'note-2',
          title: 'Shopping List',
          content: 'Buy milk, eggs, bread',
          tags: ['personal', 'shopping'],
        }),
        createMockNote({
          id: 'note-3',
          title: 'Project Ideas',
          content: 'New project concepts for next quarter',
          tags: ['work', 'ideas'],
        }),
      ];
      rebuildIndex(notes);
    });

    it('should return empty array for empty query', () => {
      expect(searchIndex('')).toEqual([]);
      expect(searchIndex('   ')).toEqual([]);
    });

    it('should find notes by title', () => {
      const results = searchIndex('meeting');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('note-1');
    });

    it('should find notes by content', () => {
      const results = searchIndex('milk');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('note-2');
    });

    it('should find multiple matching notes', () => {
      const results = searchIndex('project');
      expect(results).toHaveLength(2);
      const ids = results.map((r) => r.id);
      expect(ids).toContain('note-1');
      expect(ids).toContain('note-3');
    });

    it('should respect limit parameter', () => {
      const results = searchIndex('note', 1);
      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('should include matched fields in results', () => {
      const results = searchIndex('meeting');
      expect(results).toHaveLength(1);
      expect(results[0].matchedFields).toBeDefined();
      expect(results[0].matchedFields.length).toBeGreaterThan(0);
    });

    it('should handle prefix matching', () => {
      const results = searchIndex('meet');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('note-1');
    });
  });
});
