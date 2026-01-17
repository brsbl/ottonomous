/**
 * Full-text search module using Fuse.js for fuzzy searching.
 * Provides search index management, fuzzy search, and match highlighting.
 */

import Fuse, { type IFuseOptions, type RangeTuple } from 'fuse.js';
import type { Note } from '../types';

/**
 * Search result containing the matched note and highlight information.
 */
export interface SearchResult {
  /** The matched note */
  note: Note;
  /** Overall match score (0 = perfect match, 1 = no match) */
  score: number;
  /** Highlighted title with match markers */
  highlightedTitle: string;
  /** Highlighted content snippet with match markers */
  highlightedContent: string;
  /** Raw match indices for custom highlighting */
  matches: {
    title?: number[][];
    content?: number[][];
  };
}

/**
 * Fuse.js configuration options for optimal note searching.
 */
const FUSE_OPTIONS: IFuseOptions<Note> = {
  // Search keys with weights (title is more important)
  keys: [
    { name: 'title', weight: 2 },
    { name: 'content', weight: 1 },
  ],
  // Fuzzy matching threshold (0 = exact, 1 = match anything)
  threshold: 0.4,
  // Include match information for highlighting
  includeMatches: true,
  // Include scores for ranking
  includeScore: true,
  // Minimum number of characters before matching starts
  minMatchCharLength: 2,
  // Find matches in the middle of strings
  findAllMatches: true,
  // Use extended search operators
  useExtendedSearch: false,
  // Ignore location of match in string
  ignoreLocation: true,
};

/**
 * Creates a new Fuse.js search index for the given notes.
 *
 * @param notes - Array of notes to index
 * @returns Configured Fuse instance for searching
 */
export function createSearchIndex(notes: Note[]): Fuse<Note> {
  return new Fuse(notes, FUSE_OPTIONS);
}

/**
 * Highlights matched regions in text using markers.
 * Wraps matched text with <mark> tags for display.
 *
 * @param text - Original text to highlight
 * @param indices - Array of [start, end] index pairs for matches
 * @returns Text with highlight markers inserted
 */
export function highlightMatches(text: string, indices: number[][]): string {
  if (!indices || indices.length === 0) {
    return text;
  }

  // Sort indices by start position in reverse order to avoid offset issues
  const sortedIndices = [...indices].sort((a, b) => b[0] - a[0]);

  let result = text;
  for (const [start, end] of sortedIndices) {
    // Fuse.js indices are inclusive, so we need end + 1
    const before = result.slice(0, start);
    const match = result.slice(start, end + 1);
    const after = result.slice(end + 1);
    result = `${before}<mark>${match}</mark>${after}`;
  }

  return result;
}

/**
 * Extracts a snippet of text around the first match.
 *
 * @param text - Original text
 * @param indices - Match indices
 * @param maxLength - Maximum snippet length (default: 150)
 * @returns Truncated snippet with ellipsis if needed
 */
function extractSnippet(
  text: string,
  indices: number[][] | undefined,
  maxLength: number = 150
): { snippet: string; adjustedIndices: number[][] } {
  if (!indices || indices.length === 0 || text.length <= maxLength) {
    return { snippet: text, adjustedIndices: indices || [] };
  }

  // Find the first match position
  const firstMatchStart = indices[0][0];

  // Calculate snippet boundaries centered around first match
  let snippetStart = Math.max(0, firstMatchStart - 30);
  let snippetEnd = Math.min(text.length, snippetStart + maxLength);

  // Adjust start if we're near the end
  if (snippetEnd - snippetStart < maxLength && snippetStart > 0) {
    snippetStart = Math.max(0, snippetEnd - maxLength);
  }

  // Extract snippet and adjust indices
  let snippet = text.slice(snippetStart, snippetEnd);
  const adjustedIndices: number[][] = [];

  for (const [start, end] of indices) {
    // Only include matches that are within the snippet
    if (start >= snippetStart && end <= snippetEnd) {
      adjustedIndices.push([start - snippetStart, end - snippetStart]);
    } else if (start < snippetEnd && end > snippetStart) {
      // Partial match within snippet
      adjustedIndices.push([
        Math.max(0, start - snippetStart),
        Math.min(snippet.length - 1, end - snippetStart),
      ]);
    }
  }

  // Add ellipsis indicators
  if (snippetStart > 0) {
    snippet = '...' + snippet;
    // Adjust indices for the added ellipsis
    for (const idx of adjustedIndices) {
      idx[0] += 3;
      idx[1] += 3;
    }
  }
  if (snippetEnd < text.length) {
    snippet = snippet + '...';
  }

  return { snippet, adjustedIndices };
}

/**
 * Performs a fuzzy search on the note index.
 *
 * @param query - Search query string
 * @param index - Fuse search index
 * @returns Array of search results with highlighted matches
 */
export function searchNotes(query: string, index: Fuse<Note>): SearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const fuseResults = index.search(query);

  return fuseResults.map((result) => {
    const note = result.item;
    const score = result.score ?? 1;

    // Extract match indices for title and content
    let titleIndices: number[][] = [];
    let contentIndices: number[][] = [];

    if (result.matches) {
      for (const match of result.matches) {
        if (match.key === 'title' && match.indices) {
          titleIndices = (match.indices as readonly RangeTuple[]).map(([start, end]) => [start, end]);
        } else if (match.key === 'content' && match.indices) {
          contentIndices = (match.indices as readonly RangeTuple[]).map(([start, end]) => [start, end]);
        }
      }
    }

    // Create highlighted versions
    const highlightedTitle = highlightMatches(note.title, titleIndices);

    // For content, extract a snippet around the first match
    const { snippet, adjustedIndices } = extractSnippet(
      note.content,
      contentIndices
    );
    const highlightedContent = highlightMatches(snippet, adjustedIndices);

    return {
      note,
      score,
      highlightedTitle,
      highlightedContent,
      matches: {
        title: titleIndices.length > 0 ? titleIndices : undefined,
        content: contentIndices.length > 0 ? contentIndices : undefined,
      },
    };
  });
}

/**
 * Updates an existing search index with new notes.
 * More efficient than recreating the entire index.
 *
 * @param index - Existing Fuse index
 * @param notes - Updated notes array
 */
export function updateSearchIndex(index: Fuse<Note>, notes: Note[]): void {
  index.setCollection(notes);
}
