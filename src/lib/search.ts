import Fuse, { FuseResultMatch, IFuseOptions } from 'fuse.js';
import type { Project } from '../types';

/**
 * Fuse.js options for fuzzy search on project names
 */
const fuseOptions: IFuseOptions<Project> = {
  // Search keys - primarily searching on project name
  keys: [
    { name: 'name', weight: 1.0 },
    { name: 'path', weight: 0.3 },
  ],
  // Fuzzy matching settings
  threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything
  distance: 100, // How far to look for matches
  minMatchCharLength: 2, // Minimum characters before starting search
  includeMatches: true, // Include match info for highlighting
  includeScore: true, // Include relevance score
  ignoreLocation: true, // Don't penalize matches that are far from the beginning
  findAllMatches: true, // Find all matches
};

/**
 * Search result with original project and match metadata
 */
export interface SearchResult {
  project: Project;
  score: number;
  matches: readonly FuseResultMatch[] | undefined;
}

/**
 * Search projects using fuzzy matching on project name
 * @param query - The search query string
 * @param projects - Array of projects to search
 * @returns Array of matching projects with match metadata
 */
export function searchProjects(query: string, projects: Project[]): SearchResult[] {
  // Return all projects if query is empty
  if (!query || query.trim() === '') {
    return projects.map((project) => ({
      project,
      score: 0,
      matches: undefined,
    }));
  }

  // Create Fuse instance with the projects array
  const fuse = new Fuse(projects, fuseOptions);

  // Perform search
  const results = fuse.search(query.trim());

  // Map results to our SearchResult format
  return results.map((result) => ({
    project: result.item,
    score: result.score ?? 0,
    matches: result.matches,
  }));
}

/**
 * Get just the filtered projects without match metadata
 * @param query - The search query string
 * @param projects - Array of projects to search
 * @returns Array of matching projects
 */
export function searchProjectsSimple(query: string, projects: Project[]): Project[] {
  const results = searchProjects(query, projects);
  return results.map((r) => r.project);
}

/**
 * Highlight matching text in a string based on Fuse.js match indices
 * @param text - The original text
 * @param indices - Array of [start, end] index pairs from Fuse.js
 * @returns Object with parts marked as highlighted or not
 */
export interface HighlightPart {
  text: string;
  highlighted: boolean;
}

export function getHighlightedParts(
  text: string,
  indices: readonly [number, number][] | undefined
): HighlightPart[] {
  if (!indices || indices.length === 0) {
    return [{ text, highlighted: false }];
  }

  const parts: HighlightPart[] = [];
  let lastEnd = 0;

  // Sort indices by start position
  const sortedIndices = [...indices].sort((a, b) => a[0] - b[0]);

  for (const [start, end] of sortedIndices) {
    // Add non-highlighted part before this match
    if (start > lastEnd) {
      parts.push({
        text: text.slice(lastEnd, start),
        highlighted: false,
      });
    }

    // Add highlighted match
    parts.push({
      text: text.slice(start, end + 1),
      highlighted: true,
    });

    lastEnd = end + 1;
  }

  // Add remaining non-highlighted part
  if (lastEnd < text.length) {
    parts.push({
      text: text.slice(lastEnd),
      highlighted: false,
    });
  }

  return parts;
}
