/**
 * parseOutline - Utility for parsing headings from markdown content
 * to generate a document outline/table of contents.
 */

/**
 * Represents a heading extracted from markdown content.
 */
export interface Heading {
  /** Heading level (1-6) corresponding to h1-h6 */
  level: number;
  /** The text content of the heading */
  text: string;
  /** A URL-friendly ID for anchor links */
  id: string;
}

/**
 * Represents a heading with nested children for tree structure.
 */
export interface HeadingTreeNode extends Heading {
  /** Child headings nested under this heading */
  children: HeadingTreeNode[];
}

/**
 * Generate a URL-friendly ID from heading text.
 * Converts to lowercase, removes special characters, and replaces spaces with hyphens.
 * @param text - The heading text to convert
 * @returns A URL-friendly slug
 */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Parse markdown content and extract all headings (h1-h6).
 * Handles both ATX-style (# heading) and setext-style (underline) headings.
 * @param content - The markdown content to parse
 * @returns Array of Heading objects in document order
 */
export function parseHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const lines = content.split('\n');
  const idCounts = new Map<string, number>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) continue;

    // Check for ATX-style headings (# Heading)
    const atxMatch = line.match(/^(#{1,6})\s+(.+?)(?:\s*#*\s*)?$/);
    if (atxMatch) {
      const level = atxMatch[1].length;
      const text = atxMatch[2].trim();
      const baseId = generateHeadingId(text);

      // Handle duplicate IDs by appending a number
      const count = idCounts.get(baseId) || 0;
      const id = count === 0 ? baseId : `${baseId}-${count}`;
      idCounts.set(baseId, count + 1);

      headings.push({ level, text, id });
      continue;
    }

    // Check for setext-style headings (underline with = or -)
    // Only if next line exists and current line has text
    if (i + 1 < lines.length && line.trim()) {
      const nextLine = lines[i + 1];

      // h1: text followed by line of ===
      if (/^=+\s*$/.test(nextLine)) {
        const text = line.trim();
        const baseId = generateHeadingId(text);
        const count = idCounts.get(baseId) || 0;
        const id = count === 0 ? baseId : `${baseId}-${count}`;
        idCounts.set(baseId, count + 1);

        headings.push({ level: 1, text, id });
        i++; // Skip the underline
        continue;
      }

      // h2: text followed by line of ---
      if (/^-+\s*$/.test(nextLine) && !/^(\s*[-*+]\s|[-*]{3,}|\d+\.\s)/.test(line)) {
        const text = line.trim();
        const baseId = generateHeadingId(text);
        const count = idCounts.get(baseId) || 0;
        const id = count === 0 ? baseId : `${baseId}-${count}`;
        idCounts.set(baseId, count + 1);

        headings.push({ level: 2, text, id });
        i++; // Skip the underline
        continue;
      }
    }
  }

  return headings;
}

/**
 * Build a nested tree structure from a flat list of headings.
 * Headings are nested based on their level - h2 under h1, h3 under h2, etc.
 * @param headings - Flat array of headings in document order
 * @returns Array of top-level HeadingTreeNode with nested children
 */
export function buildHeadingTree(headings: Heading[]): HeadingTreeNode[] {
  if (headings.length === 0) return [];

  const root: HeadingTreeNode[] = [];
  const stack: HeadingTreeNode[] = [];

  for (const heading of headings) {
    const node: HeadingTreeNode = { ...heading, children: [] };

    // Find the appropriate parent by going back through the stack
    // until we find a heading with a lower level (or empty stack)
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // No parent found - this is a root-level heading
      root.push(node);
    } else {
      // Add as child of the last item in the stack
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return root;
}

/**
 * Convenience function to parse content and return a tree structure.
 * @param content - The markdown content to parse
 * @returns Array of HeadingTreeNode representing the document outline
 */
export function parseOutline(content: string): HeadingTreeNode[] {
  const headings = parseHeadings(content);
  return buildHeadingTree(headings);
}

export default parseOutline;
