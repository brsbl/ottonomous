/**
 * useSearch Hook
 * Provides combined text and tag search functionality
 */

import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import {
  initSearchIndex,
  addToIndex,
  removeFromIndex,
  updateInIndex,
  searchIndex as flexSearchIndex,
  rebuildIndex,
} from '../search/searchIndex';
import type { Note, SearchResult } from '../types';

/**
 * Options for the useSearch hook
 */
interface UseSearchOptions {
  /** Maximum number of results to return (default: 50) */
  limit?: number;
  /** Maximum length of highlighted content snippet (default: 150) */
  snippetLength?: number;
}

/**
 * Return type for the useSearch hook
 */
interface UseSearchResult {
  /** Perform a search with combined text and tag filtering */
  search: (query: string) => SearchResult[];
  /** Whether the search index is ready */
  isIndexReady: boolean;
}

/**
 * Parse a search query into text and tag components
 *
 * @param query - The raw search query
 * @returns Object with textQuery and tags array
 */
function parseQuery(query: string): { textQuery: string; tags: string[] } {
  const tagRegex = /#([\w-]+(?:\/[\w-]+)*)/g;
  const tags: string[] = [];
  let match;

  while ((match = tagRegex.exec(query)) !== null) {
    tags.push(match[1]);
  }

  // Remove tag patterns from query to get plain text
  const textQuery = query.replace(tagRegex, '').trim();

  return { textQuery, tags };
}

/**
 * Highlight matching terms in text
 *
 * @param text - The text to highlight
 * @param query - The search query to highlight
 * @returns Text with matches wrapped in <mark> tags
 */
function highlightMatches(text: string, query: string): string {
  if (!query.trim()) {
    return text;
  }

  // Split query into words and escape regex special characters
  const words = query
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (words.length === 0) {
    return text;
  }

  // Create regex to match any of the query words (case-insensitive)
  const regex = new RegExp(`(${words.join('|')})`, 'gi');

  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Extract a snippet of content around the first match
 *
 * @param content - The full content
 * @param query - The search query
 * @param maxLength - Maximum snippet length
 * @returns A snippet with the match highlighted
 */
function extractSnippet(
  content: string,
  query: string,
  maxLength: number
): string {
  if (!query.trim()) {
    return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
  }

  // Find the first matching word
  const words = query.split(/\s+/).filter((w) => w.length > 0);
  let firstMatchIndex = -1;

  for (const word of words) {
    const index = content.toLowerCase().indexOf(word.toLowerCase());
    if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
      firstMatchIndex = index;
    }
  }

  if (firstMatchIndex === -1) {
    // No match found, return start of content
    return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
  }

  // Calculate snippet bounds centered around the first match
  const halfLength = Math.floor(maxLength / 2);
  const end = Math.min(content.length, Math.max(0, firstMatchIndex - halfLength) + maxLength);
  let start = Math.max(0, firstMatchIndex - halfLength);

  // Adjust start if we're near the end
  if (end === content.length && end - start < maxLength) {
    start = Math.max(0, end - maxLength);
  }

  let snippet = content.slice(start, end);

  // Add ellipsis if truncated
  if (start > 0) {
    snippet = '...' + snippet;
  }
  if (end < content.length) {
    snippet = snippet + '...';
  }

  return highlightMatches(snippet, query);
}

/**
 * Check if a note has all the required tags
 *
 * @param note - The note to check
 * @param requiredTags - Tags that must be present
 * @returns True if the note has all required tags
 */
function hasAllTags(note: Note, requiredTags: string[]): boolean {
  return requiredTags.every((tag) =>
    note.tags.some(
      (noteTag) => noteTag === tag || noteTag.startsWith(tag + '/')
    )
  );
}

// Module-level flag to track if the FlexSearch index has been created
// This is separate from per-instance sync state to avoid recreating the index
let indexCreated = false;

