/**
 * Bidirectional Link Parser for Wiki-style Links
 * Provides functions to parse [[wiki-style]] links from Markdown content,
 * extract links from notes, build backlinks index, and retrieve backlinks.
 */

import type { Note, NoteLink } from '../types';

/**
 * Regular expression pattern for matching [[wiki-style]] links.
 * Handles:
 * - Basic links: [[note title]]
 * - Links with display text: [[note title|display text]]
 * - Nested brackets: [[note [[with]] brackets]]
 * - Escaped brackets: \[\[not a link\]\]
 *
 * The pattern uses a non-greedy match and excludes escaped brackets.
 */
const WIKI_LINK_PATTERN = /(?<!\\)\[\[([^\[\]\\]+(?:\\.[^\[\]\\]*)*)\]\]/g;

/**
 * Extract surrounding context for a link (approximately 50 chars on each side).
 * @param content - Full content to extract context from
 * @param linkPosition - Position where the link was found
 * @param linkLength - Length of the full link including brackets
 * @returns Context string with ellipsis if truncated
 */
function extractContext(content: string, linkPosition: number, linkLength: number): string {
  const contextRadius = 50;
  const start = Math.max(0, linkPosition - contextRadius);
  const end = Math.min(content.length, linkPosition + linkLength + contextRadius);

  let context = content.slice(start, end);

  // Add ellipsis if we're not at the boundaries
  if (start > 0) {
    context = '...' + context;
  }
  if (end < content.length) {
    context = context + '...';
  }

  // Clean up whitespace (convert newlines to spaces, collapse multiple spaces)
  context = context.replace(/\s+/g, ' ').trim();

  return context;
}

/**
 * Parse all [[wiki-style]] links from content.
 * Extracts the link target (note title) from each [[link]].
 *
 * @param content - Markdown content to parse
 * @returns Array of unique link targets (note titles)
 *
 * @example
 * parseWikiLinks('Check [[Project Notes]] and [[Ideas]]')
 * // Returns: ['Project Notes', 'Ideas']
 *
 * @example
 * parseWikiLinks('Link with [[display|alias]] text')
 * // Returns: ['display'] - alias is ignored, target is extracted
 */
export function parseWikiLinks(content: string): string[] {
  if (!content) {
    return [];
  }

  const links: string[] = [];
  const seen = new Set<string>();

  // Reset regex state for each call
  const regex = new RegExp(WIKI_LINK_PATTERN.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    let target = match[1];

    // Handle [[target|display]] syntax - extract target before pipe
    const pipeIndex = target.indexOf('|');
    if (pipeIndex !== -1) {
      target = target.slice(0, pipeIndex);
    }

    // Normalize: trim whitespace
    target = target.trim();

    // Handle escaped characters within the link
    target = target.replace(/\\(.)/g, '$1');

    // Skip empty targets
    if (!target) {
      continue;
    }

    // Deduplicate
    if (!seen.has(target)) {
      seen.add(target);
      links.push(target);
    }
  }

  return links;
}

/**
 * Extract all links from a note with full context.
 * Resolves link targets to actual note IDs when possible.
 *
 * @param note - Source note to extract links from
 * @param allNotes - Array of all notes for resolving link targets
 * @returns Array of NoteLink objects with resolved target IDs and context
 *
 * @example
 * const links = extractLinks(sourceNote, allNotes);
 * // Returns: [{ sourceId: 'abc', targetId: 'xyz', context: '...see [[Project Notes]] for...' }]
 */
export function extractLinks(note: Note, allNotes: Note[]): NoteLink[] {
  if (!note.content) {
    return [];
  }

  const links: NoteLink[] = [];
  const seenTargets = new Set<string>();

  // Build a case-insensitive lookup map for note titles
  const titleToNote = new Map<string, Note>();
  for (const n of allNotes) {
    titleToNote.set(n.title.toLowerCase(), n);
  }

  // Reset regex state
  const regex = new RegExp(WIKI_LINK_PATTERN.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(note.content)) !== null) {
    let target = match[1];

    // Handle [[target|display]] syntax
    const pipeIndex = target.indexOf('|');
    if (pipeIndex !== -1) {
      target = target.slice(0, pipeIndex);
    }

    // Normalize: trim and handle escaped chars
    target = target.trim().replace(/\\(.)/g, '$1');

    if (!target) {
      continue;
    }

    // Skip duplicates within the same note
    const normalizedTarget = target.toLowerCase();
    if (seenTargets.has(normalizedTarget)) {
      continue;
    }
    seenTargets.add(normalizedTarget);

    // Try to find the target note (case-insensitive match on title)
    const targetNote = titleToNote.get(normalizedTarget);

    if (targetNote && targetNote.id !== note.id) {
      // Extract context around this link
      const context = extractContext(note.content, match.index, match[0].length);

      links.push({
        sourceId: note.id,
        targetId: targetNote.id,
        context,
      });
    }
  }

  return links;
}

/**
 * Build a complete backlinks index from all notes.
 * Maps each note ID to an array of NoteLinks pointing to that note.
 *
 * @param notes - Array of all notes to build index from
 * @returns Map where key is targetId and value is array of backlinks to that note
 *
 * @example
 * const index = buildBacklinksIndex(allNotes);
 * const backlinks = index.get('note-id-123');
 * // Returns array of NoteLinks where other notes link to note-id-123
 */
export function buildBacklinksIndex(notes: Note[]): Map<string, NoteLink[]> {
  const index = new Map<string, NoteLink[]>();

  // Initialize empty arrays for all notes
  for (const note of notes) {
    index.set(note.id, []);
  }

  // Extract links from each note and populate the index
  for (const note of notes) {
    const links = extractLinks(note, notes);

    for (const link of links) {
      const backlinks = index.get(link.targetId);
      if (backlinks) {
        backlinks.push(link);
      }
    }
  }

  return index;
}

/**
 * Get all backlinks for a specific note from a pre-built index.
 *
 * @param noteId - ID of the note to get backlinks for
 * @param index - Pre-built backlinks index from buildBacklinksIndex()
 * @returns Array of NoteLinks pointing to the specified note
 *
 * @example
 * const index = buildBacklinksIndex(allNotes);
 * const backlinks = getBacklinks('note-123', index);
 * // Returns all notes that link to note-123 with their context
 */
export function getBacklinks(noteId: string, index: Map<string, NoteLink[]>): NoteLink[] {
  return index.get(noteId) || [];
}

/**
 * Find all notes that a given note links to (forward links).
 * Useful for navigation and graph visualization.
 *
 * @param note - Source note to get forward links from
 * @param allNotes - Array of all notes for resolving targets
 * @returns Array of notes that the source note links to
 */
export function getForwardLinks(note: Note, allNotes: Note[]): Note[] {
  const links = extractLinks(note, allNotes);
  const linkedNotes: Note[] = [];
  const noteMap = new Map(allNotes.map(n => [n.id, n]));

  for (const link of links) {
    const targetNote = noteMap.get(link.targetId);
    if (targetNote) {
      linkedNotes.push(targetNote);
    }
  }

  return linkedNotes;
}
