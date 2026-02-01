import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTags } from './useTags';
import type { Note } from '../types';

// Mock the app store
const mockNotes: Note[] = [];

vi.mock('../store/appStore', () => ({
  useAppStore: vi.fn((selector) => {
    const state = {
      notes: mockNotes,
    };
    return selector(state);
  }),
}));

describe('useTags', () => {
  beforeEach(() => {
    mockNotes.length = 0;
  });

  const createNote = (id: string, tags: string[]): Note => ({
    id,
    title: `Note ${id}`,
    content: `Content ${id}`,
    tags,
    createdAt: new Date(),
    updatedAt: new Date(),
    isArchived: false,
    isPinned: false,
  });

  describe('tags aggregation', () => {
    it('should return empty arrays when there are no notes', () => {
      const { result } = renderHook(() => useTags());

      expect(result.current.tags).toEqual([]);
      expect(result.current.tagTree).toEqual([]);
    });

    it('should return empty arrays when notes have no tags', () => {
      mockNotes.push(createNote('1', []));
      mockNotes.push(createNote('2', []));

      const { result } = renderHook(() => useTags());

      expect(result.current.tags).toEqual([]);
      expect(result.current.tagTree).toEqual([]);
    });

    it('should aggregate tags from multiple notes', () => {
      mockNotes.push(createNote('1', ['work', 'project']));
      mockNotes.push(createNote('2', ['work', 'personal']));

      const { result } = renderHook(() => useTags());

      expect(result.current.tags).toHaveLength(3);
      expect(result.current.tags.find((t) => t.name === 'work')?.noteCount).toBe(2);
      expect(result.current.tags.find((t) => t.name === 'project')?.noteCount).toBe(1);
      expect(result.current.tags.find((t) => t.name === 'personal')?.noteCount).toBe(1);
    });

    it('should sort tags alphabetically', () => {
      mockNotes.push(createNote('1', ['zebra', 'apple', 'mango']));

      const { result } = renderHook(() => useTags());

      expect(result.current.tags.map((t) => t.name)).toEqual(['apple', 'mango', 'zebra']);
    });
  });

  describe('tagTree building', () => {
    it('should create top-level nodes for simple tags', () => {
      mockNotes.push(createNote('1', ['work', 'personal']));

      const { result } = renderHook(() => useTags());

      expect(result.current.tagTree).toHaveLength(2);
      expect(result.current.tagTree.map((n) => n.name)).toEqual(['personal', 'work']);
    });

    it('should create nested nodes for hierarchical tags', () => {
      mockNotes.push(createNote('1', ['work', 'work/projects', 'work/projects/alpha']));

      const { result } = renderHook(() => useTags());

      // Should have one top-level node
      expect(result.current.tagTree).toHaveLength(1);

      const workNode = result.current.tagTree[0];
      expect(workNode.name).toBe('work');
      expect(workNode.fullPath).toBe('work');
      expect(workNode.children).toHaveLength(1);

      const projectsNode = workNode.children[0];
      expect(projectsNode.name).toBe('projects');
      expect(projectsNode.fullPath).toBe('work/projects');
      expect(projectsNode.children).toHaveLength(1);

      const alphaNode = projectsNode.children[0];
      expect(alphaNode.name).toBe('alpha');
      expect(alphaNode.fullPath).toBe('work/projects/alpha');
      expect(alphaNode.children).toHaveLength(0);
    });

    it('should compute correct note counts in tree', () => {
      mockNotes.push(createNote('1', ['work', 'work/projects']));
      mockNotes.push(createNote('2', ['work']));
      mockNotes.push(createNote('3', ['work/projects']));

      const { result } = renderHook(() => useTags());

      const workNode = result.current.tagTree.find((n) => n.name === 'work');
      expect(workNode?.noteCount).toBe(2); // Notes 1 and 2 have "work" tag

      const projectsNode = workNode?.children.find((n) => n.name === 'projects');
      expect(projectsNode?.noteCount).toBe(2); // Notes 1 and 3 have "work/projects" tag
    });

    it('should handle multiple nested tag hierarchies', () => {
      mockNotes.push(createNote('1', ['work', 'work/projects', 'personal', 'personal/health']));

      const { result } = renderHook(() => useTags());

      expect(result.current.tagTree).toHaveLength(2);

      const personalNode = result.current.tagTree.find((n) => n.name === 'personal');
      expect(personalNode?.children).toHaveLength(1);
      expect(personalNode?.children[0].name).toBe('health');

      const workNode = result.current.tagTree.find((n) => n.name === 'work');
      expect(workNode?.children).toHaveLength(1);
      expect(workNode?.children[0].name).toBe('projects');
    });

    it('should create placeholder parent nodes for orphaned hierarchical tags', () => {
      // Only have child tag "work/projects" without parent "work"
      mockNotes.push(createNote('1', ['work/projects']));

      const { result } = renderHook(() => useTags());

      // Should have one top-level node "work" (placeholder)
      expect(result.current.tagTree).toHaveLength(1);

      const workNode = result.current.tagTree[0];
      expect(workNode.name).toBe('work');
      expect(workNode.fullPath).toBe('work');
      expect(workNode.noteCount).toBe(0); // Placeholder has 0 notes
      expect(workNode.children).toHaveLength(1);

      const projectsNode = workNode.children[0];
      expect(projectsNode.name).toBe('projects');
      expect(projectsNode.fullPath).toBe('work/projects');
      expect(projectsNode.noteCount).toBe(1);
    });

    it('should create multiple placeholder parents for deeply nested orphaned tags', () => {
      // Only have "a/b/c/d" without any parents
      mockNotes.push(createNote('1', ['a/b/c/d']));

      const { result } = renderHook(() => useTags());

      // Should have one top-level node "a" (placeholder)
      expect(result.current.tagTree).toHaveLength(1);

      const aNode = result.current.tagTree[0];
      expect(aNode.name).toBe('a');
      expect(aNode.noteCount).toBe(0);

      const bNode = aNode.children[0];
      expect(bNode.name).toBe('b');
      expect(bNode.noteCount).toBe(0);

      const cNode = bNode.children[0];
      expect(cNode.name).toBe('c');
      expect(cNode.noteCount).toBe(0);

      const dNode = cNode.children[0];
      expect(dNode.name).toBe('d');
      expect(dNode.noteCount).toBe(1);
    });

    it('should not duplicate parent when both orphaned child and parent exist', () => {
      // Have both "work" and "work/projects" - should not create duplicate "work"
      mockNotes.push(createNote('1', ['work/projects']));
      mockNotes.push(createNote('2', ['work']));

      const { result } = renderHook(() => useTags());

      // Should have one top-level node "work"
      expect(result.current.tagTree).toHaveLength(1);

      const workNode = result.current.tagTree[0];
      expect(workNode.name).toBe('work');
      expect(workNode.noteCount).toBe(1); // Note 2 has "work" tag
      expect(workNode.children).toHaveLength(1);

      const projectsNode = workNode.children[0];
      expect(projectsNode.name).toBe('projects');
      expect(projectsNode.noteCount).toBe(1);
    });
  });

  describe('getNotesForTag', () => {
    it('should return notes with exact tag match', () => {
      mockNotes.push(createNote('1', ['work']));
      mockNotes.push(createNote('2', ['personal']));

      const { result } = renderHook(() => useTags());
      const notes = result.current.getNotesForTag('work');

      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe('1');
    });

    it('should return notes with child tags when filtering by parent', () => {
      mockNotes.push(createNote('1', ['work']));
      mockNotes.push(createNote('2', ['work/projects']));
      mockNotes.push(createNote('3', ['work/projects/alpha']));
      mockNotes.push(createNote('4', ['personal']));

      const { result } = renderHook(() => useTags());
      const notes = result.current.getNotesForTag('work');

      expect(notes).toHaveLength(3);
      expect(notes.map((n) => n.id).sort()).toEqual(['1', '2', '3']);
    });

    it('should not return parent notes when filtering by child tag', () => {
      mockNotes.push(createNote('1', ['work']));
      mockNotes.push(createNote('2', ['work/projects']));

      const { result } = renderHook(() => useTags());
      const notes = result.current.getNotesForTag('work/projects');

      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe('2');
    });

    it('should return empty array for non-existent tag', () => {
      mockNotes.push(createNote('1', ['work']));

      const { result } = renderHook(() => useTags());
      const notes = result.current.getNotesForTag('nonexistent');

      expect(notes).toHaveLength(0);
    });
  });

  describe('isTagOrParent', () => {
    it('should return true for exact match', () => {
      const { result } = renderHook(() => useTags());

      expect(result.current.isTagOrParent('work', 'work')).toBe(true);
    });

    it('should return true when filter tag is parent of note tag', () => {
      const { result } = renderHook(() => useTags());

      expect(result.current.isTagOrParent('work', 'work/projects')).toBe(true);
      expect(result.current.isTagOrParent('work', 'work/projects/alpha')).toBe(true);
    });

    it('should return false when filter tag is child of note tag', () => {
      const { result } = renderHook(() => useTags());

      expect(result.current.isTagOrParent('work/projects', 'work')).toBe(false);
    });

    it('should return false for unrelated tags', () => {
      const { result } = renderHook(() => useTags());

      expect(result.current.isTagOrParent('work', 'personal')).toBe(false);
    });

    it('should not match partial tag names', () => {
      const { result } = renderHook(() => useTags());

      // "work" should not match "working" as a parent
      expect(result.current.isTagOrParent('work', 'working')).toBe(false);
    });
  });
});