/**
 * Hook for searching notes with combined text and tag filtering
 *
 * Provides:
 * - search: Function to perform searches
 * - isIndexReady: Whether the index is initialized
 *
 * Search queries can include:
 * - Plain text for full-text search
 * - #tag patterns for tag filtering
 * - Combined queries like "meeting notes #work/projects"
 *
 * @example
 * ```tsx
 * function SearchBar() {
 *   const { search, isIndexReady } = useSearch();
 *   const [query, setQuery] = useState('');
 *   const [results, setResults] = useState<SearchResult[]>([]);
 *
 *   useEffect(() => {
 *     if (isIndexReady) {
 *       setResults(search(query));
 *     }
 *   }, [query, search, isIndexReady]);
 *
 *   return (
 *     <div>
 *       <input value={query} onChange={(e) => setQuery(e.target.value)} />
 *       {results.map(result => (
 *         <div key={result.note.id}>
 *           <div dangerouslySetInnerHTML={{ __html: result.highlightedTitle || result.note.title }} />
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchResult {
  const { limit = 50, snippetLength = 150 } = options;

  // Get notes from the store
  const notes = useAppStore((state) => state.notes);

  // Track previous notes for incremental updates (per-instance)
  const previousNotesRef = useRef<Note[]>([]);

  // Track whether this hook instance has synced (per-instance)
  const hasSyncedRef = useRef(false);

  // Track index ready state - starts false, set true after first sync
  const [isReady, setIsReady] = useState(false);

  // Initialize and keep the search index in sync with notes
  useEffect(() => {
    // Ensure the FlexSearch index is created (module-level, happens once)
    if (!indexCreated) {
      initSearchIndex();
      indexCreated = true;
    }

    // If this instance hasn't synced yet, do a full rebuild
    // This handles React Strict Mode double-mounting and fresh mounts
    if (!hasSyncedRef.current) {
      rebuildIndex(notes);
      previousNotesRef.current = notes;
      hasSyncedRef.current = true;
      // Signal that we're ready - this is a legitimate state update after async init
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsReady(true);
      return;
    }

    // Incremental updates when notes change
    const previousNotes = previousNotesRef.current;
    const previousMap = new Map(previousNotes.map((n) => [n.id, n]));
    const currentMap = new Map(notes.map((n) => [n.id, n]));

    // Find added notes
    for (const note of notes) {
      const prev = previousMap.get(note.id);
      if (!prev) {
        // New note
        addToIndex(note);
      } else if (
        prev.title !== note.title ||
        prev.content !== note.content ||
        prev.tags.join(',') !== note.tags.join(',')
      ) {
        // Updated note (title, content, or tags changed)
        updateInIndex(note);
      }
    }

    // Find removed notes
    for (const prev of previousNotes) {
      if (!currentMap.has(prev.id)) {
        removeFromIndex(prev.id);
      }
    }

    previousNotesRef.current = notes;
  }, [notes]);

  // Create a stable search function
  const search = useCallback(
    (query: string): SearchResult[] => {
      if (!query.trim()) {
        return [];
      }

      const { textQuery, tags: requiredTags } = parseQuery(query);

      // If we have a text query, use FlexSearch
      let candidateIds: Set<string> | null = null;

      if (textQuery) {
        const flexResults = flexSearchIndex(textQuery, limit);
        candidateIds = new Set(flexResults.map((r) => r.id));
      }

      // Build results with filtering and scoring
      const results: SearchResult[] = [];

      for (const note of notes) {
        // Skip if not in FlexSearch results (when text query exists)
        if (candidateIds !== null && !candidateIds.has(note.id)) {
          continue;
        }

        // Skip if doesn't have required tags
        if (requiredTags.length > 0 && !hasAllTags(note, requiredTags)) {
          continue;
        }

        // Calculate score based on matching
        let score = 0;
        if (textQuery) {
          // Boost for title matches
          if (note.title.toLowerCase().includes(textQuery.toLowerCase())) {
            score += 10;
          }
          // Base score for content match
          if (note.content.toLowerCase().includes(textQuery.toLowerCase())) {
            score += 5;
          }
        }
        // Boost for each matching tag
        score += requiredTags.length * 2;

        results.push({
          note,
          highlightedTitle: textQuery
            ? highlightMatches(note.title, textQuery)
            : undefined,
          highlightedContent: textQuery
            ? extractSnippet(note.content, textQuery, snippetLength)
            : undefined,
          score,
        });
      }

      // Sort by score descending
      results.sort((a, b) => b.score - a.score);

      // Limit results
      return results.slice(0, limit);
    },
    [notes, limit, snippetLength]
  );

  // Memoize the return value
  return useMemo(
    () => ({
      search,
      isIndexReady: isReady,
    }),
    [search, isReady]
  );
}

/**
 * Reset the search index state (for testing purposes)
 */
export function resetSearchState(): void {
  indexCreated = false;
}
