/**
 * FlexSearch Index for Bear Notes App
 * Provides full-text search capabilities for notes
 */

import FlexSearch from 'flexsearch';
import type { Note } from '../types';

/**
 * Document structure for the search index
 */
interface IndexedDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: Date;
}

/**
 * Enriched result item from FlexSearch
 */
interface EnrichedResultItem {
  id: string;
  doc: {
    title: string;
    content: string;
    tags: string[];
    updatedAt: Date;
  };
}

/**
 * Raw search result from FlexSearch with enriched data
 */
interface FlexSearchResult {
  field: string;
  result: EnrichedResultItem[];
}

/**
 * Search result with document data
 */
export interface IndexSearchResult {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: Date;
  /** Fields that matched the query */
  matchedFields: string[];
}

// FlexSearch Document index instance
let indexInstance: FlexSearch.Document<IndexedDocument, string[]> | null = null;

/**
 * Initialize the FlexSearch index
 * Creates a new Document index configured for notes search
 */
export function initSearchIndex(): void {
  indexInstance = new FlexSearch.Document<IndexedDocument, string[]>({
    document: {
      id: 'id',
      index: ['title', 'content'],
      store: ['title', 'content', 'tags', 'updatedAt'],
    },
    tokenize: 'forward',
    resolution: 9,
  });
}

/**
 * Get the search index, initializing if necessary
 */
function getIndex(): FlexSearch.Document<IndexedDocument, string[]> {
  if (!indexInstance) {
    initSearchIndex();
  }
  return indexInstance!;
}

/**
 * Add a note to the search index
 *
 * @param note - The note to add to the index
 */
export function addToIndex(note: Note): void {
  const index = getIndex();
  index.add({
    id: note.id,
    title: note.title,
    content: note.content,
    tags: note.tags,
    updatedAt: note.updatedAt,
  });
}

/**
 * Remove a note from the search index
 *
 * @param noteId - The ID of the note to remove
 */
export function removeFromIndex(noteId: string): void {
  const index = getIndex();
  index.remove(noteId);
}

/**
 * Update a note in the search index
 * This removes the old document and adds the updated one
 *
 * @param note - The updated note
 */
export function updateInIndex(note: Note): void {
  removeFromIndex(note.id);
  addToIndex(note);
}

/**
 * Search the index for matching notes
 *
 * @param query - The search query string
 * @param limit - Maximum number of results (default: 100)
 * @returns Array of matching note data with matched fields
 */
export function searchIndex(query: string, limit = 100): IndexSearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const index = getIndex();

  // Search both title and content fields
  const results = index.search(query, {
    limit,
    enrich: true,
  }) as FlexSearchResult[];

  // Merge results from different fields, tracking which fields matched
  const resultMap = new Map<
    string,
    { doc: IndexedDocument; matchedFields: Set<string> }
  >();

  for (const fieldResult of results) {
    const field = fieldResult.field;
    for (const item of fieldResult.result) {
      // With enrich: true, each result item has id and doc
      const id = item.id;
      const doc = item.doc;

      const existing = resultMap.get(id);
      if (existing) {
        existing.matchedFields.add(field);
      } else {
        resultMap.set(id, {
          doc: {
            id,
            title: doc.title,
            content: doc.content,
            tags: doc.tags,
            updatedAt: doc.updatedAt,
          },
          matchedFields: new Set([field]),
        });
      }
    }
  }

  // Convert to array and return
  return Array.from(resultMap.values()).map(({ doc, matchedFields }) => ({
    id: doc.id,
    title: doc.title,
    content: doc.content,
    tags: doc.tags,
    updatedAt: doc.updatedAt,
    matchedFields: Array.from(matchedFields),
  }));
}

/**
 * Rebuild the entire search index from an array of notes
 * Useful for initial load or index corruption recovery
 *
 * @param notes - Array of notes to index
 */
export function rebuildIndex(notes: Note[]): void {
  initSearchIndex();
  for (const note of notes) {
    addToIndex(note);
  }
}

/**
 * Clear the search index
 * Useful for testing or resetting state
 */
export function clearIndex(): void {
  indexInstance = null;
}
