/**
 * useTags Hook
 * Provides tag aggregation and hierarchical tree building from notes
 */

import { useMemo, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import type { Note, Tag, TagTreeNode } from '../types';

/**
 * Flat tag with note count
 */
interface TagWithCount {
  /** Full tag path (e.g., "work/projects/alpha") */
  name: string;
  /** Number of notes containing this exact tag */
  noteCount: number;
  /** Whether this tag is pinned (for future use) */
  isPinned: boolean;
}

/**
 * Return type for the useTags hook
 */
interface UseTagsResult {
  /** All unique tags across all notes with counts */
  tags: Tag[];
  /** Hierarchical tag tree for sidebar display */
  tagTree: TagTreeNode[];
  /** Get all notes that have a specific tag (including child tags) */
  getNotesForTag: (tagPath: string) => Note[];
  /** Check if a tag path matches or is a parent of another tag */
  isTagOrParent: (tagPath: string, noteTag: string) => boolean;
}

/**
 * Build a hierarchical tree of tags from a flat list
 *
 * @param tags - Flat array of tags with counts
 * @returns Hierarchical tag tree
 */
function buildTagTree(tags: TagWithCount[]): TagTreeNode[] {
  const root: TagTreeNode[] = [];
  const nodeMap = new Map<string, TagTreeNode>();

  // Sort tags by path to ensure parents are processed before children
  const sortedTags = [...tags].sort((a, b) => a.name.localeCompare(b.name));

  for (const tag of sortedTags) {
    const parts = tag.name.split('/');
    const leafName = parts[parts.length - 1];

    const node: TagTreeNode = {
      name: leafName,
      fullPath: tag.name,
      noteCount: tag.noteCount,
      isPinned: tag.isPinned,
      children: [],
    };

    nodeMap.set(tag.name, node);

    if (parts.length === 1) {
      // Top-level tag
      root.push(node);
    } else {
      // Nested tag - ensure all parent nodes exist
      let currentParentPath = '';
      for (let i = 0; i < parts.length - 1; i++) {
        const parentPart = parts[i];
        const newPath = currentParentPath ? `${currentParentPath}/${parentPart}` : parentPart;

        if (!nodeMap.has(newPath)) {
          // Create placeholder parent node
          const placeholderNode: TagTreeNode = {
            name: parentPart,
            fullPath: newPath,
            noteCount: 0,
            isPinned: false,
            children: [],
          };
          nodeMap.set(newPath, placeholderNode);

          // Add to parent or root
          if (currentParentPath) {
            const grandParent = nodeMap.get(currentParentPath);
            grandParent?.children.push(placeholderNode);
          } else {
            root.push(placeholderNode);
          }
        }
        currentParentPath = newPath;
      }

      // Now add the node to its immediate parent
      const parentPath = parts.slice(0, -1).join('/');
      const parent = nodeMap.get(parentPath);
      parent?.children.push(node);
    }
  }

  return root;
}

/**
 * Aggregate all tags from notes and compute counts
 *
 * @param notes - Array of notes to aggregate tags from
 * @returns Array of tags with counts
 */
function aggregateTags(notes: Note[]): TagWithCount[] {
  const tagCounts = new Map<string, number>();

  // Count occurrences of each tag across all notes
  for (const note of notes) {
    for (const tag of note.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  // Convert to array
  const tags: TagWithCount[] = [];
  for (const [name, noteCount] of tagCounts.entries()) {
    tags.push({
      name,
      noteCount,
      isPinned: false, // TODO: Implement pinned tags persistence
    });
  }

  // Sort alphabetically
  return tags.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Check if a tag path matches or is a parent of a note's tag
 *
 * For example:
 * - isTagOrParent("work", "work") => true
 * - isTagOrParent("work", "work/projects") => true
 * - isTagOrParent("work/projects", "work") => false
 *
 * @param filterTag - The tag to filter by
 * @param noteTag - The tag from the note
 * @returns True if noteTag matches or is a descendant of filterTag
 */
function isTagOrParent(filterTag: string, noteTag: string): boolean {
  return noteTag === filterTag || noteTag.startsWith(filterTag + '/');
}

/**
 * Hook for accessing and managing tags derived from notes
 *
 * Provides:
 * - tags: Flat list of all unique tags with note counts
 * - tagTree: Hierarchical tree structure for sidebar display
 * - getNotesForTag: Function to filter notes by tag (includes child tags)
 * - isTagOrParent: Helper to check tag hierarchy relationships
 *
 * @example
 * ```tsx
 * function TagSidebar() {
 *   const { tagTree, getNotesForTag } = useTags();
 *
 *   const handleTagClick = (tagPath: string) => {
 *     const notes = getNotesForTag(tagPath);
 *     console.log(`Found ${notes.length} notes for ${tagPath}`);
 *   };
 *
 *   return (
 *     <nav>
 *       {tagTree.map(node => (
 *         <TagNode key={node.fullPath} node={node} onClick={handleTagClick} />
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 */
export function useTags(): UseTagsResult {
  // Get notes from the store
  const notes = useAppStore((state) => state.notes);

  // Compute flat tags with counts
  const tags = useMemo(() => {
    const aggregated = aggregateTags(notes);
    // Convert to Tag type for external use
    return aggregated.map(
      (t): Tag => ({
        name: t.name,
        noteCount: t.noteCount,
        isPinned: t.isPinned,
      })
    );
  }, [notes]);

  // Build hierarchical tag tree
  const tagTree = useMemo(() => {
    const aggregated = aggregateTags(notes);
    return buildTagTree(aggregated);
  }, [notes]);

  // Function to get notes for a specific tag
  const getNotesForTag = useCallback(
    (tagPath: string): Note[] => {
      return notes.filter((note) =>
        note.tags.some((tag) => isTagOrParent(tagPath, tag))
      );
    },
    [notes]
  );

  // Expose isTagOrParent utility
  const isTagOrParentFn = useCallback(
    (filterTag: string, noteTag: string): boolean => {
      return isTagOrParent(filterTag, noteTag);
    },
    []
  );

  return {
    tags,
    tagTree,
    getNotesForTag,
    isTagOrParent: isTagOrParentFn,
  };
}
