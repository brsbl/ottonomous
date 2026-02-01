/**
 * Tag parsing utilities for extracting tags from markdown content
 * Implements the algorithm specified in the Bear Notes App spec
 */

/**
 * Extract all tags from markdown content
 *
 * Tags are in the format #tag or #parent/child/grandchild
 * Tags inside code blocks (``` or `) are excluded
 *
 * @param content - The markdown content to parse
 * @returns Array of unique tags, sorted alphabetically, including parent tags
 *
 * @example
 * extractTags("Hello #work and #work/projects/alpha")
 * // Returns: ["work", "work/projects", "work/projects/alpha"]
 */
export function extractTags(content: string): string[] {
  // Match #tag or #parent/child/grandchild
  // Tags can contain alphanumeric characters, hyphens, and underscores
  const tagRegex = /#([\w-]+(?:\/[\w-]+)*)/g;

  // Match code blocks (both fenced and inline) to exclude them
  const codeBlockRegex = /```[\s\S]*?```|`[^`]+`/g;

  // Remove code blocks before matching tags
  const contentWithoutCode = content.replace(codeBlockRegex, '');

  const tags = new Set<string>();
  let match;

  while ((match = tagRegex.exec(contentWithoutCode)) !== null) {
    const fullTag = match[1];
    tags.add(fullTag);

    // Also add parent tags for hierarchy
    // e.g., "work/projects/alpha" adds "work" and "work/projects"
    const parts = fullTag.split('/');
    for (let i = 1; i < parts.length; i++) {
      tags.add(parts.slice(0, i).join('/'));
    }
  }

  return Array.from(tags).sort();
}

/**
 * Extract title from markdown content
 *
 * The title is either:
 * 1. The first H1 heading (# Title)
 * 2. The first non-empty line if no H1 exists
 *
 * @param content - The markdown content to parse
 * @returns The extracted title, or "Untitled" if content is empty
 */
export function extractTitle(content: string): string {
  if (!content.trim()) {
    return 'Untitled';
  }

  // Try to find first H1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Fall back to first non-empty line
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      // Limit title length for display
      return trimmed.length > 100 ? trimmed.substring(0, 100) + '...' : trimmed;
    }
  }

  return 'Untitled';
}
