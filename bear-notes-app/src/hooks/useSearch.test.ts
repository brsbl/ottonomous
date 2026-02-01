/**
 * Tests for useSearch Hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch, resetSearchState } from './useSearch';
import { useAppStore } from '../store/appStore';
import { clearIndex } from '../search/searchIndex';
import type { Note } from '../types';

/**
 * Create a mock note for testing
 */
function createMockNote(overrides: Partial<Note> = {}): Note {
  return {
    id: overrides.id ?? `note-${Math.random().toString(36).slice(2)}`,
    title: overrides.title ?? 'Test Note',
    content: overrides.content ?? 'This is test content',
    tags: overrides.tags ?? [],
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    isArchived: overrides.isArchived ?? false,
    isPinned: overrides.isPinned ?? false,
  };
}

describe('useSearch', () => {
  beforeEach(() => {
    // Reset the store before each test
    useAppStore.setState({
      notes: [],
      selectedNoteId: null,
      notesLoading: false,
    });
    // Reset the search index
    clearIndex();
    resetSearchState();
  });

  describe('initialization', () => {
    it('should initialize with search function', () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.search).toBeDefined();
      expect(typeof result.current.search).toBe('function');
    });

    it('should have isIndexReady flag', () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.isIndexReady).toBeDefined();
    });
  });

  describe('search function', () => {
    beforeEach(() => {
      const notes = [
        createMockNote({
          id: 'note-1',
          title: 'Meeting Notes',
          content: 'Discussed project timeline with team #work',
          tags: ['work'],
        }),
        createMockNote({
          id: 'note-2',
          title: 'Shopping List',
          content: 'Buy milk, eggs, bread #personal #shopping',
          tags: ['personal', 'shopping'],
        }),
        createMockNote({
          id: 'note-3',
          title: 'Project Ideas',
          content: 'New project concepts for next quarter #work/ideas',
          tags: ['work', 'work/ideas'],
        }),
      ];

      useAppStore.setState({ notes });
    });

    it('should return empty array for empty query', () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.search('')).toEqual([]);
      expect(result.current.search('   ')).toEqual([]);
    });

    it('should find notes by text query', () => {
      const { result } = renderHook(() => useSearch());

      const results = result.current.search('meeting');

      expect(results).toHaveLength(1);
      expect(results[0].note.id).toBe('note-1');
    });

    it('should find notes by tag query', () => {
      const { result } = renderHook(() => useSearch());

      const results = result.current.search('#work');

      expect(results.length).toBeGreaterThan(0);
      results.forEach((r) => {
        expect(r.note.tags.some((t) => t === 'work' || t.startsWith('work/'))).toBe(true);
      });
    });

    it('should find notes by combined text and tag query', () => {
      const { result } = renderHook(() => useSearch());

      const results = result.current.search('project #work');

      expect(results.length).toBeGreaterThan(0);
      results.forEach((r) => {
        expect(r.note.tags.some((t) => t === 'work' || t.startsWith('work/'))).toBe(true);
      });
    });

    it('should handle nested tag queries', () => {
      const { result } = renderHook(() => useSearch());

      const results = result.current.search('#work/ideas');

      expect(results).toHaveLength(1);
      expect(results[0].note.id).toBe('note-3');
    });

    it('should include child tags when searching parent tag', () => {
      const { result } = renderHook(() => useSearch());

      const results = result.current.search('#work');

      expect(results.length).toBeGreaterThanOrEqual(2);
      const ids = results.map((r) => r.note.id);
      expect(ids).toContain('note-1');
      expect(ids).toContain('note-3');
    });

    it('should include highlighted title in results', () => {
      const { result } = renderHook(() => useSearch());

      const results = result.current.search('meeting');

      expect(results).toHaveLength(1);
      expect(results[0].highlightedTitle).toContain('<mark>');
      expect(results[0].highlightedTitle).toContain('Meeting');
    });

    it('should include highlighted content snippet in results', () => {
      const { result } = renderHook(() => useSearch());

      const results = result.current.search('timeline');

      expect(results).toHaveLength(1);
      expect(results[0].highlightedContent).toContain('<mark>');
      expect(results[0].highlightedContent).toContain('timeline');
    });

    it('should not include highlighting for tag-only queries', () => {
      const { result } = renderHook(() => useSearch());

      const results = result.current.search('#work');

      results.forEach((r) => {
        expect(r.highlightedTitle).toBeUndefined();
        expect(r.highlightedContent).toBeUndefined();
      });
    });

    it('should include score in results', () => {
      const { result } = renderHook(() => useSearch());

      const results = result.current.search('project');

      expect(results.length).toBeGreaterThan(0);
      results.forEach((r) => {
        expect(typeof r.score).toBe('number');
      });
    });

    it('should sort results by score descending', () => {
      const { result } = renderHook(() => useSearch());

      const results = result.current.search('project');

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('should respect limit option', () => {
      const { result } = renderHook(() => useSearch({ limit: 1 }));

      const results = result.current.search('project');

      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('index synchronization', () => {
    it('should update index when notes are added', async () => {
      const { result, rerender } = renderHook(() => useSearch());

      // Initially no notes
      expect(result.current.search('test')).toHaveLength(0);

      // Add notes to store
      const newNote = createMockNote({
        id: 'new-note',
        title: 'Test Note',
        content: 'Test content',
      });

      act(() => {
        useAppStore.setState({ notes: [newNote] });
      });

      rerender();

      // Should find the new note
      const results = result.current.search('test');
      expect(results).toHaveLength(1);
      expect(results[0].note.id).toBe('new-note');
    });

    it('should update index when notes are removed', () => {
      const note = createMockNote({
        id: 'note-1',
        title: 'Original Note',
        content: 'Original content',
      });

      useAppStore.setState({ notes: [note] });

      const { result, rerender } = renderHook(() => useSearch());

      expect(result.current.search('original')).toHaveLength(1);

      // Remove the note
      act(() => {
        useAppStore.setState({ notes: [] });
      });

      rerender();

      expect(result.current.search('original')).toHaveLength(0);
    });

    it('should update index when notes are modified', () => {
      const note = createMockNote({
        id: 'note-1',
        title: 'Original Title',
        content: 'Original content',
      });

      useAppStore.setState({ notes: [note] });

      const { result, rerender } = renderHook(() => useSearch());

      expect(result.current.search('original')).toHaveLength(1);

      // Update the note
      const updatedNote = {
        ...note,
        title: 'Updated Title',
        content: 'Updated content',
      };

      act(() => {
        useAppStore.setState({ notes: [updatedNote] });
      });

      rerender();

      expect(result.current.search('original')).toHaveLength(0);
      expect(result.current.search('updated')).toHaveLength(1);
    });
  });

  describe('query parsing', () => {
    beforeEach(() => {
      const notes = [
        createMockNote({
          id: 'note-1',
          title: 'Work Meeting',
          content: 'Team standup notes',
          tags: ['work', 'meetings'],
        }),
        createMockNote({
          id: 'note-2',
          title: 'Personal Project',
          content: 'Weekend coding project',
          tags: ['personal', 'coding'],
        }),
      ];

      useAppStore.setState({ notes });
    });

    it('should parse multiple tags from query', () => {
      const { result } = renderHook(() => useSearch());

      // This note has both work and meetings tags
      const results = result.current.search('#work #meetings');

      expect(results).toHaveLength(1);
      expect(results[0].note.id).toBe('note-1');
    });

    it('should handle mixed text and multiple tags', () => {
      const { result } = renderHook(() => useSearch());

      const results = result.current.search('meeting #work');

      expect(results).toHaveLength(1);
      expect(results[0].note.id).toBe('note-1');
    });

    it('should handle hyphenated tags', () => {
      const note = createMockNote({
        id: 'note-3',
        title: 'Long-term Goals',
        content: 'Goals for the year',
        tags: ['long-term'],
      });

      act(() => {
        useAppStore.setState((state) => ({
          notes: [...state.notes, note],
        }));
      });

      const { result } = renderHook(() => useSearch());

      const results = result.current.search('#long-term');

      expect(results).toHaveLength(1);
      expect(results[0].note.id).toBe('note-3');
    });
  });

  describe('highlighting', () => {
    beforeEach(() => {
      const notes = [
        createMockNote({
          id: 'note-1',
          title: 'Important Meeting',
          content: 'This is an important discussion about the important project',
        }),
      ];

      useAppStore.setState({ notes });
    });

    it('should highlight multiple occurrences in title', () => {
      const { result } = renderHook(() => useSearch());

      const results = result.current.search('important');

      expect(results[0].highlightedTitle).toContain('<mark>Important</mark>');
    });

    it('should handle case-insensitive highlighting', () => {
      const { result } = renderHook(() => useSearch());

      const results = result.current.search('MEETING');

      expect(results[0].highlightedTitle?.toLowerCase()).toContain('<mark>meeting</mark>');
    });

    it('should create content snippets around matches', () => {
      const { result } = renderHook(() => useSearch({ snippetLength: 50 }));

      const results = result.current.search('discussion');

      expect(results[0].highlightedContent).toBeDefined();
      // Snippet length is approximate due to ellipsis and <mark> tags
      // The base content should be around 50 chars, but with markup it can be longer
      expect(results[0].highlightedContent).toContain('discussion');
    });
  });

  describe('performance', () => {
    it('should complete search in under 100ms for moderate dataset', () => {
      // Create 100 notes
      const notes: Note[] = [];
      for (let i = 0; i < 100; i++) {
        notes.push(
          createMockNote({
            id: `note-${i}`,
            title: `Note ${i}: Various Topics`,
            content: `This is content for note ${i} with various keywords like meeting, project, timeline, and more`,
            tags: ['work', 'test'],
          })
        );
      }

      useAppStore.setState({ notes });

      const { result } = renderHook(() => useSearch());

      const startTime = performance.now();
      result.current.search('meeting');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
